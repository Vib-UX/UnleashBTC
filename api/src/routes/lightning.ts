/**
 * Lightning Network Swap API Routes
 * Handles Lightning to Starknet swap operations using Atomiq SDK
 */

import { Router, Request, Response } from "express";

const router = Router();

// In-memory store for swap transactions (use Redis/DB in production)
const swapTransactions = new Map<string, any>();

/**
 * POST /lightning/quote
 * Get a quote for a Lightning <-> Starknet swap
 */
router.post("/quote", async (req: Request, res: Response) => {
  try {
    const { direction, amount, targetToken, recipientAddress } = req.body;

    if (!direction || !amount) {
      return res
        .status(400)
        .json({ error: "direction and amount are required" });
    }

    if (direction === "LN_TO_STARKNET" && !recipientAddress) {
      return res
        .status(400)
        .json({ error: "recipientAddress is required for LN_TO_STARKNET" });
    }

    // Calculate fees (example values - adjust based on actual Atomiq SDK)
    const serviceFee = Math.floor((amount * 100) / 10000); // 1%
    const networkFee = 100; // base fee in sats
    const totalFee = serviceFee + networkFee;
    const netAmount = amount - totalFee;

    // For LN -> Starknet, calculate gas reserve (2%)
    let gasReserveAmount = 0;
    let outputAmount = netAmount;

    if (direction === "LN_TO_STARKNET") {
      gasReserveAmount = Math.floor((netAmount * 2) / 100);
      outputAmount = netAmount - gasReserveAmount;
    }

    const quote = {
      inputAmount: amount,
      outputAmount: outputAmount.toString(),
      exchangeRate: 1.0,
      estimatedFee: totalFee,
      networkFee,
      serviceFee,
      minimumAmount: 10000,
      maximumAmount: 100000000,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      direction,
      gasReserveAmount:
        direction === "LN_TO_STARKNET"
          ? gasReserveAmount.toString()
          : undefined,
      wbtcAmount:
        direction === "LN_TO_STARKNET" ? outputAmount.toString() : undefined,
    };

    return res.status(200).json({ quote });
  } catch (error: any) {
    console.error("Error getting swap quote:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to get quote" });
  }
});

/**
 * POST /lightning/swap
 * Initiate a Lightning <-> Starknet swap
 */
router.post("/swap", async (req: Request, res: Response) => {
  try {
    const { direction, amount, targetToken, recipientAddress, speed } =
      req.body;

    if (!direction || !amount) {
      return res
        .status(400)
        .json({ error: "direction and amount are required" });
    }

    // Validate amount
    if (amount < 10000) {
      return res
        .status(400)
        .json({ error: "Amount too low. Minimum is 10,000 sats" });
    }

    if (amount > 100000000) {
      return res
        .status(400)
        .json({ error: "Amount too high. Maximum is 100,000,000 sats" });
    }

    // Generate swap ID
    const swapId = `swap_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    if (direction === "LN_TO_STARKNET") {
      if (!recipientAddress) {
        return res.status(400).json({ error: "recipientAddress is required" });
      }

      // Create Lightning invoice (mock - integrate with actual Atomiq SDK)
      const expiresAt = Date.now() + 3600 * 1000; // 1 hour
      const lightningInvoice = {
        paymentRequest: `lnbc${amount}n1...`, // Mock invoice
        paymentHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        amount,
        expiresAt,
        description: `Swap ${swapId} to Starknet`,
      };

      const transaction = {
        id: swapId,
        status: "INVOICE_GENERATED",
        direction,
        inputAmount: amount,
        outputAmount: (amount * 0.97).toString(), // After fees
        targetToken: targetToken || "WBTC",
        recipientAddress,
        lightningInvoice,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt,
      };

      // Store transaction
      swapTransactions.set(swapId, transaction);

      // In production: Start monitoring Lightning invoice payment
      // For now, simulate payment after 10 seconds (for demo purposes)
      setTimeout(() => {
        const tx = swapTransactions.get(swapId);
        if (tx && tx.status === "INVOICE_GENERATED") {
          tx.status = "PAYMENT_RECEIVED";
          tx.updatedAt = Date.now();
          swapTransactions.set(swapId, tx);

          // Simulate bridging
          setTimeout(() => {
            tx.status = "BRIDGING";
            tx.updatedAt = Date.now();
            swapTransactions.set(swapId, tx);

            // Simulate completion
            setTimeout(() => {
              tx.status = "COMPLETED";
              tx.transactionHash = `0x${Math.random()
                .toString(16)
                .substr(2, 64)}`;
              tx.updatedAt = Date.now();
              swapTransactions.set(swapId, tx);
            }, 5000);
          }, 3000);
        }
      }, 10000);

      return res.status(200).json({ transaction });
    } else if (direction === "STARKNET_TO_LN") {
      // Handle Starknet to Lightning swap
      const transaction = {
        id: swapId,
        status: "PROCESSING",
        direction,
        inputAmount: amount,
        outputAmount: (amount * 0.98).toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      swapTransactions.set(swapId, transaction);

      // Simulate swap processing
      setTimeout(() => {
        const tx = swapTransactions.get(swapId);
        if (tx) {
          tx.status = "COMPLETED";
          tx.updatedAt = Date.now();
          swapTransactions.set(swapId, tx);
        }
      }, 15000);

      return res.status(200).json({ transaction });
    }

    return res.status(400).json({ error: "Invalid swap direction" });
  } catch (error: any) {
    console.error("Error initiating swap:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to initiate swap" });
  }
});

/**
 * GET /lightning/swap/:swapId
 * Get swap transaction status
 */
router.get("/swap/:swapId", async (req: Request, res: Response) => {
  try {
    const { swapId } = req.params;

    const transaction = swapTransactions.get(swapId);

    if (!transaction) {
      return res.status(404).json({ error: "Swap not found" });
    }

    return res.status(200).json({ transaction });
  } catch (error: any) {
    console.error("Error getting swap status:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to get swap status" });
  }
});

/**
 * GET /lightning/swaps
 * Get all swaps for a user (authenticated)
 */
router.get("/swaps", async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // In production: Query database for user's swaps
    // For now, return all swaps (mock)
    const allSwaps = Array.from(swapTransactions.values());

    return res.status(200).json({ swaps: allSwaps });
  } catch (error: any) {
    console.error("Error getting swaps:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to get swaps" });
  }
});

/**
 * POST /lightning/verify-payment
 * Verify Lightning invoice payment
 */
router.post("/verify-payment", async (req: Request, res: Response) => {
  try {
    const { paymentHash } = req.body;

    if (!paymentHash) {
      return res.status(400).json({ error: "paymentHash is required" });
    }

    // In production: Check with Lightning node/Atomiq SDK if payment is received
    // For now, return mock response
    const isPaid = Math.random() > 0.5; // 50% chance for demo

    return res.status(200).json({
      paymentHash,
      isPaid,
      paidAt: isPaid ? Date.now() : null,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to verify payment" });
  }
});

/**
 * GET /lightning/config
 * Get Lightning swap configuration
 */
router.get("/config", async (req: Request, res: Response) => {
  try {
    const config = {
      network: process.env.LIGHTNING_NETWORK || "testnet",
      minSwapAmount: 10000,
      maxSwapAmount: 100000000,
      gasReservePercentage: 2,
      enableAutoGasReserve: true,
      supportedTokens: ["WBTC", "USDC", "USDT"],
    };

    return res.status(200).json({ config });
  } catch (error: any) {
    console.error("Error getting config:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to get config" });
  }
});

export default router;
