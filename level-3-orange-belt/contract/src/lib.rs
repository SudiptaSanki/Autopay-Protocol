#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token, Vec
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Subscription {
    pub subscriber: Address,
    pub merchant: Address,
    pub token: Address,
    pub amount: i128,
    pub interval: u64,       // interval in seconds
    pub next_charge_time: u64,
    pub active: bool,
}

#[contract]
pub struct AutopayContract;

#[contractimpl]
impl AutopayContract {
    /// Creates a new subscription. The subscriber must authorize this call.
    pub fn create_subscription(
        env: Env,
        subscriber: Address,
        merchant: Address,
        token: Address,
        amount: i128,
        interval: u64,
    ) {
        subscriber.require_auth();

        let current_time = env.ledger().timestamp();
        let sub = Subscription {
            subscriber: subscriber.clone(),
            merchant: merchant.clone(),
            token: token.clone(),
            amount,
            interval,
            next_charge_time: current_time + interval,
            active: true,
        };

        // Create a unique key for the subscription based on subscriber + merchant
        let key = (symbol_short!("Sub"), subscriber.clone(), merchant.clone());
        env.storage().persistent().set(&key, &sub);

        // Emit an event
        env.events()
            .publish((symbol_short!("Sub"), symbol_short!("Created")), (subscriber, merchant, amount));
    }

    /// Triggers the recurring charge if the interval has passed.
    /// Can be called by anyone (like a cron job/relayer)
    pub fn charge(env: Env, subscriber: Address, merchant: Address) {
        let key = (symbol_short!("Sub"), subscriber.clone(), merchant.clone());
        let mut sub: Subscription = env.storage().persistent().get(&key).expect("Subscription not found");

        if !sub.active {
            panic!("Subscription is not active");
        }

        let current_time = env.ledger().timestamp();
        if current_time < sub.next_charge_time {
            panic!("Charge is not due yet");
        }

        // We use the token client to perform the transfer.
        // NOTE: The subscriber must have granted an allowance to the contract address first,
        // or the transaction must be structured as a pre-authorized transaction.
        // Here we assume the subscriber has granted allowance to the contract.
        let token_client = token::Client::new(&env, &sub.token);
        
        // Transfer from subscriber to merchant
        token_client.transfer_from(
            &env.current_contract_address(),
            &sub.subscriber,
            &sub.merchant,
            &sub.amount,
        );

        // Update the next charge time
        sub.next_charge_time = current_time + sub.interval;
        env.storage().persistent().set(&key, &sub);

        // Emit charge event
        env.events()
            .publish((symbol_short!("Sub"), symbol_short!("Charged")), (subscriber, merchant, sub.amount));
    }

    /// Cancels a subscription. Can be called by subscriber or merchant.
    pub fn cancel(env: Env, caller: Address, subscriber: Address, merchant: Address) {
        caller.require_auth();

        if caller != subscriber && caller != merchant {
            panic!("Only subscriber or merchant can cancel");
        }

        let key = (symbol_short!("Sub"), subscriber.clone(), merchant.clone());
        let mut sub: Subscription = env.storage().persistent().get(&key).expect("Subscription not found");

        sub.active = false;
        env.storage().persistent().set(&key, &sub);

        env.events()
            .publish((symbol_short!("Sub"), symbol_short!("Canceled")), (subscriber, merchant));
    }

    /// Gets subscription details
    pub fn get_subscription(env: Env, subscriber: Address, merchant: Address) -> Subscription {
        let key = (symbol_short!("Sub"), subscriber, merchant);
        env.storage().persistent().get(&key).expect("Subscription not found")
    }
}

mod test;
