# 🌌 Autopay Protocol (Chrona)

<div align="center">
  <p><strong>"The recurring billing layer for Web3."</strong></p>
  <a href="https://autopay-protocol.web.app" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-autopay--protocol.web.app-blue?style=for-the-badge&logo=firebase" alt="Live Demo" />
  </a>
</div>

This repository contains the progressive evolution of the Chrona billing engine, building up from a basic wallet integration to a complete production-grade Web3 SaaS application.

## 🚀 Level 1 MVP: White Belt

For the first milestone (Level 1), we built the foundation of the Autopay Protocol on the Stellar Testnet. 

### What We Did:
- **Wallet Integration:** Integrated the `@stellar/freighter-api` to securely connect the user's Freighter wallet.
- **Balance Fetching:** Used the `@stellar/stellar-sdk` to read and display the native XLM balance in real-time.
- **Testnet Transactions:** Implemented the ability to build, sign, and submit an XLM transfer directly to the Stellar testnet.
- **Modern Stack:** Scaffolded the application using Vite, React, and TypeScript. Configured `vite-plugin-node-polyfills` to ensure the Stellar SDK's native node modules run perfectly in the browser.
- **Deployment:** Deployed the MVP live to Firebase Hosting.

### 📸 Screenshots
- **Successful Testnet Transaction:**
  <img src="level-1-white-belt/screenshots/Level_1.png" alt="Level 1 Testnet Transaction" width="800" />

---

## 🟡 Level 2 MVP: Yellow Belt

For the second milestone (Level 2), we implemented subscription smart contracts, multi-wallet support, and real-time synchronization.

### What We Did:
- **Multi-Wallet Integration:** Integrated Freighter and MetaMask (via the MetaMask Stellar Snap) using a custom wallet service module.
- **Soroban Smart Contract:** Created and deployed a Rust smart contract to Testnet (`CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH`) to manage subscription agreements.
- **Real-Time Synchronisation:** Polled the contract events in the background and rendered contract activity log in real-time.
- **Mobile Responsive UI:** Upgraded the UI with Framer Motion, layout wrapping, and responsive sizing to prevent button leaks on smaller screens.
- **Robust Error Handling:** Handled `WalletNotFound` (missing extension), `WalletConnectionRejected` (user denied/closed popups), and `InsufficientBalance` (balance lower than subscription amount).

### 📸 Screenshots
- **Successful Subscription Creation:**
  <img src="level-2-yellow-belt/screenshots/Level_2.png" alt="Level 2 Smart Contract Subscription" width="800" />

---

## 📁 Project Structure

- **`level-1-white-belt/`**: Wallet + Payments MVP. Connects to Freighter, displays balances, and sends XLM on Stellar testnet.
- **`level-2-yellow-belt/`**: Subscriptions + Smart Contracts. Integrates multi-wallet support and basic smart contract interactions.
- **`level-3-orange-belt/`**: Full Recurring Billing Infrastructure. Advanced contracts, event streaming, CI/CD, and testing. *(Pending)*
- **`production-grade/`**: The complete production Web3 SaaS marketing site and frontend application. *(Scaffolded)*

## 💡 The Vision

Build a **Web3 subscription billing platform** that lets wallets approve recurring payments once, then allows merchants to collect recurring charges without asking the user to sign every invoice manually.

## 🛠 Technologies
- **Blockchain:** Stellar SDK, Freighter API, Stellar Wallets Kit, Soroban (Rust)
- **Frontend:** React, Vite, TypeScript
- **Styling:** Tailwind CSS, GSAP, Framer Motion
- **Infrastructure:** Firebase Hosting, Render
