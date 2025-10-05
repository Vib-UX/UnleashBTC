/**
 * Lightning Network to Starknet Swap Types
 */

export enum SwapDirection {
  LN_TO_STARKNET = "LN_TO_STARKNET",
  STARKNET_TO_LN = "STARKNET_TO_LN",
  BTC_TO_STARKNET = "BTC_TO_STARKNET",
  STARKNET_TO_BTC = "STARKNET_TO_BTC",
}

export enum SwapStatus {
  PENDING = "PENDING",
  INVOICE_GENERATED = "INVOICE_GENERATED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  BRIDGING = "BRIDGING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export enum StarknetToken {
  WBTC = "WBTC",
  USDC = "USDC",
  USDT = "USDT",
}

export interface LightningInvoice {
  paymentRequest: string;
  paymentHash: string;
  amount: number; // sats
  expiresAt: number; // timestamp
  description?: string;
}

export interface SwapQuote {
  inputAmount: number; // sats for LN, or token amount in wei for Starknet
  outputAmount: string; // token amount in wei for Starknet, or sats for LN
  exchangeRate: number;
  estimatedFee: number;
  networkFee: number;
  serviceFee: number;
  minimumAmount: number;
  maximumAmount: number;
  expiresAt: number; // timestamp
  direction: SwapDirection;
}

export interface SwapRequest {
  direction: SwapDirection;
  amount: number; // sats for LN, or amount in smallest unit
  targetToken?: StarknetToken; // required for LN -> Starknet
  recipientAddress?: string; // Starknet address
  speed?: "instant" | "normal"; // instant = Lightning, normal = on-chain BTC
}

export interface SwapTransaction {
  id: string;
  status: SwapStatus;
  direction: SwapDirection;
  inputAmount: number;
  outputAmount: string;
  targetToken?: StarknetToken;
  recipientAddress?: string;
  lightningInvoice?: LightningInvoice;
  transactionHash?: string; // Starknet tx hash
  bitcoinTxId?: string; // Bitcoin on-chain tx id
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  error?: string;
}

export interface SwapConfig {
  network: "mainnet" | "testnet";
  starknetRpcUrl: string;
  minSwapAmount: number; // minimum sats
  maxSwapAmount: number; // maximum sats
  gasReservePercentage: number; // percentage to reserve for gas (e.g., 2 for 2%)
  enableAutoGasReserve: boolean; // automatically reserve gas when swapping to Starknet
}

export interface SwapperOptions {
  network: "mainnet" | "testnet";
  starknetRpcUrl: string;
  starknetAccount?: any; // StarknetSigner from Atomiq SDK
}

export interface GasReserveInfo {
  reserveAmount: string; // USDC amount in wei
  percentage: number;
  wbtcAmount: string; // WBTC amount in wei after reserve
}
