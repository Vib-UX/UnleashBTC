import { Router, Request, Response } from "express";
import { getPrivyClient } from "../lib/privyClient";
import { computeReadyAddress, deployReadyAccount, getReadyAccount, buildReadyAccount } from "../lib/ready";
import { CallData } from "starknet";
import { getRpcProvider, setupPaymaster } from "../lib/provider";
import { getStarknetWallet } from "../lib/wallet";
const router = Router();

router.post("/create-wallet", async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).auth?.userId as string | undefined;
    const { chainType, ownerId } = (req.body || {}) as any;
    const privy = getPrivyClient();
    const payload: any = {
      chainType: chainType || "starknet",
      ...(ownerId || authUserId
        ? { owner: { userId: ownerId || authUserId } }
        : {}),
    };
    const result = await privy.walletApi.createWallet(payload);
    return res.status(200).json({ wallet: result });
  } catch (error: any) {
    console.error("Error creating Privy wallet:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to create Privy wallet" });
  }
});

router.post("/public-key", async (req: Request, res: Response) => {
  try {
    const { walletId } = (req.body || {}) as any;
    if (!walletId)
      return res.status(400).json({ error: "walletId is required" });
    const privy = getPrivyClient();
    const wallet = await privy.walletApi.getWallet({ id: walletId });
    return res.status(200).json({
      public_key: (wallet as any).public_key || (wallet as any).publicKey,
      wallet,
    });
  } catch (error: any) {
    console.error("Error fetching Privy wallet:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch Privy wallet" });
  }
});

router.post("/deploy-wallet", async (req: Request, res: Response) => {
  try {
    const { walletId } = (req.body || {}) as any;
    if (!walletId)
      return res.status(400).json({ error: "walletId is required" });
    const classHash = process.env.READY_CLASSHASH;
    if (!classHash)
      return res.status(500).json({ error: "READY_CLASSHASH not configured" });

    // Require authenticated user; we need a user JWT to generate a user signer/key
    const auth = (req as any).auth;
    const origin =
      (req.headers?.origin as string | undefined) || process.env.CLIENT_URL;
    const userJwt: string | undefined = auth?.token;
    const authUserId: string | undefined = auth?.userId;
    if (!userJwt || !authUserId) {
      return res
        .status(401)
        .json({ error: "Authentication required to deploy wallet" });
    }

    // Wallet API enforces ownership via user-signed authorization on raw_sign.
    const { publicKey } = await getStarknetWallet(walletId);
    const address = computeReadyAddress(publicKey);

    const deployResult: any = await deployReadyAccount({
      walletId,
      publicKey,
      classHash,
      userJwt,
      userId: authUserId,
      origin,
    });
    return res.status(200).json({
      walletId,
      address,
      publicKey,
      transactionHash: deployResult?.transaction_hash,
    });
  } catch (error: any) {
    console.error("Error deploying Ready account:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to deploy Ready account" });
  }
});

router.get("/user-wallets", async (req: Request, res: Response) => {
  try {
    const { userId } = (req.query || {}) as any;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    const privy = getPrivyClient();
    const user: any = await privy.getUserById(userId);
    const accounts = user?.linkedAccounts || user?.linked_accounts || [];
    const starkWallets = accounts.filter(
      (acc: any) => acc?.type === "wallet" && acc?.chain_type === "starknet"
    );
    const wallets = await Promise.all(
      starkWallets.map(async (acc: any) => {
        try {
          const w: any = await privy.walletApi.getWallet({ id: acc.id });
          const publicKey: string | undefined = w.public_key || w.publicKey;
          const address =
            w.address ||
            (publicKey ? computeReadyAddress(publicKey) : undefined);
          return {
            id: w.id,
            address,
            chainType: w.chain_type || w.chainType,
            publicKey,
          };
        } catch {
          return {
            id: acc.id,
            address: acc.address,
            chainType: acc.chain_type || "starknet",
          };
        }
      })
    );
    return res.status(200).json({ wallets });
  } catch (error: any) {
    console.error("Error fetching user wallets:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch user wallets" });
  }
});

// Read-only helper to call get_counter() on a contract
router.get("/counter", async (req: Request, res: Response) => {
  try {
    const contractParam = (req.query?.contract as string | undefined) || "";
    const user = (req.query?.user as string | undefined) || "";
    const contract =
      contractParam ||
      process.env.COUNTER_CONTRACT_ADDRESS ||
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "";
    if (!contract)
      return res.status(400).json({ error: "contract is required" });
    if (!user) return res.status(400).json({ error: "user is required" });
    const provider = getRpcProvider();
    const call = {
      contractAddress: contract,
      entrypoint:
        process.env.COUNTER_ENTRYPOINT_GET ||
        process.env.NEXT_PUBLIC_CONTRACT_ENTRY_POINT_GET_COUNTER ||
        "get_counter",
      calldata: [user],
    } as any;
    const result: any = await provider.callContract(call);
    const arr: string[] = Array.isArray(result?.result)
      ? result.result
      : Array.isArray(result)
      ? result
      : [];
    let hex = arr[0] || "0x0";
    if (typeof hex === "string" && !hex.startsWith("0x")) hex = `0x${hex}`;
    let decimal = "0";
    try {
      decimal = BigInt(hex).toString();
    } catch {}
    return res.status(200).json({ hex, decimal, raw: arr });
  } catch (error: any) {
    console.error("Error calling get_counter:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to read counter" });
  }
});

// Execute a transaction using the Ready account (Privy-backed signer)
// Body: { walletId, call: { contractAddress, entrypoint, calldata }, wait?: boolean }
router.post("/execute", async (req: Request, res: Response) => {
  try {
    const { walletId, call, calls, wait } = (req.body || {}) as any;
    if (!walletId)
      return res.status(400).json({ error: "walletId is required" });
    const classHash = process.env.READY_CLASSHASH;
    if (!classHash)
      return res.status(500).json({ error: "READY_CLASSHASH not configured" });

    // Require authenticated user for signing
    const auth = (req as any).auth;
    const origin =
      (req.headers?.origin as string | undefined) || process.env.CLIENT_URL;
    const userJwt: string | undefined = auth?.token;
    const authUserId: string | undefined = auth?.userId;
    if (!userJwt || !authUserId) {
      return res
        .status(401)
        .json({ error: "Authentication required to execute transactions" });
    }

    const { publicKey } = await getStarknetWallet(walletId);

      const { account, address } = await getReadyAccount({
        walletId,
        publicKey,
        classHash,
        userJwt,
        userId: authUserId,
        origin,
      });

    // Normalize call(s)
    const normalizeOne = (c: any) => {
      if (!c || !c.contractAddress || !c.entrypoint)
        throw new Error("call must include contractAddress and entrypoint");
      let calldata: any = c.calldata ?? [];
      if (
        calldata &&
        !Array.isArray(calldata) &&
        typeof calldata === "object"
      ) {
        calldata = CallData.compile(calldata);
      }
      return {
        contractAddress: c.contractAddress,
        entrypoint: c.entrypoint,
        calldata: calldata || [],
      };
    };
    const execCalls = calls
      ? (calls as any[]).map(normalizeOne)
      : call
      ? normalizeOne(call)
      : null;
    if (!execCalls)
      return res.status(400).json({ error: "call or calls is required" });

    const result: any = await account.execute(execCalls as any);
    if (wait) {
      try {
        await account.waitForTransaction(result.transaction_hash);
      } catch {}
    }
    return res.status(200).json({
      walletId,
      address,
      transactionHash: result?.transaction_hash,
      result,
    });
  } catch (error: any) {
    console.error("Error executing transaction:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to execute transaction" });
  }
});

// Domain-specific helper: increase_counter for the authenticated user's Ready account
// Body: { walletId, contractAddress?, wait?: boolean }
router.post("/increase-counter", async (req: Request, res: Response) => {
  try {
    const { walletId, contractAddress, wait } = (req.body || {}) as any;
    if (!walletId)
      return res.status(400).json({ error: "walletId is required" });
    const classHash = process.env.READY_CLASSHASH;
    if (!classHash)
      return res.status(500).json({ error: "READY_CLASSHASH not configured" });

    const target =
      contractAddress ||
      process.env.COUNTER_CONTRACT_ADDRESS ||
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!target)
      return res.status(400).json({ error: "contractAddress is required" });

    const auth = (req as any).auth;
    const origin =
      (req.headers?.origin as string | undefined) || process.env.CLIENT_URL;
    const userJwt: string | undefined = auth?.token;
    const authUserId: string | undefined = auth?.userId;
    if (!userJwt || !authUserId) {
      return res
        .status(401)
        .json({ error: "Authentication required to execute transactions" });
    }

    const { publicKey } = await getStarknetWallet(walletId);

    // If paymaster is configured, use SNIP-29 path; otherwise use normal execute
    const usePaymaster = !!(
      process.env.PAYMASTER_URL || process.env.PAYMASTER_MODE
    );
    if (usePaymaster) {
      let config;
      try {
        config = await setupPaymaster();
      } catch (e: any) {
        return res
          .status(500)
          .json({ error: e?.message || "Failed to initialize paymaster" });
      }
      const { paymasterRpc, isSponsored, gasToken } = config;

      const { account, address } = await buildReadyAccount({
        walletId,
        publicKey,
        classHash,
        userJwt,
        userId: authUserId,
        origin,
        paymasterRpc,
      });

      const call = {
        contractAddress: target,
        entrypoint:
          process.env.COUNTER_ENTRYPOINT_INCREASE || "increase_counter",
        calldata: [],
      } as any;
      const paymasterDetails: any = isSponsored
        ? { feeMode: { mode: "sponsored" as const } }
        : { feeMode: { mode: "default" as const, gasToken } };

      let maxFee: any = undefined;
      if (!isSponsored) {
        const est = await account.estimatePaymasterTransactionFee(
          [call],
          paymasterDetails
        );
        const withMargin15 = (v: any) => {
          const bi = BigInt(v.toString());
          return (bi * 3n + 1n) / 2n; // ceil(1.5x)
        };
        maxFee = withMargin15(est.suggested_max_fee_in_gas_token);
      }
      const result: any = await account.executePaymasterTransaction(
        [call],
        paymasterDetails,
        maxFee
      );
      if (wait) {
        try {
          await account.waitForTransaction(result.transaction_hash);
        } catch {}
      }
      return res.status(200).json({
        walletId,
        address,
        transactionHash: result?.transaction_hash,
        result,
        mode: isSponsored ? "sponsored" : "default",
      });
    } else {
      const { account, address } = await getReadyAccount({
        walletId,
        publicKey,
        classHash,
        userJwt,
        userId: authUserId,
        origin,
      });
      const result: any = await account.execute({
        contractAddress: target,
        entrypoint:
          process.env.COUNTER_ENTRYPOINT_INCREASE || "increase_counter",
        calldata: [],
      } as any);
      if (wait) {
        try {
          await account.waitForTransaction(result.transaction_hash);
        } catch {}
      }
      return res.status(200).json({
        walletId,
        address,
        transactionHash: result?.transaction_hash,
        result,
      });
    }
  } catch (error: any) {
    console.error("Error increasing counter:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to increase counter" });
  }
});

export default router;
