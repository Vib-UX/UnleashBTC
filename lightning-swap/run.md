# ⚡ Lightning Swap - Quick Reference

## 🚀 Installation & Setup (30 seconds)

```bash
# Install
cd lightning-swap && npm install && npm run build

# Start API
cd ../api && npm run dev

# Start App
cd ../unleashbtc-rn-app && npm start
```

## 📱 Test First Swap (2 minutes)

1. Open app → Authenticate
2. Navigate to "⚡ Lightning Swap"
3. Select "LN → Starknet"
4. Enter: 10000 sats
5. Enter: Your Starknet address
6. Click: "Get Quote"
7. Click: "Confirm Swap"
8. Mock payment completes in 10 seconds!

## 🔌 API Endpoints

| Endpoint              | Method | Auth | Description    |
| --------------------- | ------ | ---- | -------------- |
| `/lightning/quote`    | POST   | No   | Get swap quote |
| `/lightning/swap`     | POST   | Yes  | Create swap    |
| `/lightning/swap/:id` | GET    | No   | Get status     |
| `/lightning/swaps`    | GET    | Yes  | User history   |
| `/lightning/config`   | GET    | No   | Get config     |

## 📊 Fee Breakdown

| Fee Type    | Amount    | Description         |
| ----------- | --------- | ------------------- |
| Network     | ~100 sats | Lightning routing   |
| Service     | 1%        | Platform fee        |
| Gas Reserve | 2%        | Starknet gas (USDC) |

**Example**: 100,000 sats → 96,922 sats in WBTC + 1,978 in USDC

## 🔧 Configuration

### Network Settings

```typescript
// /lightning-swap/src/utils/constants.ts
NETWORK_CONFIG.mainnet.minSwapSats = 10000;
NETWORK_CONFIG.mainnet.maxSwapSats = 100000000;
```

### Fee Adjustments

```typescript
FEE_STRUCTURE.lightningServiceFeeBps = 100; // 1%
FEE_STRUCTURE.lightningNetworkFeeSats = 100;
```

### Gas Reserve

```typescript
DEFAULT_CONFIG.gasReservePercentage = 2; // 2%
```

## 📂 Key Files

| File                                                    | Purpose          |
| ------------------------------------------------------- | ---------------- |
| `/lightning-swap/src/services/AtomiqSwapService.ts`     | Core logic       |
| `/lightning-swap/src/types/index.ts`                    | TypeScript types |
| `/api/src/routes/lightning.ts`                          | API endpoints    |
| `/unleashbtc-rn-app/components/LightningSwapScreen.tsx` | UI component     |

## 🎯 Common Tasks

### Add a New Token

```typescript
// /lightning-swap/src/utils/constants.ts
export const STARKNET_TOKENS = {
  USDT: {
    mainnet:
      "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
  },
  // Add your token here
};
```

### Change Swap Limits

```typescript
const config = {
  minSwapAmount: 10000, // Change here
  maxSwapAmount: 100000000, // And here
};
```

### Customize UI Colors

```typescript
// LightningSwapScreen.tsx
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: "#3B82F6", // Your color
  },
});
```

## 🐛 Troubleshooting

### "Starknet signer not initialized"

```typescript
// Ensure wallet is connected
swapService.setStarknetSigner(account);
```

### "Amount too low"

```typescript
// Check minimum: 10,000 sats
if (amount < 10000) {
  setError("Minimum 10,000 sats");
}
```

### "Invalid address"

```typescript
// Validate Starknet address
import { validateAndParseAddress } from "starknet";
validateAndParseAddress(address);
```

## 📞 Quick Links

- 📖 [Full Documentation](./README.md)
- 🔗 [Integration Guide](./INTEGRATION_GUIDE.md)
- 🏗️ [Architecture Overview](./OVERVIEW.md)
- 🌐 [Atomiq SDK Docs](https://docs.atomiq.com)

## 🎯 Production Checklist

- [ ] Install Atomiq SDK dependencies
- [ ] Replace mock implementations
- [ ] Set up database (PostgreSQL/MongoDB)
- [ ] Configure Redis cache
- [ ] Implement webhooks
- [ ] Add monitoring/logging
- [ ] Test with real Lightning
- [ ] Security audit
- [ ] Load testing

## 💡 Example Code

### Get Quote

```typescript
const quote = await fetch("/lightning/quote", {
  method: "POST",
  body: JSON.stringify({
    direction: "LN_TO_STARKNET",
    amount: 100000,
    targetToken: "WBTC",
    recipientAddress: "0x...",
  }),
});
```

### Create Swap

```typescript
const swap = await fetch("/lightning/swap", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    direction: "LN_TO_STARKNET",
    amount: 100000,
    targetToken: "WBTC",
    recipientAddress: "0x...",
    speed: "instant",
  }),
});
```

### Monitor Status

```typescript
const status = await fetch(`/lightning/swap/${swapId}`);
console.log(status.transaction.status); // 'COMPLETED'
```

## 🔒 Security Notes

- ✅ Always validate amounts
- ✅ Check address formats
- ✅ Handle invoice expiry
- ✅ Require authentication
- ✅ Log all transactions
- ✅ Monitor for anomalies

## 📊 Status Codes

| Status              | Description          |
| ------------------- | -------------------- |
| `PENDING`           | Just created         |
| `INVOICE_GENERATED` | Invoice ready        |
| `PAYMENT_RECEIVED`  | Payment confirmed    |
| `BRIDGING`          | Bridging to Starknet |
| `COMPLETED`         | Done!                |
| `FAILED`            | Error occurred       |
| `EXPIRED`           | Invoice expired      |

## 🎨 UI States

| State               | What User Sees    |
| ------------------- | ----------------- |
| `IDLE`              | Input form        |
| `QUOTE`             | Fee breakdown     |
| `INVOICE_GENERATED` | QR code           |
| `PROCESSING`        | Loading spinner   |
| `COMPLETED`         | Success + TX hash |
| `FAILED`            | Error message     |

## 📈 Metrics to Track

- Total swaps initiated
- Completion rate
- Average completion time
- Total volume (sats)
- Fee revenue
- Error rate
- Popular swap directions

## 🚀 Deployment

### Testnet

```bash
export LIGHTNING_NETWORK=testnet
export STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
npm run build && npm start
```

### Mainnet

```bash
export LIGHTNING_NETWORK=mainnet
export STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io/rpc/v0_7
npm run build && npm start
```

---

**Need help?** Check the [full documentation](./README.md) or [integration guide](./INTEGRATION_GUIDE.md)!
