use scrypto::prelude::*;

blueprint! {
    /// A simple faucet which creates a number of tokens and allows callers to then tokens from the faucet. The faucet
    /// does not hold the total supply of the tokens. Instead, the faucet mints additional tokens on the fly when
    /// they're needed. While this would be a very bad idea in a real life faucet, this faucet is on the PTE and does
    /// not dispense any valuable assets. So, what could go wrong? :D
    struct Faucet {
        resource_addresses: Vec<ResourceAddress>,
        admin_badge: Vault,
    }

    impl Faucet {
        /// Creates the faucet and returns a bucket of the newly created tokens.
        pub fn instantiate_faucet() -> (ComponentAddress, Vec<Bucket>) {
            // The admin badge used to mint the tokens
            let admin_badge: Bucket = ResourceBuilder::new_fungible()
                .divisibility(DIVISIBILITY_NONE)
                .metadata("name", "Admin Badge")
                .initial_supply(1);

            // Creating the tokens according to the information given.
            let buckets: Vec<Bucket> = [
                (
                    "Bitcoin", 
                    "BTC", 
                    "Bitcoin is a decentralized cryptocurrency originally described in a 2008 whitepaper by a person, or group of people, using the alias Satoshi Nakamoto. It was launched soon after, in January 2009.",
                    "https://s2.coinmarketcap.com/static/img/coins/128x128/1.png",
                    19_046_562
                ),
                (
                    "Ethereum", 
                    "ETH", 
                    "Ethereum is a decentralized open-source blockchain system that features its own cryptocurrency, Ether. ETH works as a platform for numerous other cryptocurrencies, as well as for the execution of decentralized smart contracts.",
                    "https://s2.coinmarketcap.com/static/img/coins/128x128/1027.png",
                    120_880_858
                ),
                (
                    "Tether", 
                    "USDT", 
                    "USDT is a stablecoin (stable-value cryptocurrency) that mirrors the price of the U.S. dollar, issued by a Hong Kong-based company Tether. The token's peg to the USD is achieved via maintaining a sum of commercial paper, fiduciary deposits, cash, reserve repo notes, and treasury bills in reserves that is equal in USD value to the number of USDT in circulation.",
                    "https://s2.coinmarketcap.com/static/img/coins/128x128/825.png",
                    73_280_000_000
                ),
                (
                    "BNB", 
                    "BNB", 
                    "Launched in July 2017, Binance is the biggest cryptocurrency exchange globally based on daily trading volume. Binance aims to bring cryptocurrency exchanges to the forefront of financial activity globally. The idea behind Binance's name is to show this new paradigm in global finance — Binary Finance, or Binance.",
                    "https://s2.coinmarketcap.com/static/img/coins/128x128/1839.png",
                    163_276_974
                ),
                (
                    "Cardano", 
                    "ADA", 
                    "Cardano is a proof-of-stake blockchain platform that says its goal is to allow “changemakers, innovators and visionaries” to bring about positive global change.",
                    "https://s2.coinmarketcap.com/static/img/coins/128x128/2010.png",
                    33_740_000_000
                ),
            ]
            .iter()
            .map(|(name, symbol, description, icon_url, initial_supply)| {
                Self::quick_token_creation(
                    name.to_string(),
                    symbol.to_string(),
                    description.to_string(),
                    icon_url.to_string(),
                    *initial_supply,
                    rule!(require(admin_badge.resource_address()))
                )
            })
            .collect();

            // Creating the faucet component which will mint the above created tokens in the future upon request
            let faucet_component: ComponentAddress = Self {
                resource_addresses: buckets.iter().map(|x| x.resource_address()).collect(),
                admin_badge: Vault::with_bucket(admin_badge)
            }
            .instantiate()
            .globalize();

            return (
                faucet_component,
                buckets
            )
        }

        /// Used to request funds from the faucet of a user-specified amount
        pub fn get_tokens(&self, amount: i128) -> Vec<Bucket> {
            self.admin_badge.authorize(|| {
                self.resource_addresses
                    .iter()
                    .map(|x| borrow_resource_manager!(*x).mint(amount))
                    .collect()
            })
        }

        /// Quickly creates a new token with the default configurations required for quick faucet operation.
        pub fn quick_token_creation(
            name: String, 
            symbol: String, 
            description: String, 
            icon_url: String, 
            initial_supply: i128,
            authority: AccessRule
        ) -> Bucket {
            ResourceBuilder::new_fungible()
                .metadata("name", name)
                .metadata("symbol", symbol)
                .metadata("description", description)
                .metadata("icon_url", icon_url)
                .mintable(authority.clone(), LOCKED)
                .initial_supply(initial_supply)
        }
    }
}
