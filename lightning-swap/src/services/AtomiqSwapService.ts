/**
 * Atomiq Swap Service
 * Main service for handling Lightning Network to Starknet swaps using Atomiq SDK
 */

import { SwapperFactory, BitcoinNetwork } from "@atomiqlabs/sdk";
import {
  StarknetInitializer,
  StarknetInitializerType,
  StarknetSigner,
} from "@atomiqlabs/chain-starknet";
import {
  SwapRequest,
  SwapTransaction,
  SwapQuote,
  SwapConfig,
  SwapStatus,
  SwapDirection,
  StarknetToken,
  LightningInvoice,
  GasReserveInfo,
} from "../types";
import {
  NETWORK_CONFIG,
  DEFAULT_CONFIG,
  FEE_STRUCTURE,
  ERROR_MESSAGES,
} from "../utils/constants";

export class AtomiqSwapService {
  private swapper: any;
  private config: SwapConfig;
  private starknetSigner?: any;

  constructor(config: Partial<SwapConfig>) {
    this.config = {
      network: config.network || "testnet",
      starknetRpcUrl:
        config.starknetRpcUrl || NETWORK_CONFIG.testnet.starknetRpcUrl,
      minSwapAmount: config.minSwapAmount || NETWORK_CONFIG.testnet.minSwapSats,
      maxSwapAmount: config.maxSwapAmount || NETWORK_CONFIG.testnet.maxSwapSats,
      gasReservePercentage:
        config.gasReservePercentage || DEFAULT_CONFIG.gasReservePercentage,
      enableAutoGasReserve:
        config.enableAutoGasReserve !== undefined
          ? config.enableAutoGasReserve
          : DEFAULT_CONFIG.enableAutoGasReserve,
    };

    this.initializeSwapper();
  }

  /**
   * Initialize the Atomiq Swapper Factory
   */
  private initializeSwapper(): void {
    try {
      const Factory = new SwapperFactory<[StarknetInitializerType]>([
        StarknetInitializer,
      ] as const);

      const networkConfig = NETWORK_CONFIG[this.config.network];

      this.swapper = Factory.newSwapper({
        chains: {
          STARKNET: {
            rpcUrl: this.config.starknetRpcUrl,
          },
        },
        bitcoinNetwork:
          networkConfig.bitcoinNetwork === "MAINNET"
            ? BitcoinNetwork.MAINNET
            : BitcoinNetwork.TESTNET,
      });

      console.log(`✅ Atomiq Swapper initialized for ${this.config.network}`);
    } catch (error) {
      console.error("Failed to initialize Atomiq Swapper:", error);
      throw error;
    }
  }

  /**
   * Set the Starknet signer for transactions
   */
  public setStarknetSigner(account: any): void {
    try {
      this.starknetSigner = new StarknetSigner(account);
      console.log("✅ Starknet signer set");
    } catch (error) {
      console.error("Failed to set Starknet signer:", error);
      throw error;
    }
  }

  /**
   * Get a quote for a swap
   */
  public async getSwapQuote(request: SwapRequest): Promise<SwapQuote> {
    this.validateSwapRequest(request);

    try {
      const { amount, direction, targetToken } = request;

      // Calculate fees
      const serviceFee = Math.floor(
        (amount * FEE_STRUCTURE.lightningServiceFeeBps) / 10000
      );
      const networkFee =
        direction === SwapDirection.LN_TO_STARKNET
          ? FEE_STRUCTURE.lightningNetworkFeeSats
          : FEE_STRUCTURE.bitcoinNetworkFeeSats;

      const totalFee = serviceFee + networkFee;
      const netAmount = amount - totalFee;

      // For LN -> Starknet, calculate gas reserve
      let outputAmount = netAmount;
      if (
        direction === SwapDirection.LN_TO_STARKNET &&
        this.config.enableAutoGasReserve
      ) {
        const gasReserve = Math.floor(
          (netAmount * this.config.gasReservePercentage) / 100
        );
        outputAmount = netAmount - gasReserve;
      }

      // Mock exchange rate (in production, fetch from Atomiq SDK or price oracle)
      // 1 BTC = 100,000,000 sats
      // Example: 1 sat = X WBTC (8 decimals on Starknet)
      const exchangeRate = 1.0; // Simplified for now

      return {
        inputAmount: amount,
        outputAmount: outputAmount.toString(),
        exchangeRate,
        estimatedFee: totalFee,
        networkFee,
        serviceFee,
        minimumAmount: this.config.minSwapAmount,
        maximumAmount: this.config.maxSwapAmount,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        direction,
      };
    } catch (error) {
      console.error("Failed to get swap quote:", error);
      throw error;
    }
  }

  /**
   * Calculate gas reserve allocation
   */
  public calculateGasReserve(btcAmount: number): GasReserveInfo {
    const reservePercentage = this.config.gasReservePercentage;
    const reserveAmountSats = Math.floor((btcAmount * reservePercentage) / 100);
    const wbtcAmountSats = btcAmount - reserveAmountSats;

    return {
      reserveAmount: reserveAmountSats.toString(), // In reality, convert to USDC amount
      percentage: reservePercentage,
      wbtcAmount: wbtcAmountSats.toString(),
    };
  }

  /**
   * Create a Lightning invoice for receiving BTC
   * This would typically call Atomiq SDK's invoice generation
   */
  public async createLightningInvoice(
    amountSats: number,
    description?: string
  ): Promise<LightningInvoice> {
    try {
      // In production, call Atomiq SDK to generate invoice
      // This is a mock implementation
      const expiresAt = Date.now() + DEFAULT_CONFIG.invoiceExpirySeconds * 1000;

      const invoice: LightningInvoice = {
        paymentRequest: `lnbc${amountSats}...`, // Mock invoice
        paymentHash: this.generateMockHash(),
        amount: amountSats,
        expiresAt,
        description: description || "Lightning to Starknet Swap",
      };

      console.log(`📄 Lightning invoice created: ${amountSats} sats`);
      return invoice;
    } catch (error) {
      console.error("Failed to create Lightning invoice:", error);
      throw error;
    }
  }

  /**
   * Execute a swap from Lightning Network to Starknet
   */
  public async executeLightningToStarknet(
    request: SwapRequest
  ): Promise<SwapTransaction> {
    this.validateSwapRequest(request);

    if (!request.recipientAddress) {
      throw new Error(ERROR_MESSAGES.INVALID_ADDRESS);
    }

    try {
      const swapId = this.generateSwapId();
      const quote = await this.getSwapQuote(request);

      // Create Lightning invoice
      const invoice = await this.createLightningInvoice(
        request.amount,
        `Swap ${swapId} to Starknet`
      );

      const transaction: SwapTransaction = {
        id: swapId,
        status: SwapStatus.INVOICE_GENERATED,
        direction: SwapDirection.LN_TO_STARKNET,
        inputAmount: request.amount,
        outputAmount: quote.outputAmount,
        targetToken: request.targetToken || StarknetToken.WBTC,
        recipientAddress: request.recipientAddress,
        lightningInvoice: invoice,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: invoice.expiresAt,
      };

      console.log(`🔄 Swap initiated: ${swapId}`);
      return transaction;
    } catch (error) {
      console.error("Failed to execute Lightning to Starknet swap:", error);
      throw error;
    }
  }

  /**
   * Monitor a swap transaction status
   */
  public async monitorSwapStatus(swapId: string): Promise<SwapTransaction> {
    try {
      // In production, query Atomiq SDK for swap status
      // This is a mock implementation
      console.log(`🔍 Monitoring swap: ${swapId}`);

      // Mock response
      const transaction: SwapTransaction = {
        id: swapId,
        status: SwapStatus.COMPLETED,
        direction: SwapDirection.LN_TO_STARKNET,
        inputAmount: 100000,
        outputAmount: "98000",
        targetToken: StarknetToken.WBTC,
        transactionHash: this.generateMockHash(),
        createdAt: Date.now() - 60000,
        updatedAt: Date.now(),
      };

      return transaction;
    } catch (error) {
      console.error("Failed to monitor swap status:", error);
      throw error;
    }
  }

  /**
   * Execute a swap from Starknet to Lightning Network
   */
  public async executeStarknetToLightning(
    request: SwapRequest,
    lightningInvoice: string
  ): Promise<SwapTransaction> {
    if (!this.starknetSigner) {
      throw new Error(ERROR_MESSAGES.SIGNER_NOT_INITIALIZED);
    }

    try {
      const swapId = this.generateSwapId();

      // In production, call Atomiq SDK to execute the swap
      console.log(`🔄 Executing Starknet to Lightning swap: ${swapId}`);

      const transaction: SwapTransaction = {
        id: swapId,
        status: SwapStatus.BRIDGING,
        direction: SwapDirection.STARKNET_TO_LN,
        inputAmount: request.amount,
        outputAmount: request.amount.toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return transaction;
    } catch (error) {
      console.error("Failed to execute Starknet to Lightning swap:", error);
      throw error;
    }
  }

  /**
   * Validate swap request parameters
   */
  private validateSwapRequest(request: SwapRequest): void {
    if (request.amount < this.config.minSwapAmount) {
      throw new Error(ERROR_MESSAGES.AMOUNT_TOO_LOW);
    }

    if (request.amount > this.config.maxSwapAmount) {
      throw new Error(ERROR_MESSAGES.AMOUNT_TOO_HIGH);
    }

    if (
      request.direction === SwapDirection.LN_TO_STARKNET &&
      !request.targetToken
    ) {
      request.targetToken = StarknetToken.WBTC; // Default to WBTC
    }
  }

  /**
   * Helper: Generate a unique swap ID
   */
  private generateSwapId(): string {
    return `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Helper: Generate a mock transaction hash
   */
  private generateMockHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  /**
   * Get current configuration
   */
  public getConfig(): SwapConfig {
    return { ...this.config };
  }
}
