//! This program is used to get RaDEX up and running whenever changes are made to the core codebase of the blueprints. 
//! This program does the following:
//!
//! 1. Creates a new account component from the passed keys.
//! 2. Compiles the entire package of RaDEX and gets the required WASM files.
//! 3. Publishes the RaDEX package to the PTE.
//! 4. Creates a new faucet component and requests funds from the faucet.
//! 5. Creates a number of liquidity pools required to begin the trading on the DEX.

use radix_engine::model::{SignedTransaction, Instruction};
use radix_engine::transaction::TransactionBuilder;
use scrypto::prelude::*;

use std::fs;
use std::path::PathBuf;
use std::io::prelude::*;

use serde::{Deserialize, Serialize};

mod secrets;
mod utils;

// Used for quick Nonce generation
use rand::Rng;

fn main() {
    // Converting the string key-pair to their appropriate types
    let public_key: EcdsaPublicKey =
        EcdsaPublicKey::try_from(secrets::PUBLIC_KEY.as_ref()).unwrap();
    let private_key: EcdsaPrivateKey = EcdsaPrivateKey::from_bytes(&secrets::PRIVATE_KEY).unwrap();

    // Creating a new account component with the typical access rules
    let withdraw_auth: AccessRule = rule!(require(scrypto::resource::NonFungibleAddress::new(
        ECDSA_TOKEN,
        scrypto::resource::NonFungibleId::from_bytes(public_key.to_vec())
    )));
    let account_component_address: ComponentAddress = new_account(withdraw_auth).unwrap().new_components()[0];
    println!("New account address is: {:?}", account_component_address);

    // Getting the path of the current executable. We assume that the
    let relative_blueprints_path: PathBuf = PathBuf::from("../scrypto-package");
    let absolute_blueprints_path: PathBuf = fs::canonicalize(relative_blueprints_path).unwrap();

    // Compiling the package and publishing it to the PTE
    let package_address: PackageAddress = {
        let compiled_package: Vec<u8> = compile_package!(absolute_blueprints_path);
        let package_publishing_tx: SignedTransaction = TransactionBuilder::new()
            .publish_package(compiled_package.as_ref())
            .build(rand::thread_rng().gen_range(0..100))
            .sign([]);
        let package_publishing_receipt: Receipt = submit_transaction(&package_publishing_tx).unwrap();
        
        package_publishing_receipt.new_packages()[0]
    };
    println!("Published the package to: {:?}", package_address);

    // Creating the faucet component and getting the new tokens created by the faucet
    let faucet_instantiation_tx: SignedTransaction = TransactionBuilder::new()
        .call_function(package_address, "Faucet", "instantiate_faucet", args![])
        .call_method_with_all_resources(account_component_address, "deposit_batch")
        .build(rand::thread_rng().gen_range(0..100))
        .sign([]);
    let faucet_instantiation_receipt: Receipt = submit_transaction(&faucet_instantiation_tx).unwrap();
    
    let faucet_component_address: ComponentAddress = faucet_instantiation_receipt.new_components()[0];
    let faucet_newly_created_tokens: Vec<ResourceAddress> = faucet_instantiation_receipt.new_resources();

    let (
        _,
        bitcoin_resource_address,
        ethereum_resource_address,
        tether_resource_address,
        bnb_resource_address,
        _cardano_resource_address,
    ) = (faucet_newly_created_tokens[0], faucet_newly_created_tokens[1], faucet_newly_created_tokens[2], faucet_newly_created_tokens[3], faucet_newly_created_tokens[4], faucet_newly_created_tokens[5]);

    // Creating a new RaDEX component which will be our main component for the DEX
    let radex_instantiation_tx: SignedTransaction = TransactionBuilder::new()
        .call_function(package_address, "RaDEX", "new", args![])
        .build(rand::thread_rng().gen_range(0..100))
        .sign([]);
    let radex_instantiation_receipt: Receipt = submit_transaction(&radex_instantiation_tx).unwrap();
    let radex_component_address: ComponentAddress = radex_instantiation_receipt.new_components()[0];

    // Liquidity pool creation
    let liquidity_amounts: Vec<(ResourceAddress, Decimal, ResourceAddress, Decimal)> = vec![
        (bitcoin_resource_address, dec!("2.8232784"), RADIX_TOKEN, 1_000_000.into()),
        (ethereum_resource_address, dec!("41.49795699"), RADIX_TOKEN, 1_000_000.into()),
        (tether_resource_address, dec!("85417"), RADIX_TOKEN, 1_000_000.into()),
        (bnb_resource_address, dec!("258.8440399999"), RADIX_TOKEN, 1_000_000.into()),
    ];

    let mut transaction_builder: &mut TransactionBuilder = &mut TransactionBuilder::new();
    for (resource_address1, amount1, resource_address2, amount2) in liquidity_amounts.into_iter() {
        transaction_builder = transaction_builder.call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
            .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
            .withdraw_from_account_by_amount( amount1, resource_address1, account_component_address)
            .withdraw_from_account_by_amount( amount2, resource_address2, account_component_address)
            .take_from_worktop(resource_address1, |builder, bucket_id1| {
                builder.take_from_worktop(resource_address2, |builder, bucket_id2| {
                    builder.call_method(radex_component_address, "new_liquidity_pool", args![
                        scrypto::resource::Bucket(bucket_id1),
                        scrypto::resource::Bucket(bucket_id2)
                    ])
                })
            })
    }

    let pool_instantiation_tx: SignedTransaction = transaction_builder
        .call_method_with_all_resources(account_component_address, "deposit_batch")
        .build(rand::thread_rng().gen_range(0..100))
        .sign([&private_key]);
    let pool_instantiation_receipt: Receipt = submit_transaction(&pool_instantiation_tx).unwrap();
    println!("Pools created in: {:?}", pool_instantiation_receipt);

    // Writing all of the important information to a new file in the src directory called
    // constants.js
    let relative_react_src_path: PathBuf = PathBuf::from("../src");
    let absolute_react_src_path: PathBuf = fs::canonicalize(relative_react_src_path).unwrap();

    let mut file = fs::File::create(absolute_react_src_path.join("constants.js")).unwrap();
    for (name, value) in [
        ("PACKAGE_ADDRESS", package_address.to_string()),
        ("ACCOUNT_COMPONENT_ADDRESS", account_component_address.to_string()),
        ("FAUCET_COMPONENT_ADDRESS", faucet_component_address.to_string()),
        ("RADEX_COMPONENT_ADDRESS", radex_component_address.to_string())
    ] {
        file.write_all(format!("export const {} = \"{}\";\n", name, value).as_bytes()).unwrap();
    }
}

// =====================================================================================================================
// Additional code required for interacting with the PTE API.
// =====================================================================================================================

/// Submits the transaction to the PTE01 server.
pub fn submit_transaction(transaction: &SignedTransaction) -> Result<Receipt, TransactionSubmissionError> {
    // Getting the nonce used in the transaction from the transaction object itself
    let nonce: u64 = {
        let nonce_instructions: Vec<Instruction> = transaction.transaction.instructions
            .iter()
            .filter(|x| {
                match x {
                    Instruction::Nonce { nonce: _ } => true,
                    _ => false
                }
            })
            .cloned()
            .collect();

        if nonce_instructions.len() == 0 {
            Err(TransactionSubmissionError::NoNonceFound)
        } 
        else if nonce_instructions.len() == 1{ 
            if let Instruction::Nonce { nonce } = nonce_instructions[0] {
                Ok(nonce)
            } else {
                panic!("Expected a nonce");
            }
        } 
        else {
            Err(TransactionSubmissionError::MultipleNonceFound)
        }
    }?;
    let nonce: Nonce = Nonce { value: nonce };

    let signatures: Vec<Signature> = transaction.signatures
        .iter()
        .map(|x| Signature{
            public_key: x.0.to_string(), 
            signature: x.1.to_string()
        })
        .collect();

    // Creating the transaction body object which is what will be submitted to the PTE
    let transaction_body: TransactionBody = TransactionBody {
        manifest: utils::decompile(&transaction.transaction)?,
        nonce: nonce,
        signatures: signatures
    };

    // Submitting the transaction to the PTE's `/transaction` endpoint
    let receipt: Receipt = reqwest::blocking::Client::new()
        .post("https://pte01.radixdlt.com/transaction")
        .json(&transaction_body)
        .send()?
        .json()?;

    return Ok(receipt);
}

/// Creates a new account component from the passed arguments
pub fn new_account(
    withdraw_rule: AccessRule
) -> Result<Receipt, TransactionSubmissionError> {
    // Building the transaction for the account creation
    let random_nonce: u64 = rand::thread_rng().gen_range(0..100);
    let account_creation_tx: SignedTransaction = TransactionBuilder::new()
        .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
        .take_from_worktop(RADIX_TOKEN, |builder, bucket_id| {
            builder.new_account_with_resource(&withdraw_rule, bucket_id)
        })
        .build(random_nonce)
        .sign([]);
        // .sign([&private_key]);
    
    return submit_transaction(&account_creation_tx);
}

/// A struct which describes the Nonce. Required for the TransactionBody struct
#[derive(Serialize, Deserialize, Debug)]
pub struct Nonce {
    value: u64,
}

/// A struct which defines the signature used in the TransactionBody struct.
#[derive(Serialize, Deserialize, Debug)]
pub struct Signature {
    public_key: String,
    signature: String,
}

/// A struct which defines the transaction payload that the PTE's API accepts.
#[derive(Serialize, Deserialize, Debug)]
pub struct TransactionBody {
    manifest: String,
    nonce: Nonce,
    signatures: Vec<Signature>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Receipt {
    pub transaction_hash: String,
    pub status: String,
    pub outputs: Vec<String>,
    pub logs: Vec<String>,
    pub new_packages: Vec<String>,
    pub new_components: Vec<String>,
    pub new_resources: Vec<String>,
}

impl Receipt {
    pub fn new_packages(&self) -> Vec<PackageAddress> {
        return self.new_packages
            .iter()
            .map(|x| PackageAddress::from_str(x).unwrap())
            .collect()
    }
    
    pub fn new_components(&self) -> Vec<ComponentAddress> {
        return self.new_components
            .iter()
            .map(|x| ComponentAddress::from_str(x).unwrap())
            .collect()
    }
    
    pub fn new_resources(&self) -> Vec<ResourceAddress> {
        return self.new_resources
            .iter()
            .map(|x| ResourceAddress::from_str(x).unwrap())
            .collect()
    }
}

/// An enum of the errors which could occur when submitting a transaction to the PTE API.
#[derive(Debug)]
pub enum TransactionSubmissionError {
    NoNonceFound,
    MultipleNonceFound,
    DecompileError(utils::DecompileError),
    HttpRequestError(reqwest::Error)
}

impl From<utils::DecompileError> for TransactionSubmissionError {
    fn from(error: utils::DecompileError) -> TransactionSubmissionError {
        TransactionSubmissionError::DecompileError(error)
    }
}

impl From<reqwest::Error> for TransactionSubmissionError {
    fn from(error: reqwest::Error) -> TransactionSubmissionError {
        TransactionSubmissionError::HttpRequestError(error)
    }
}