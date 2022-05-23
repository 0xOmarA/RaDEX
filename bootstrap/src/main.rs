//! This program is used to get RaDEX up and running whenever changes are made to the core codebase
//! of the blueprints. This program does the following:
//!
//! 1. Compiles the entire package of RaDEX and gets the required WASM files.

// Contains the API keys required for the CMC API.
use radix_engine::model::SignedTransaction;
use radix_engine::transaction::TransactionBuilder;
use scrypto::prelude::*;
use scrypto::types::ScryptoType::NonFungibleAddress;

use std::fs;
use std::path::PathBuf;
use std::io::prelude::*;

use serde::{Deserialize, Serialize};

mod secrets;
mod utils;

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
    let account_component_address: ComponentAddress = ComponentAddress::from_str(
        perform_transaction(
            TransactionBuilder::new()
                .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
                .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
                .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
                .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
                .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
                .call_method(SYSTEM_COMPONENT, "free_xrd", vec![])
                .take_from_worktop(RADIX_TOKEN, |builder, bucket_id| {
                    builder.new_account_with_resource(&withdraw_auth, bucket_id)
                }),
            &private_key,
            &public_key,
        )
        .new_components[0]
            .as_str(),
    )
    .unwrap();
    println!("New account address is: {:?}", account_component_address);

    // Getting the path of the current executable. We assume that the
    let relative_blueprints_path: PathBuf = PathBuf::from("../scrypto-package");
    let absolute_blueprints_path: PathBuf = fs::canonicalize(relative_blueprints_path).unwrap();

    // Getting the code of the compiled package and publishing the package ot the simulator
    let compiled_package: Vec<u8> = compile_package!(absolute_blueprints_path);

    let res: Receipt = perform_transaction(
        TransactionBuilder::new().publish_package(compiled_package.as_ref()),
        &private_key,
        &public_key,
    );

    let package_address: PackageAddress =
        PackageAddress::from_str(res.new_packages[0].as_str()).unwrap();
    println!("Published the package to: {:?}", package_address);

    // Create a new faucet component
    let faucet_instantiation: Receipt = perform_transaction(
        TransactionBuilder::new()
            .call_function(package_address, "Faucet", "instantiate_faucet", args![])
            .call_method_with_all_resources(account_component_address, "deposit_batch"),
        &private_key,
        &public_key,
    );
    let faucet_component: ComponentAddress =
        ComponentAddress::from_str(faucet_instantiation.new_components[0].as_str()).unwrap();

    // Creating a new RaDEX component which will be our main component for the DEX
    let radex_instantiation: Receipt = perform_transaction(
        TransactionBuilder::new()
            .call_function(package_address, "RaDEX", "new", args![]),
        &private_key,
        &public_key,
    );
    let radex_component: ComponentAddress =
        ComponentAddress::from_str(radex_instantiation.new_components[0].as_str()).unwrap();

    // Writing all of the important information to a new file in the src directory called
    // constants.js
    let relative_react_src_path: PathBuf = PathBuf::from("../src");
    let absolute_react_src_path: PathBuf = fs::canonicalize(relative_react_src_path).unwrap();

    let mut file = fs::File::create(absolute_react_src_path.join("constants.js")).unwrap();
    for (name, value) in [
        ("PACKAGE_ADDRESS", package_address.to_string()),
        ("ACCOUNT_COMPONENT_ADDRESS", account_component_address.to_string()),
        ("FAUCET_COMPONENT_ADDRESS", faucet_component.to_string()),
        ("RADEX_COMPONENT_ADDRESS", radex_component.to_string())
    ] {
        file.write_all(format!("export const {} = \"{}\";\n", name, value).as_bytes()).unwrap();
    }


}

pub fn perform_transaction(
    transaction: &mut TransactionBuilder,
    private_key: &EcdsaPrivateKey,
    public_key: &EcdsaPublicKey,
) -> Receipt {
    // Building the transaction used for the publishing of the package to the test environment.
    let nonce: u64 = 12; // Hardcoded for now for predictable outputs
    let tx: SignedTransaction = transaction.build(nonce).sign([private_key]);
    let tx_string: String = utils::decompile(&tx.transaction).unwrap();

    let tx_body: TransactionBody = TransactionBody {
        manifest: tx_string.clone(),
        nonce: Nonce { value: nonce },
        signatures: vec![Signature {
            public_key: public_key.to_string(),
            signature: tx.signatures[0].1.to_string(),
        }],
    };

    let res: Receipt = reqwest::blocking::Client::new()
        .post("https://pte01.radixdlt.com/transaction")
        .json(&tx_body)
        .send()
        .unwrap()
        .json()
        .unwrap();

    return res;
}

// Structs required for serde_json and making requests
#[derive(Serialize, Deserialize)]
pub struct Nonce {
    value: u64,
}

#[derive(Serialize, Deserialize)]
pub struct Signature {
    public_key: String,
    signature: String,
}

#[derive(Serialize, Deserialize)]
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
