# API (Express + TypeScript)

Backend service to create Privy wallets, fetch wallet details, and deploy a Ready account on Starknet using starknet.js. It implements Privy Wallet API raw_sign via user authorization signatures and Basic app auth. Optional SNIP‑29 paymaster support can deploy + execute an initial call using sponsored or gas‑token modes.

## Quick start

Prerequisites

- Node.js 18+

Install and run

```bash
cd api
npm install
cp .env.example .env    # or .env.local
npm run dev             # tsx watch
```

Production

```bash
npm run build
npm start
```

Env loading order

- api/.env.local, api/.env, then repo root .env.local/.env (first match wins)

## Environment variables

Required

- RPC_URL – Starknet RPC (e.g., Sepolia v0_8 or v0_9)
- READY_CLASSHASH – Ready account class hash
- PRIVY_APP_ID – Privy app id
- PRIVY_APP_SECRET – Privy app secret

Optional

- PRIVY_WALLET_AUTH_PRIVATE_KEY – Static Wallet API authorization key (not required; using user-signer flow)
- PRIVY_WALLET_POLICY_ID – Policy id to apply on wallet creation
- PORT – default 3000
- CLIENT_URL – default http://localhost:3001
  - In production, set this to your deployed frontend origin (e.g., https://your-app.vercel.app) for CORS
- COUNTER_CONTRACT_ADDRESS – default contract used by increase-counter (and as fallback for counter)
- COUNTER_ENTRYPOINT_GET – overrides read entrypoint name (default get_counter)
- COUNTER_ENTRYPOINT_INCREASE – overrides write entrypoint name (default increase_counter)
  - For convenience, the API also falls back to client envs if present:
    - NEXT_PUBLIC_CONTRACT_ADDRESS
    - NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER
    - NEXT_PUBLIC_CONTRACT_ENTRY_POINT_INCREASE_COUNTER

Paymaster (optional)

- PAYMASTER_URL – Paymaster RPC URL (e.g., https://sepolia.paymaster.avnu.fi)
- PAYMASTER_MODE – 'sponsored' (dApp pays) or 'default' (user pays in gas token)
- PAYMASTER_API_KEY – required when PAYMASTER_MODE='sponsored'
- GAS_TOKEN_ADDRESS – required when PAYMASTER_MODE='default' (if not selecting first supported token)
- CONTRACT_ADDRESS – optional contract for initial call
- CONTRACT_ENTRY_POINT_GET_COUNTER – entrypoint for initial call (default get_counter)

Example .env (minimal)

```env
PORT=3000
CLIENT_URL=http://localhost:3001
# Example: Voyager/Alchemy RPC (use any Starknet RPC provider)
RPC_URL=Voyager/Alchemy
READY_CLASSHASH=0x...
PRIVY_APP_ID=your_app_id
PRIVY_APP_SECRET=your_app_secret
COUNTER_CONTRACT_ADDRESS=0x...
```

Example .env (paymaster sponsored)

```env
PAYMASTER_URL=https://sepolia.paymaster.avnu.fi
PAYMASTER_MODE=sponsored
PAYMASTER_API_KEY=...
```

## Endpoints

Health

- GET / → status and available endpoints

Wallets

- POST /privy/create-wallet → creates a Starknet wallet in Privy (owner attached if available)
- POST /privy/public-key → body: { walletId } → returns wallet + public key
- GET /privy/user-wallets?userId=… → returns Starknet wallets for a user

Deploy

- POST /privy/deploy-wallet → body: { walletId } and Authorization: Bearer <user JWT> → deploys Ready account (address derived from public key + class hash)
  - If paymaster env is configured, deployment uses SNIP‑29 paymaster and executes an initial call with either sponsored or gas‑token mode

Execute

- POST /privy/execute → body: { walletId, call|calls, wait? } with Authorization → executes a Starknet call using the Ready account
- POST /privy/increase-counter → body: { walletId, contractAddress?, wait? } with Authorization → executes `increase_counter` on the counter contract

Read-only helpers

- GET /privy/counter?contract=…&user=… → calls `get_counter(user)` and returns { hex, decimal }

## Test with cURL

Create wallet

```bash
curl -X POST http://localhost:3000/privy/create-wallet \
  -H 'Content-Type: application/json' \
  -d '{"ownerId":"<privy_user_id>","chainType":"starknet"}'
```

Public key

```bash
curl -X POST http://localhost:3000/privy/public-key \
  -H 'Content-Type: application/json' \
  -d '{"walletId":"<wallet_id>"}'
```

Deploy (requires user JWT)

```bash
curl -X POST http://localhost:3000/privy/deploy-wallet \
  -H 'Authorization: Bearer <user_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"walletId":"<wallet_id>"}'
```

Read counter

```bash
curl "http://localhost:3000/privy/counter?contract=<counter_addr>&user=<ready_addr>"
```

Increase (requires user JWT)

```bash
curl -X POST http://localhost:3000/privy/increase-counter \
  -H 'Authorization: Bearer <user_jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"walletId":"<wallet_id>","contractAddress":"<counter_addr>","wait":true}'
```

## Notes

- Fund the computed address with STRK before deployment unless using a paymaster.
- Wallet API calls use Basic (app id/secret) + user authorization signatures; the browser Origin is forwarded.

## Helper Functions (internal)

These are exported from `api/src/lib/ready.ts` and used by routes:

- `deployReadyAccount(opts)`
  - Deploys the Ready account using the Privy-backed signer. If paymaster env is configured, uses SNIP‑29 and performs an initial call.
- `getReadyAccount(opts)`
  - Returns `{ account, address }` for the user’s Ready account (no paymaster attached).
- `buildReadyAccount(opts)`
  - Like `getReadyAccount`, but can optionally attach `paymasterRpc` for SNIP‑29 flows. Used by the increase‑counter route.

Minimal usage example (TypeScript):

```ts
import { deployReadyAccount, getReadyAccount } from "./src/lib/ready";

// Deploy
await deployReadyAccount({ walletId, publicKey, classHash, userJwt });

// Use account
const { account, address } = await getReadyAccount({
  walletId,
  publicKey,
  classHash,
  userJwt,
});
const res = await account.execute({
  contractAddress,
  entrypoint: "ping",
  calldata: [],
});
```
