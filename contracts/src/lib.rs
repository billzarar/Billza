#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
    String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum BillzaError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    BillNotFound = 4,
    BillAlreadyPaid = 5,
    BillCancelled = 6,
    InvalidAmount = 7,
    InvalidToken = 8,
    InvalidDueDate = 9,
    FeeTooHigh = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BillRecord {
    pub bill_id: Symbol,
    pub payer: Address,
    pub recipient: Address,
    pub token: Address,
    pub amount: i128,
    pub due_date: u64,
    pub frequency: u32, // 0 = OneTime, 1 = Weekly, 2 = Monthly, 3 = Quarterly, 4 = Yearly
    pub status: u32,    // 0 = Unpaid, 1 = Paid, 2 = Cancelled
    pub paid_at: u64,
    pub occurrence_count: u32,
    pub reference: String,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    FeeRecipient,
    FeeBps,
    Bill(Symbol),
    TotalBillsPaid,
    Volume(Address),
    UserBillCount(Address),
}

const SECONDS_PER_DAY: u64 = 86_400;

#[contract]
pub struct BillzaContract;

#[contractimpl]
impl BillzaContract {
    /// Initialize the Billza contract with admin, optional fee recipient, and basis points (0-1000, where 1000 = 10%)
    pub fn initialize(
        env: Env,
        admin: Address,
        fee_recipient: Address,
        fee_bps: u32,
    ) -> Result<(), BillzaError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(BillzaError::AlreadyInitialized);
        }
        if fee_bps > 1000 {
            return Err(BillzaError::FeeTooHigh);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::FeeRecipient, &fee_recipient);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::TotalBillsPaid, &0u32);

        Ok(())
    }

    /// Register a utility or recurring bill on-chain
    pub fn register_bill(
        env: Env,
        payer: Address,
        bill_id: Symbol,
        recipient: Address,
        token: Address,
        amount: i128,
        due_date: u64,
        frequency: u32,
    ) -> Result<(), BillzaError> {
        payer.require_auth();

        if amount <= 0 {
            return Err(BillzaError::InvalidAmount);
        }

        let key = DataKey::Bill(bill_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(BillzaError::AlreadyInitialized);
        }

        let bill = BillRecord {
            bill_id: bill_id.clone(),
            payer: payer.clone(),
            recipient: recipient.clone(),
            token: token.clone(),
            amount,
            due_date,
            frequency,
            status: 0, // Unpaid
            paid_at: 0,
            occurrence_count: 0,
            reference: String::from_str(&env, ""),
        };

        env.storage().persistent().set(&key, &bill);

        // Update user bill count
        let user_key = DataKey::UserBillCount(payer.clone());
        let count: u32 = env.storage().persistent().get(&user_key).unwrap_or(0);
        env.storage().persistent().set(&user_key, &(count + 1));

        // Emit registration event
        env.events().publish(
            (symbol_short!("bill_reg"), bill_id, payer),
            (recipient, token, amount, due_date, frequency),
        );

        Ok(())
    }

    /// Pay a registered bill: transfers tokens directly from payer to recipient (and fee recipient if configured)
    pub fn pay_bill(
        env: Env,
        payer: Address,
        bill_id: Symbol,
        token: Address,
        amount: i128,
        reference: String,
    ) -> Result<(), BillzaError> {
        payer.require_auth();

        let key = DataKey::Bill(bill_id.clone());
        let mut bill: BillRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(BillzaError::BillNotFound)?;

        if bill.status == 1 {
            return Err(BillzaError::BillAlreadyPaid);
        }
        if bill.status == 2 {
            return Err(BillzaError::BillCancelled);
        }
        if token != bill.token {
            return Err(BillzaError::InvalidToken);
        }
        if amount < bill.amount {
            return Err(BillzaError::InvalidAmount);
        }

        let fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(0);
        let fee_recipient: Address = env
            .storage()
            .instance()
            .get(&DataKey::FeeRecipient)
            .unwrap_or_else(|| payer.clone());

        let fee_amount = if fee_bps > 0 {
            (amount * (fee_bps as i128)) / 10_000
        } else {
            0
        };
        let net_amount = amount - fee_amount;

        // Perform token transfers via Stellar Asset Contract Client
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&payer, &bill.recipient, &net_amount);

        if fee_amount > 0 {
            token_client.transfer(&payer, &fee_recipient, &fee_amount);
        }

        let now = env.ledger().timestamp();
        bill.paid_at = now;
        bill.reference = reference.clone();
        bill.occurrence_count += 1;

        // If recurring bill (frequency > 0), advance due date for next occurrence
        if bill.frequency > 0 {
            let interval_days: u64 = match bill.frequency {
                1 => 7,   // Weekly
                2 => 30,  // Monthly
                3 => 90,  // Quarterly
                4 => 365, // Yearly
                _ => 30,
            };
            bill.due_date = now + (interval_days * SECONDS_PER_DAY);
            bill.status = 0; // Remains active / unpaid for next scheduled cycle
        } else {
            bill.status = 1; // Completed / Paid for one-off
        }

        env.storage().persistent().set(&key, &bill);

        // Update statistics
        let total_paid: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalBillsPaid)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalBillsPaid, &(total_paid + 1));

        let vol_key = DataKey::Volume(token.clone());
        let current_vol: i128 = env.storage().persistent().get(&vol_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&vol_key, &(current_vol + amount));

        // Emit payment event
        env.events().publish(
            (symbol_short!("bill_paid"), bill_id, payer),
            (bill.recipient, token, amount, reference, now),
        );

        Ok(())
    }

    /// Spontaneous or direct bill payment without prior registration
    pub fn direct_pay(
        env: Env,
        payer: Address,
        recipient: Address,
        token: Address,
        amount: i128,
        reference: String,
        category: Symbol,
    ) -> Result<(), BillzaError> {
        payer.require_auth();

        if amount <= 0 {
            return Err(BillzaError::InvalidAmount);
        }

        let fee_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(0);
        let fee_recipient: Address = env
            .storage()
            .instance()
            .get(&DataKey::FeeRecipient)
            .unwrap_or_else(|| payer.clone());

        let fee_amount = if fee_bps > 0 {
            (amount * (fee_bps as i128)) / 10_000
        } else {
            0
        };
        let net_amount = amount - fee_amount;

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&payer, &recipient, &net_amount);

        if fee_amount > 0 {
            token_client.transfer(&payer, &fee_recipient, &fee_amount);
        }

        let now = env.ledger().timestamp();

        // Update stats
        let total_paid: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalBillsPaid)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalBillsPaid, &(total_paid + 1));

        let vol_key = DataKey::Volume(token.clone());
        let current_vol: i128 = env.storage().persistent().get(&vol_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&vol_key, &(current_vol + amount));

        env.events().publish(
            (symbol_short!("dir_pay"), category, payer),
            (recipient, token, amount, reference, now),
        );

        Ok(())
    }

    /// Cancel an unpaid bill
    pub fn cancel_bill(env: Env, caller: Address, bill_id: Symbol) -> Result<(), BillzaError> {
        caller.require_auth();

        let key = DataKey::Bill(bill_id.clone());
        let mut bill: BillRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(BillzaError::BillNotFound)?;

        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(BillzaError::NotInitialized)?;

        if caller != bill.payer && caller != admin {
            return Err(BillzaError::Unauthorized);
        }
        if bill.status == 1 {
            return Err(BillzaError::BillAlreadyPaid);
        }

        bill.status = 2; // Cancelled
        env.storage().persistent().set(&key, &bill);

        env.events()
            .publish((symbol_short!("cancel"), bill_id), caller);

        Ok(())
    }

    /// Read a bill record by ID
    pub fn get_bill(env: Env, bill_id: Symbol) -> Option<BillRecord> {
        let key = DataKey::Bill(bill_id);
        env.storage().persistent().get(&key)
    }

    /// Get overall stats: total bills paid count and volume for a token
    pub fn get_stats(env: Env, token: Address) -> (u32, i128) {
        let total_paid: u32 = env
            .storage()
            .instance()
            .get(&DataKey::TotalBillsPaid)
            .unwrap_or(0);
        let volume: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Volume(token))
            .unwrap_or(0);
        (total_paid, volume)
    }

    /// Get fee configuration
    pub fn get_fee_config(env: Env) -> (Option<Address>, u32) {
        let recipient: Option<Address> = env.storage().instance().get(&DataKey::FeeRecipient);
        let bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(0);
        (recipient, bps)
    }
}

#[cfg(test)]
mod test;
