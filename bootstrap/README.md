# Bootstrapping

To understand the need for this program, it's necessary that you first understand the problems that this program solves. At the current moment of time, programmatic interactions with the PTE is not something easy, especially for transactions which require a signature.

When making any changes to the DEX's blueprints, the blueprints need to be redeployed, faucet needs to be re-instantiated (which creates a number of new resources), and liquidity pools need to be re-created. However, with programmatic interactions with the PTE not being easy, the process of bootstrapping the package and getting the components on the PTE was also not easy.

This program uses the `TransactionBuilder` seen in Scrypto unit-tests along with a number of new JSON serializable types to allow for transactions to be programmatically built, signed, and submitted to the PTE. The following code snippet shows how this program builds transactions and how they get submitted to the PTE.

```rust
let faucet_instantiation_nonce: u64 = rand::thread_rng().gen_range(0..100);
let faucet_instantiation_tx: SignedTransaction = TransactionBuilder::new()
    .call_function(package_address, "Faucet", "instantiate_faucet", args![])
    .call_method_with_all_resources(account_component_address, "deposit_batch")
    .build(faucet_instantiation_nonce)
    .sign([]);
let faucet_instantiation_receipt: Receipt = submit_transaction(&faucet_instantiation_tx).unwrap();
```

As can be seen in the code snippet above, the same `TransactionBuilder` from the unit-tests is being used to build a transaction, add a nonce to it, and sign it to yield a `SignedTransaction`. Then, this signed transaction is passed to the `submit_transaction` function to submit it to the PTE and return back a `Receipt` of the transaction.

This is an executable rust crate which does the following:

- Creates a new account component with the default withdraw rules that allow the withdraw if a specific ECDSA virtual badge is present.

- Compiles RaDEX's package and publishes it to the PTE. 

- Instantiates a new faucet component from the RaDEX package.

- Creates a new RaDEX component and creates a number of liquidity pools in the component to allow for initial trading of assets.

- Saves all of the important addresses to a `constants.js` file so that they can be used by the react frontend. 