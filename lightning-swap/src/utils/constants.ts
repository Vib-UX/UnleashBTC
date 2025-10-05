/**
 * Constants for Lightning Network and Starknet integration
 */

export const NETWORK_CONFIG = {
  mainnet: {
    starknetRpcUrl: "https://starknet-mainnet.public.blastapi.io/rpc/v0_7",
    bitcoinNetwork: "MAINNET" as const,
    minSwapSats: 10000, // 0.0001 BTC
    maxSwapSats: 100000000, // 1 BTC
  },
  testnet: {
    starknetRpcUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
    bitcoinNetwork: "TESTNET" as const,
    minSwapSats: 1000, // test amounts
    maxSwapSats: 10000000, // 0.1 BTC
  },
} as const;

// Token contract addresses on Starknet mainnet
export const STARKNET_TOKENS = {
  WBTC: {
    mainnet:
      "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    testnet: "0x0", // Add testnet address
  },
  USDC: {
    mainnet:
      "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
    testnet: "0x0", // Add testnet address
  },
  USDT: {
    mainnet:
      "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
    testnet: "0x0", // Add testnet address
  },
} as const;

// Default configuration
export const DEFAULT_CONFIG = {
  gasReservePercentage: 2, // 2% reserved for gas
  enableAutoGasReserve: true,
  defaultSpeed: "instant" as const, // Use Lightning by default
  invoiceExpirySeconds: 3600, // 1 hour
  maxRetries: 3,
  retryDelayMs: 5000,
} as const;

// Fee structure (example - adjust based on Atomiq SDK actual fees)
export const FEE_STRUCTURE = {
  // Lightning Network fees (in basis points, 100 = 1%)
  lightningServiceFeeBps: 100, // 1%
  lightningNetworkFeeSats: 100, // base fee in sats

  // On-chain Bitcoin fees
  bitcoinNetworkFeeSats: 5000, // approximate

  // Starknet gas reserve
  starknetGasReserveBps: 200, // 2%
} as const;

// Error messages
export const ERROR_MESSAGES = {
  AMOUNT_TOO_LOW: "Amount is below minimum swap threshold",
  AMOUNT_TOO_HIGH: "Amount exceeds maximum swap threshold",
  INVALID_ADDRESS: "Invalid Starknet address",
  INVOICE_EXPIRED: "Lightning invoice has expired",
  SWAP_FAILED: "Swap transaction failed",
  NETWORK_ERROR: "Network error occurred",
  INSUFFICIENT_BALANCE: "Insufficient balance for swap",
  SIGNER_NOT_INITIALIZED: "Starknet signer not initialized",
} as const;
