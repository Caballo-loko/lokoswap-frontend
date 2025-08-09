# LokoSwap — AMM with Dynamic Fee Hook

LokoSwap is a **full-stack Solana DeFi platform** featuring:

* **Token-2022 native support**
* **Dynamic fee scaling based on transaction velocity**
* **Advanced transfer hook integration**
* **A modern Next.js frontend** for interacting with the AMM

The project includes:

1. **Anchor programs** for the AMM and Dynamic Fee Hook
2. **Next.js frontend** for pool creation, liquidity management, swaps, and real-time fee display

---

## 🌟 Key Features

### 🔗 Token-2022 Integration

* Transfer Hook Support — execute custom logic on every transfer
* Transfer Fee Handling — automatic fee calculation/collection
* Works with all Token-2022 extensions and legacy SPL tokens

### ⚡ Dynamic Fee System

* Velocity-based scaling (0.1% → 3.0%)
* Real-time analytics (TPM, volume, peak TPS)
* Smooth fee transitions

### 🏊 AMM Core Functionality

* Constant product formula (x \* y = k)
* Multi-token swaps with slippage protection
* Liquidity provision and LP token rewards

### 🖥️ Frontend Features

* Wallet integration (Phantom, Solflare, Backpack)
* Pool creation and management
* Token swaps with dynamic fee awareness
* Live pool statistics and fee rate updates

---

## 📂 Project Structure

```
lokoswap-frontend/         # Root project folder
├── README.md              # This file
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js app entry and styles
│   ├── components/        # UI components (AMM actions, layouts, modals)
│   ├── constants/         # Program IDs and config
│   ├── contexts/          # React contexts (Pool, UI state)
│   ├── hooks/             # Custom hooks
│   ├── idl/               # Anchor-generated IDL files
│   ├── types/             # TypeScript definitions for programs
│   └── utils/             # Token-2022 helpers and utilities
└── programs/              # Anchor programs for AMM + Dynamic Fee Hook
    ├── loko_swap/
    └── dynamic_fee_hook/
```

---

## 🛠️ Installation & Setup

### Prerequisites

* Rust 1.88+
* Solana CLI 2.2.1+
* Anchor CLI 0.31+
* Node.js 18+

---

### 1️⃣ Clone & Install

```bash
git clone <repository-url>
cd lokoswap-frontend

# Install frontend deps
npm install
```

---

### 2️⃣ Build & Deploy Anchor Programs

```bash
# Navigate to programs directory
cd programs

# Build Solana programs
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

### 3️⃣ Configure Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LOKOSWAP_PROGRAM_ID=<loko_swap_program_id>
NEXT_PUBLIC_DYNAMIC_FEE_HOOK_ID=<dynamic_fee_hook_program_id>
```

---

### 4️⃣ Run the Frontend

```bash
cd ..
npm run dev
```

Visit `http://localhost:3000`

---

## 🚀 Quick Start — Create a Pool

Once deployed, you can create a pool directly from the UI, or via scripts using the Anchor workspace and the program IDs above.

Example from scripts:

```typescript
await program.methods
  .initialize(
    new anchor.BN(Date.now()),
    300, // AMM fee in basis points
    null, // authority
    10,   // transfer fee basis points (0.1%)
    new anchor.BN(100000000), // max transfer fee (0.1 tokens)
    hookProgramId
  )
  .accountsStrict({
    admin: admin.publicKey,
    mintX: tokenAMint,
    mintY: tokenBMint,
    mintLp: lpMint,
    vaultX: vaultA,
    vaultY: vaultB, 
    config: poolConfig,
    tokenProgram: TOKEN_2022_PROGRAM_ID
  })
  .rpc();
```

---

## 📦 Build & Deploy Frontend

```bash
# Production build
npm run build

# Start production server
npm run start
```

You can deploy to [Vercel](https://vercel.com/) or any Next.js-compatible host.

---

## 🔐 Security

* Whitelisted hook programs
* Authority-controlled pool locking
* Slippage limits on all trades
* Overflow-safe math in fee calculations

---

## 🤝 Contributing

1. Fork repo
2. Create feature branch (`git checkout -b feature/my-feature`)
3. Commit changes
4. Submit pull request

---

## 📄 License

MIT License — see `LICENSE` file.

---

