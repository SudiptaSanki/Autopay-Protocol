#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Subscription {
    pub creator: Address,
    pub amount: i128,
    pub interval: u64,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Sub(u64), // Maps subscription ID to Subscription
    Counter,  // Tracks the next subscription ID
}

#[contract]
pub struct SubscriptionContract;

#[contractimpl]
impl SubscriptionContract {
    pub fn create_subscription(env: Env, creator: Address, amount: i128, interval: u64) -> u64 {
        creator.require_auth();

        if amount <= 0 {
            panic!("InvalidAmount: Amount must be greater than 0");
        }

        let mut next_id: u64 = env.storage().instance().get(&DataKey::Counter).unwrap_or(0);
        next_id += 1;

        let sub = Subscription {
            creator: creator.clone(),
            amount,
            interval,
            active: true,
        };

        env.storage().instance().set(&DataKey::Sub(next_id), &sub);
        env.storage().instance().set(&DataKey::Counter, &next_id);

        env.events()
            .publish((symbol_short!("Created"), next_id), sub);

        next_id
    }

    pub fn cancel_subscription(env: Env, creator: Address, id: u64) {
        creator.require_auth();

        let mut sub: Subscription = env
            .storage()
            .instance()
            .get(&DataKey::Sub(id))
            .expect("Subscription not found");

        if sub.creator != creator {
            panic!("Unauthorized: Not the creator");
        }

        sub.active = false;
        env.storage().instance().set(&DataKey::Sub(id), &sub);

        env.events()
            .publish((symbol_short!("Cancelled"), id), sub);
    }

    pub fn get_subscription(env: Env, id: u64) -> Subscription {
        env.storage()
            .instance()
            .get(&DataKey::Sub(id))
            .expect("Subscription not found")
    }
}
