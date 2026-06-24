#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, token};

#[test]
fn test_subscription_creation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AutopayContract);
    let client = AutopayContractClient::new(&env, &contract_id);

    let subscriber = Address::generate(&env);
    let merchant = Address::generate(&env);
    let token = Address::generate(&env);
    
    let amount = 100_0000000; // 100 tokens
    let interval = 86400 * 30; // 30 days

    client.create_subscription(&subscriber, &merchant, &token, &amount, &interval);

    let sub = client.get_subscription(&subscriber, &merchant);
    assert_eq!(sub.subscriber, subscriber);
    assert_eq!(sub.merchant, merchant);
    assert_eq!(sub.amount, amount);
    assert_eq!(sub.interval, interval);
    assert_eq!(sub.active, true);
}

#[test]
fn test_subscription_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AutopayContract);
    let client = AutopayContractClient::new(&env, &contract_id);

    let subscriber = Address::generate(&env);
    let merchant = Address::generate(&env);
    let token = Address::generate(&env);
    
    client.create_subscription(&subscriber, &merchant, &token, &1000, &86400);

    // Cancel by subscriber
    client.cancel(&subscriber, &subscriber, &merchant);

    let sub = client.get_subscription(&subscriber, &merchant);
    assert_eq!(sub.active, false);
}

#[test]
#[should_panic(expected = "Subscription not found")]
fn test_get_nonexistent_subscription() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AutopayContract);
    let client = AutopayContractClient::new(&env, &contract_id);

    let subscriber = Address::generate(&env);
    let merchant = Address::generate(&env);

    client.get_subscription(&subscriber, &merchant);
}

