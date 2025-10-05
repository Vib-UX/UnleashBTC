# Lightning Network to Starknet Swap Integration

This module provides a complete integration for swapping between Lightning Network and Starknet using the [Atomiq Labs SDK](https://www.npmjs.com/package/@atomiqlabs/sdk).

## 🎯 Features

- ⚡ **Instant Lightning to Starknet swaps** - Swap BTC from Lightning Network to WBTC/USDC on Starknet in seconds
- 🔄 **Bidirectional swaps** - Support for both LN → Starknet and Starknet → LN
- 💰 **Automatic gas reserve** - Reserves 2% in USDC for Starknet gas fees
- 📊 **Real-time quotes** - Get instant swap quotes with transparent fee breakdown
- 🔐 **Secure** - Built on Atomiq's battle-tested infrastructure
- 📱 **Mobile-first** - React Native UI components ready to use

## 📁 Project Structure

```
lightning-swap/
├── src/
│   ├── services/
│   │   └── AtomiqSwapService.ts    # Core swap service using Atomiq SDK
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── utils/
│   │   └── constants.ts            # Configuration constants
│   └── index.ts                    # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
cd lightning-swap
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Configuration

Create a `.env` file in the `lightning-swap` directory:

```env
# Network (mainnet or testnet)
LIGHTNING_NETWORK=testnet

# Starknet RPC URL
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Swap Configuration
MIN_SWAP_SATS=10000
MAX_SWAP_SATS=100000000
GAS_RESERVE_PERCENTAGE=2
```

## 💻 Usage

### TypeScript/JavaScript

```typescript
import {
  AtomiqSwapService,
  SwapDirection,
  StarknetToken,
} from "@unleashbtc/lightning-swap";

// Initialize the service
const swapService = new AtomiqSwapService({
  network: "testnet",
  starknetRpcUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
  minSwapAmount: 10000,
  maxSwapAmount: 100000000,
  gasReservePercentage: 2,
  enableAutoGasReserve: true,
});

// Set Starknet signer (from wallet)
swapService.setStarknetSigner(starknetAccount);

// Get a swap quote
const quote = await swapService.getSwapQuote({
  direction: SwapDirection.LN_TO_STARKNET,
  amount: 100000, // 100,000 sats
  targetToken: StarknetToken.WBTC,
  recipientAddress: "0x...",
  speed: "instant",
});

console.log("Quote:", quote);

// Execute the swap
const swap = await swapService.executeLightningToStarknet({
  direction: SwapDirection.LN_TO_STARKNET,
  amount: 100000,
  targetToken: StarknetToken.WBTC,
  recipientAddress: "0x...",
  speed: "instant",
});

console.log("Lightning Invoice:", swap.lightningInvoice?.paymentRequest);

// Monitor swap status
const status = await swapService.monitorSwapStatus(swap.id);
console.log("Swap Status:", status.status);
```

### React Native Component

A ready-to-use React Native component is available at:

```
/unleashbtc-rn-app/components/LightningSwapScreen.tsx
```

Add it to your app:

```typescript
import LightningSwapScreen from "@/components/LightningSwapScreen";

// In your navigation or screen
<LightningSwapScreen />;
```

### Backend API Routes

API routes are available in:

```
/api/src/routes/lightning.ts
```

#### Available Endpoints:

**POST /lightning/quote**

- Get a swap quote
- Body: `{ direction, amount, targetToken?, recipientAddress? }`

**POST /lightning/swap**

- Initiate a swap
- Body: `{ direction, amount, targetToken?, recipientAddress?, speed? }`
- Auth: Required

**GET /lightning/swap/:swapId**

- Get swap status
- Returns: Swap transaction details

**GET /lightning/swaps**

- Get all user swaps
- Auth: Required

**GET /lightning/config**

- Get Lightning swap configuration

## 🔧 Integration with Atomiq SDK

### Initialize Swapper Factory

```typescript
import { SwapperFactory, BitcoinNetwork } from "@atomiqlabs/sdk";
import {
  StarknetInitializer,
  StarknetInitializerType,
} from "@atomiqlabs/chain-starknet";

const Factory = new SwapperFactory<[StarknetInitializerType]>([
  StarknetInitializer,
] as const);

const swapper = Factory.newSwapper({
  chains: {
    STARKNET: {
      rpcUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
    },
  },
  bitcoinNetwork: BitcoinNetwork.MAINNET,
});
```

### Set Up Starknet Signer

```typescript
import { connect } from "get-starknet";
import { StarknetSigner } from "@atomiqlabs/chain-starknet";

const starknetWallet = await connect();
const starknetSigner = new StarknetSigner(starknetWallet.account);
```

### Execute Swap

```typescript
// LN → Starknet
const invoice = await generateLightningInvoice(amount);
const paymentReceived = await monitorInvoice(invoice);

if (paymentReceived) {
  const swapResult = await swapper.swap({
    from: "BTC_LN",
    to: "STARKNET",
    amount: amount,
    recipient: starknetSigner.address,
  });
}
```

## 📊 Swap Flow

### Lightning Network → Starknet

1. **Get Quote** - Calculate fees, gas reserve, and output amount
2. **Generate Invoice** - Create Lightning invoice for payment
3. **Monitor Payment** - Wait for Lightning payment confirmation
4. **Bridge to Starknet** - Atomiq SDK bridges BTC to Starknet
5. **Split Assets**:
   - 2% → USDC (for gas fees)
   - 98% → WBTC (or chosen token)
6. **Complete** - Assets delivered to recipient address

### Starknet → Lightning Network

1. **Get Quote** - Calculate fees and output amount
2. **Provide Invoice** - User provides Lightning invoice
3. **Execute Swap** - Transfer tokens to Atomiq
4. **Bridge to BTC** - Atomiq converts to BTC
5. **Pay Invoice** - Lightning invoice paid automatically
6. **Complete** - BTC received in Lightning wallet

## 🔐 Security Considerations

1. **Invoice Expiry** - Lightning invoices expire after 1 hour
2. **Amount Limits** - Min: 10,000 sats, Max: 100,000,000 sats
3. **Address Validation** - Starknet addresses are validated
4. **Gas Reserve** - Automatic 2% reserve ensures gas availability
5. **Authentication** - Backend routes require user authentication

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test in development mode
npm run dev
```

## 📦 Dependencies

- `@atomiqlabs/sdk` - Core Atomiq SDK for cross-chain swaps
- `@atomiqlabs/chain-starknet` - Starknet chain connector
- `starknet` - Starknet.js library
- `get-starknet` - Wallet connection library

## 🚧 Production Checklist

Before deploying to production:

- [ ] Replace mock implementations with actual Atomiq SDK calls
- [ ] Implement proper database storage for swap transactions
- [ ] Add Redis for caching and session management
- [ ] Implement webhook handlers for Lightning payment notifications
- [ ] Set up monitoring and alerting
- [ ] Add comprehensive error handling and retry logic
- [ ] Implement rate limiting
- [ ] Add transaction history and receipts
- [ ] Test with real Lightning Network payments
- [ ] Configure mainnet RPC endpoints
- [ ] Set up proper API key management

## 📚 Resources

- [Atomiq Labs Documentation](https://docs.atomiq.com)
- [Atomiq SDK on NPM](https://www.npmjs.com/package/@atomiqlabs/sdk)
- [Starknet Documentation](https://docs.starknet.io)
- [Lightning Network Documentation](https://lightning.network)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

For questions and support:

- GitHub Issues: [UnleashBTC Issues](https://github.com/your-repo/issues)
- Discord: [Join our community](#)
- Email: support@unleashbtc.com

---

Built with ⚡ by the UnleashBTC Team
