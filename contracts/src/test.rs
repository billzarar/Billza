#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, token, symbol_short, Address, Env, String};

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (Address, token::Client<'a>, token::StellarAssetClient<'a>) {
    let contract_id = e.register_stellar_asset_contract_v2(admin.clone()).address();
    let client = token::Client::new(e, &contract_id);
    let admin_client = token::StellarAssetClient::new(e, &contract_id);
    (contract_id, client, admin_client)
}

#[test]
fn test_initialize_and_fee_config() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BillzaContract, ());
    let client = BillzaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);

    client.initialize(&admin, &fee_recipient, &50); // 0.5%

    let (saved_recipient, saved_bps) = client.get_fee_config();
    assert_eq!(saved_recipient, Some(fee_recipient));
    assert_eq!(saved_bps, 50);
}

#[test]
fn test_register_and_pay_one_time_bill() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000_000);

    let contract_id = env.register(BillzaContract, ());
    let billza = BillzaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    billza.initialize(&admin, &fee_recipient, &0); // 0% fee

    let token_admin = Address::generate(&env);
    let (token_id, token_client, token_admin_client) = create_token_contract(&env, &token_admin);

    let payer = Address::generate(&env);
    let utility_provider = Address::generate(&env);

    // Mint tokens to payer
    token_admin_client.mint(&payer, &100_000_0000000);

    let bill_id = symbol_short!("ELEC_001");
    let amount: i128 = 50_000_0000000;
    let due_date = 1_000_000 + 86400 * 7;

    // Register bill
    billza.register_bill(
        &payer,
        &bill_id,
        &utility_provider,
        &token_id,
        &amount,
        &due_date,
        &0, // OneTime
    );

    let bill = billza.get_bill(&bill_id).expect("Bill should exist");
    assert_eq!(bill.status, 0); // Unpaid
    assert_eq!(bill.amount, amount);
    assert_eq!(bill.recipient, utility_provider);

    // Pay bill
    let ref_str = String::from_str(&env, "BILLZA-ELEC-TX01");
    billza.pay_bill(&payer, &bill_id, &token_id, &amount, &ref_str);

    // Assert balances
    assert_eq!(token_client.balance(&utility_provider), amount);
    assert_eq!(token_client.balance(&payer), 50_000_0000000);

    // Assert updated bill
    let paid_bill = billza.get_bill(&bill_id).unwrap();
    assert_eq!(paid_bill.status, 1); // Paid
    assert_eq!(paid_bill.occurrence_count, 1);
    assert_eq!(paid_bill.reference, ref_str);

    // Check stats
    let (total_paid, volume) = billza.get_stats(&token_id);
    assert_eq!(total_paid, 1);
    assert_eq!(volume, amount);
}

#[test]
fn test_recurring_bill_advancement() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000_000);

    let contract_id = env.register(BillzaContract, ());
    let billza = BillzaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    billza.initialize(&admin, &admin, &0);

    let token_admin = Address::generate(&env);
    let (token_id, _, token_admin_client) = create_token_contract(&env, &token_admin);

    let payer = Address::generate(&env);
    let internet_provider = Address::generate(&env);

    token_admin_client.mint(&payer, &100_000_0000000);

    let bill_id = symbol_short!("NET_001");
    let amount: i128 = 20_000_0000000;
    let initial_due = 1_000_000 + 86400 * 30;

    // Monthly recurring bill (frequency = 2)
    billza.register_bill(
        &payer,
        &bill_id,
        &internet_provider,
        &token_id,
        &amount,
        &initial_due,
        &2, // Monthly
    );

    // First payment
    let ref_str = String::from_str(&env, "BILLZA-NET-MONTH1");
    billza.pay_bill(&payer, &bill_id, &token_id, &amount, &ref_str);

    let updated_bill = billza.get_bill(&bill_id).unwrap();
    // For recurring, status resets to 0 (Unpaid) for the next cycle, due_date advanced
    assert_eq!(updated_bill.status, 0);
    assert_eq!(updated_bill.occurrence_count, 1);
    assert_eq!(updated_bill.due_date, 1_000_000 + 30 * 86400);

    // Second payment
    env.ledger().set_timestamp(1_000_000 + 30 * 86400);
    let ref_str2 = String::from_str(&env, "BILLZA-NET-MONTH2");
    billza.pay_bill(&payer, &bill_id, &token_id, &amount, &ref_str2);

    let updated_bill2 = billza.get_bill(&bill_id).unwrap();
    assert_eq!(updated_bill2.occurrence_count, 2);
    assert_eq!(updated_bill2.due_date, 1_000_000 + 60 * 86400);
}

#[test]
fn test_direct_payment() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(2_000_000);

    let contract_id = env.register(BillzaContract, ());
    let billza = BillzaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let fee_recipient = Address::generate(&env);
    billza.initialize(&admin, &fee_recipient, &100); // 1% fee (100 bps)

    let token_admin = Address::generate(&env);
    let (token_id, token_client, token_admin_client) = create_token_contract(&env, &token_admin);

    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);

    let amount: i128 = 10_000_0000000;
    token_admin_client.mint(&payer, &amount);

    let ref_str = String::from_str(&env, "BILLZA-DIR-001");
    let category = symbol_short!("WATER");

    billza.direct_pay(&payer, &recipient, &token_id, &amount, &ref_str, &category);

    // 1% fee = 100_0000000, net = 9_900_0000000
    assert_eq!(token_client.balance(&recipient), 9_900_0000000);
    assert_eq!(token_client.balance(&fee_recipient), 100_0000000);

    let (total_paid, volume) = billza.get_stats(&token_id);
    assert_eq!(total_paid, 1);
    assert_eq!(volume, amount);
}

#[test]
fn test_cancel_bill() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(BillzaContract, ());
    let billza = BillzaContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    billza.initialize(&admin, &admin, &0);

    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token_contract(&env, &token_admin);

    let payer = Address::generate(&env);
    let recipient = Address::generate(&env);

    let bill_id = symbol_short!("GYM_001");
    billza.register_bill(&payer, &bill_id, &recipient, &token_id, &5000, &1000, &0);

    billza.cancel_bill(&payer, &bill_id);

    let bill = billza.get_bill(&bill_id).unwrap();
    assert_eq!(bill.status, 2); // Cancelled
}
