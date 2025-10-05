# Lightning Swap Integration Guide

This guide walks you through integrating the Lightning Network swap functionality into the UnleashBTC application.

## 📋 Prerequisites

- Node.js 16+ installed
- Access to a Starknet RPC endpoint
- Understanding of React Native and Express.js
- Privy authentication set up in the app

## 🔧 Step-by-Step Integration

### Step 1: Install Dependencies

```bash
# In the lightning-swap directory
cd lightning-swap
npm install

# Build the module
npm run build
```

### Step 2: Install Atomiq SDK in Main App

```bash
# In the React Native app directory
cd ../unleashbtc-rn-app
npm install @atomiqlabs/sdk @atomiqlabs/chain-starknet
```

### Step 3: Add Lightning Swap Screen to Navigation

Edit `/unleashbtc-rn-app/app/_layout.tsx`:

```typescript
import LightningSwapScreen from "@/components/LightningSwapScreen";

// Add to your navigation
<Stack.Screen
  name="lightning-swap"
  component={LightningSwapScreen}
  options={{ title: "⚡ Lightning Swap" }}
/>;
```

### Step 4: Update API Server

The Lightning routes are already added to `/api/src/server.ts`. Ensure the server is running:

```bash
cd ../api
npm install
npm run dev
```

### Step 5: Configure Environment Variables

Create or update `/api/.env`:

```env
# Add these Lightning-specific variables
LIGHTNING_NETWORK=testnet
STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

### Step 6: Add Navigation Link

Add a button to navigate to the Lightning Swap screen. For example, in your main screen:

```typescript
import { useRouter } from "expo-router";

const router = useRouter();

<TouchableOpacity
  style={styles.button}
  onPress={() => router.push("/lightning-swap")}
>
  <Text>⚡ Lightning Swap</Text>
</TouchableOpacity>;
```

### Step 7: Connect Starknet Wallet

The Lightning Swap component needs access to the user's Starknet wallet for signing transactions. Ensure your wallet connection is available:

```typescript
// In your provider/context
import { useAccount } from "@starknet-react/core";

const { account, address } = useAccount();

// Pass to Lightning Swap component
<LightningSwapScreen starknetAccount={account} starknetAddress={address} />;
```

## 🎨 Customization

### Modify Swap Limits

Edit `/lightning-swap/src/utils/constants.ts`:

```typescript
export const NETWORK_CONFIG = {
  mainnet: {
    minSwapSats: 10000, // Change minimum
    maxSwapSats: 100000000, // Change maximum
  },
  // ...
};
```

### Adjust Gas Reserve Percentage

```typescript
export const DEFAULT_CONFIG = {
  gasReservePercentage: 2, // Change from 2% to your preference
  // ...
};
```

### Customize Fees

```typescript
export const FEE_STRUCTURE = {
  lightningServiceFeeBps: 100, // 1% - adjust as needed
  lightningNetworkFeeSats: 100, // base fee
  // ...
};
```

### Style the UI Component

Edit the `styles` object in `/unleashbtc-rn-app/components/LightningSwapScreen.tsx`:

```typescript
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: "#3B82F6", // Change your primary color
  },
  // ... other styles
});
```

## 🔌 Real Atomiq SDK Integration

The current implementation uses mock data for demonstration. To integrate with the real Atomiq SDK:

### 1. Update Service Layer

Edit `/lightning-swap/src/services/AtomiqSwapService.ts`:

Replace mock implementations with real Atomiq SDK calls:

```typescript
// Real implementation
public async createLightningInvoice(
  amountSats: number,
  description?: string
): Promise<LightningInvoice> {
  // Call actual Atomiq SDK
  const invoice = await this.swapper.createInvoice({
    amount: amountSats,
    description,
  });

  return {
    paymentRequest: invoice.payment_request,
    paymentHash: invoice.payment_hash,
    amount: invoice.amount,
    expiresAt: invoice.expires_at * 1000,
    description,
  };
}
```

### 2. Update Backend Routes

Edit `/api/src/routes/lightning.ts`:

```typescript
import { AtomiqSwapService } from "../../lightning-swap/src";

// Initialize service (do this once at startup)
const swapService = new AtomiqSwapService({
  network: process.env.LIGHTNING_NETWORK || "testnet",
  starknetRpcUrl: process.env.STARKNET_RPC_URL,
});

// Use real service in routes
router.post("/swap", async (req: Request, res: Response) => {
  const transaction = await swapService.executeLightningToStarknet(req.body);
  return res.json({ transaction });
});
```

### 3. Add Database Storage

Replace in-memory storage with a database (MongoDB, PostgreSQL, etc.):

```typescript
// Example with MongoDB
import { SwapTransaction } from "./models/SwapTransaction";

// Store swap
await SwapTransaction.create(transaction);

// Retrieve swap
const swap = await SwapTransaction.findOne({ id: swapId });
```

### 4. Implement Webhooks

Set up webhooks to receive Lightning payment notifications:

```typescript
router.post("/webhook/lightning-payment", async (req, res) => {
  const { payment_hash, paid } = req.body;

  if (paid) {
    // Update swap status
    const swap = await findSwapByPaymentHash(payment_hash);
    swap.status = "PAYMENT_RECEIVED";
    await swap.save();

    // Trigger bridging to Starknet
    await processStarknetBridge(swap);
  }

  res.json({ received: true });
});
```

## 📱 Mobile App Flow

### Complete User Journey

1. **User opens Lightning Swap screen**

   - Authenticated via Privy
   - Starknet wallet connected

2. **User selects swap direction**

   - LN → Starknet or Starknet → LN

3. **User enters amount**

   - Validates against min/max limits

4. **User requests quote**

   - API returns quote with fee breakdown
   - Shows gas reserve allocation

5. **User confirms swap**

   - For LN → Starknet: Lightning invoice generated
   - For Starknet → LN: User provides invoice

6. **Payment processing**

   - LN: User pays invoice with any Lightning wallet
   - Starknet: Transaction executed from connected wallet

7. **Monitoring**

   - Status updates automatically
   - Push notification when complete

8. **Completion**
   - Show transaction hash
   - Link to Starknet explorer

## 🧪 Testing the Integration

### Test Lightning to Starknet Swap

```bash
# 1. Start the API server
cd api
npm run dev

# 2. Start the React Native app
cd ../unleashbtc-rn-app
npm start

# 3. In the app:
# - Navigate to Lightning Swap
# - Select LN → Starknet
# - Enter 10000 sats
# - Enter your Starknet address
# - Get quote
# - Confirm swap
# - Copy the Lightning invoice
# - Pay from a Lightning wallet (testnet)
```

### Test with Atomiq SDK Playground

Visit https://atomiq.xyz to test swaps in their playground environment before integrating.

## 🐛 Troubleshooting

### Common Issues

**Issue: "Starknet signer not initialized"**

```typescript
// Solution: Ensure wallet is connected before swapping
if (!account) {
  Toast.show({
    type: "error",
    text1: "Please connect your Starknet wallet first",
  });
  return;
}
swapService.setStarknetSigner(account);
```

**Issue: "Amount too low"**

```typescript
// Solution: Check minimum amount
const MIN_AMOUNT = 10000; // 10,000 sats
if (amount < MIN_AMOUNT) {
  setError(`Minimum amount is ${MIN_AMOUNT} sats`);
  return;
}
```

**Issue: "Invalid Starknet address"**

```typescript
// Solution: Validate address format
import { validateAndParseAddress } from "starknet";

try {
  validateAndParseAddress(recipientAddress);
} catch (e) {
  setError("Invalid Starknet address");
  return;
}
```

## 📊 Monitoring and Analytics

### Track Swap Metrics

```typescript
// Add to your analytics service
trackEvent("lightning_swap_initiated", {
  direction: swap.direction,
  amount: swap.inputAmount,
  token: swap.targetToken,
});

trackEvent("lightning_swap_completed", {
  swapId: swap.id,
  duration: swap.updatedAt - swap.createdAt,
});
```

### Monitor Swap Success Rate

```typescript
const metrics = {
  total_swaps: await SwapTransaction.count(),
  completed: await SwapTransaction.count({ status: "COMPLETED" }),
  failed: await SwapTransaction.count({ status: "FAILED" }),
  avg_time: await calculateAverageSwapTime(),
};
```

## 🚀 Production Deployment

### Checklist

- [ ] Replace all mock implementations
- [ ] Set up production RPC endpoints
- [ ] Configure Atomiq API keys
- [ ] Implement proper error handling
- [ ] Add comprehensive logging
- [ ] Set up database for swap storage
- [ ] Implement webhook handlers
- [ ] Add rate limiting
- [ ] Set up monitoring/alerting
- [ ] Test with real Lightning payments
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation for users

### Environment Variables

```env
# Production
LIGHTNING_NETWORK=mainnet
STARKNET_RPC_URL=https://starknet-mainnet.public.blastapi.io/rpc/v0_7
ATOMIQ_API_KEY=your_production_api_key
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## 📚 Additional Resources

- [Atomiq Labs Documentation](https://docs.atomiq.com)
- [Lightning Network Resources](https://lightning.engineering)
- [Starknet Documentation](https://docs.starknet.io)
- [React Native Best Practices](https://reactnative.dev/docs/getting-started)

---

Need help? Open an issue or contact the team! 💪
