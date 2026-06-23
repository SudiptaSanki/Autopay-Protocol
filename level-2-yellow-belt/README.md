# 🌌 Autopay Protocol - Level 2 (Yellow Belt)

This directory contains the **Level 2** implementation of the Autopay Protocol. 

## 🚀 What We Built
- **Multi-Wallet Integration:** Replaced the simple Freighter-only integration with `@creit.tech/stellar-wallets-kit`, allowing support for Freighter, Albedo, xBull, and more!
- **Soroban Smart Contract:** Wrote, compiled, and deployed a Rust-based Soroban smart contract to manage Subscriptions (`create_subscription`, `cancel_subscription`).
- **Frontend Contract Invocation:** Connected the React frontend to the deployed Soroban contract using the Stellar SDK and Soroban RPC.
- **Real-Time Event Handling:** Added live polling for `SubscriptionCreated` and `SubscriptionCancelled` events emitted by the smart contract.
- **Robust Error Handling:** Properly handled three major error states:
  - `WalletNotConnected` (UI prompt)
  - `InvalidAmount` (Smart Contract / Validation)
  - `TransactionRejected` (User declined signature)

## 🔗 Live Data
- **Contract Address:** `CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH`
- **Network:** Stellar Testnet

## 🛠 Setup Instructions
1. Navigate to this directory: `cd level-2-yellow-belt`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Make sure your wallet is set to **Testnet** and funded.

*(To compile the contract yourself, ensure you have Rust and the `wasm32v1-none` target installed, then use the `stellar-cli` to build and deploy from the `contracts/subscription` folder).*
