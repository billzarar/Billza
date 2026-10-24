# Billza Stellar Soroban Smart Contract

Non-custodial utility bill registry, recurring payment advancement, and on-chain verified payment settlement contract built on **Stellar Soroban**.

## Deployed Testnet Contract

- **Contract ID**: `CCOSNSVHGLYFMO72ICZY2Y7KZYQLZ77AADT4LIU6VL4XDRT2IY6IQMOG`
- **Network**: Stellar Testnet
- **WASM Hash**: `35ae26e09ae957af88f891828b0800dc1a70bd9db908100e77719ec1ddca02bc`
- **Deployment Transaction**: [`1bba78de3878efd69d75f3222fdca7527ff585f8134c2b490464af154a72c71d`](https://stellar.expert/explorer/testnet/tx/1bba78de3878efd69d75f3222fdca7527ff585f8134c2b490464af154a72c71d)
- **Initialization Transaction**: [`fb4fa3863aa0fa26b7ccbf8020d81b6f450f2bf713378879d4eb2345569f06c2`](https://stellar.expert/explorer/testnet/tx/fb4fa3863aa0fa26b7ccbf8020d81b6f450f2bf713378879d4eb2345569f06c2)
- **Stellar Lab**: [Inspect Contract on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CCOSNSVHGLYFMO72ICZY2Y7KZYQLZ77AADT4LIU6VL4XDRT2IY6IQMOG)

---

## Architecture & Features

1. **Non-Custodial Direct Settlement**:
   - Supports native XLM and Testnet USDC Stellar Asset Contracts via Soroban `token::Client`.
   - Transfers tokens directly from payer to bill recipient without intermediate custodial holding.

2. **Recurring Bill Engine**:
   - Stores bill schedule, recipient address, target token, due date, and payment frequency (One-Time, Weekly, Monthly, Quarterly, Yearly).
   - When a recurring bill is paid, the contract records the payment reference, increments `occurrence_count`, and advances `due_date` to the next cycle while resetting state to Unpaid.

3. **On-Chain Audit Events**:
   - `bill_reg`: Published upon bill registration with payer, recipient, asset, amount, and due date.
   - `bill_paid`: Published upon verified payment with bill ID, payer, recipient, token, amount, reference, and timestamp.
   - `dir_pay`: Published upon direct/spontaneous utility bill settlements.
   - `cancel`: Published when an unpaid bill is cancelled by its owner or admin.

4. **Configurable Platform Fee**:
   - Configurable fee basis points (0–1000 bps, default 0 bps).

---

## Contract Methods

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `initialize` | `admin: Address, fee_recipient: Address, fee_bps: u32` | `Result<(), BillzaError>` | Initialize admin and fee parameters (once) |
| `register_bill` | `payer: Address, bill_id: Symbol, recipient: Address, token: Address, amount: i128, due_date: u64, frequency: u32` | `Result<(), BillzaError>` | Register a bill schedule on-chain |
| `pay_bill` | `payer: Address, bill_id: Symbol, token: Address, amount: i128, reference: String` | `Result<(), BillzaError>` | Execute bill payment, transfer tokens, advance recurring schedule |
| `direct_pay` | `payer: Address, recipient: Address, token: Address, amount: i128, reference: String, category: Symbol` | `Result<(), BillzaError>` | Spontaneous payment without prior bill registration |
| `cancel_bill` | `caller: Address, bill_id: Symbol` | `Result<(), BillzaError>` | Cancel an unpaid bill |
| `get_bill` | `bill_id: Symbol` | `Option<BillRecord>` | Query bill status, recipient, due date, occurrence count |
| `get_stats` | `token: Address` | `(u32, i128)` | Query total bills paid and total volume for a token |
| `get_fee_config`| `()` | `(Option<Address>, u32)` | Query fee recipient and fee basis points |

---

## Local Testing & Compilation

```bash
# Run unit tests
cargo test

# Build optimized WASM for Soroban
stellar contract build
```
