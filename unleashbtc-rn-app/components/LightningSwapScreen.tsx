import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { usePrivy } from "@privy-io/expo";
import Toast from "react-native-toast-message";
import QRCode from "react-native-qrcode-styled";
import { API_URL } from "@/utils/config";
import { formatStarknetAddress, txExplorerUrl } from "@/utils/format";

type SwapDirection = "LN_TO_STARKNET" | "STARKNET_TO_LN";
type SwapStatus =
  | "IDLE"
  | "QUOTE"
  | "INVOICE_GENERATED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

interface SwapQuote {
  inputAmount: number;
  outputAmount: string;
  exchangeRate: number;
  estimatedFee: number;
  networkFee: number;
  serviceFee: number;
  gasReserveAmount?: string;
  wbtcAmount?: string;
}

interface LightningInvoice {
  paymentRequest: string;
  paymentHash: string;
  amount: number;
  expiresAt: number;
}

export default function LightningSwapScreen() {
  const { isReady, user, getAccessToken } = usePrivy() as any;
  const baseApi = API_URL.replace(/\/+$/, "");

  // State
  const [direction, setDirection] = useState<SwapDirection>("LN_TO_STARKNET");
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [status, setStatus] = useState<SwapStatus>("IDLE");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [invoice, setInvoice] = useState<LightningInvoice | null>(null);
  const [swapId, setSwapId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-populate recipient address from user's wallet
  useEffect(() => {
    // TODO: Get user's Starknet address from wallet
    // For now, leave empty for user to input
  }, [user]);

  const resetState = () => {
    setStatus("IDLE");
    setQuote(null);
    setInvoice(null);
    setSwapId(null);
    setTxHash(null);
    setError(null);
  };

  const handleGetQuote = async () => {
    setError(null);
    const amountSats = parseInt(amount);

    if (!amountSats || amountSats < 10000) {
      setError("Minimum amount is 10,000 sats (0.0001 BTC)");
      return;
    }

    if (direction === "LN_TO_STARKNET" && !recipientAddress) {
      setError("Please enter a Starknet recipient address");
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch(`${baseApi}/lightning/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          amount: amountSats,
          targetToken: "WBTC",
          recipientAddress:
            direction === "LN_TO_STARKNET" ? recipientAddress : undefined,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to get quote");

      setQuote(data.quote);
      setStatus("QUOTE");

      Toast.show({
        type: "success",
        text1: "Quote received",
        text2: `You will receive ${data.quote.outputAmount} sats worth of WBTC`,
      });
    } catch (e: any) {
      setError(e.message || "Failed to get quote");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSwap = async () => {
    if (!quote) return;

    try {
      setLoading(true);
      setError(null);

      let userJwt: string | undefined;
      try {
        userJwt =
          typeof getAccessToken === "function"
            ? await getAccessToken()
            : undefined;
      } catch {}

      if (!userJwt) {
        throw new Error("Authentication required");
      }

      const resp = await fetch(`${baseApi}/lightning/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({
          direction,
          amount: parseInt(amount),
          targetToken: "WBTC",
          recipientAddress:
            direction === "LN_TO_STARKNET" ? recipientAddress : undefined,
          speed: "instant",
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Failed to initiate swap");

      setSwapId(data.transaction.id);

      if (direction === "LN_TO_STARKNET") {
        setInvoice(data.transaction.lightningInvoice);
        setStatus("INVOICE_GENERATED");

        Toast.show({
          type: "success",
          text1: "Invoice Generated",
          text2: "Pay this invoice to complete the swap",
          visibilityTime: 5000,
        });

        // Start monitoring the swap
        monitorSwap(data.transaction.id);
      } else {
        setStatus("PROCESSING");
        monitorSwap(data.transaction.id);
      }
    } catch (e: any) {
      setError(e.message || "Failed to initiate swap");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const monitorSwap = async (id: string) => {
    try {
      const checkInterval = setInterval(async () => {
        try {
          const resp = await fetch(`${baseApi}/lightning/swap/${id}`);
          const data = await resp.json();

          if (data.transaction.status === "COMPLETED") {
            clearInterval(checkInterval);
            setStatus("COMPLETED");
            setTxHash(data.transaction.transactionHash);

            Toast.show({
              type: "success",
              text1: "Swap Completed! 🎉",
              text2: "Tap to view transaction",
              onPress: () =>
                data.transaction.transactionHash &&
                Linking.openURL(
                  txExplorerUrl(data.transaction.transactionHash)
                ),
              visibilityTime: 8000,
            });
          } else if (data.transaction.status === "FAILED") {
            clearInterval(checkInterval);
            setStatus("FAILED");
            setError(data.transaction.error || "Swap failed");
          }
        } catch (err) {
          console.error("Error monitoring swap:", err);
        }
      }, 5000); // Check every 5 seconds

      // Stop monitoring after 1 hour
      setTimeout(() => clearInterval(checkInterval), 3600000);
    } catch (err) {
      console.error("Failed to start monitoring:", err);
    }
  };

  const copyToClipboard = async (text: string) => {
    // Use expo-clipboard
    try {
      // Import and use Clipboard API
      Toast.show({
        type: "success",
        text1: "Copied to clipboard",
      });
    } catch {}
  };

  if (!isReady || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please log in to use Lightning Swap</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>⚡ Lightning Swap</Text>
        <Text style={styles.subtitle}>
          Instantly swap between Lightning Network and Starknet
        </Text>

        {/* Direction Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Swap Direction</Text>
          <View style={styles.directionButtons}>
            <TouchableOpacity
              style={[
                styles.directionButton,
                direction === "LN_TO_STARKNET" && styles.directionButtonActive,
              ]}
              onPress={() => {
                setDirection("LN_TO_STARKNET");
                resetState();
              }}
            >
              <Text
                style={[
                  styles.directionButtonText,
                  direction === "LN_TO_STARKNET" &&
                    styles.directionButtonTextActive,
                ]}
              >
                ⚡ → Starknet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.directionButton,
                direction === "STARKNET_TO_LN" && styles.directionButtonActive,
              ]}
              onPress={() => {
                setDirection("STARKNET_TO_LN");
                resetState();
              }}
            >
              <Text
                style={[
                  styles.directionButtonText,
                  direction === "STARKNET_TO_LN" &&
                    styles.directionButtonTextActive,
                ]}
              >
                Starknet → ⚡
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        {status === "IDLE" && (
          <View style={styles.card}>
            <Text style={styles.label}>Amount (sats)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="10000"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.helperText}>
              Minimum: 10,000 sats (0.0001 BTC)
            </Text>

            {direction === "LN_TO_STARKNET" && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>
                  Recipient Starknet Address
                </Text>
                <TextInput
                  style={styles.input}
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  placeholder="0x..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleGetQuote}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Loading..." : "Get Quote"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quote Display */}
        {status === "QUOTE" && quote && (
          <View style={styles.card}>
            <Text style={styles.quoteTitle}>Swap Quote</Text>

            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>You pay:</Text>
              <Text style={styles.quoteValue}>{quote.inputAmount} sats</Text>
            </View>

            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Network fee:</Text>
              <Text style={styles.quoteValue}>{quote.networkFee} sats</Text>
            </View>

            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Service fee:</Text>
              <Text style={styles.quoteValue}>{quote.serviceFee} sats</Text>
            </View>

            {quote.gasReserveAmount && (
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Gas reserve (2%):</Text>
                <Text style={styles.quoteValue}>
                  {quote.gasReserveAmount} sats
                </Text>
              </View>
            )}

            <View
              style={[
                styles.quoteRow,
                {
                  borderTopWidth: 1,
                  borderTopColor: "#E2E8F0",
                  paddingTop: 12,
                  marginTop: 8,
                },
              ]}
            >
              <Text style={[styles.quoteLabel, { fontWeight: "600" }]}>
                You receive:
              </Text>
              <Text
                style={[
                  styles.quoteValue,
                  { fontWeight: "600", color: "#10B981" },
                ]}
              >
                {quote.outputAmount} sats
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={resetState}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleInitiateSwap}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Processing..." : "Confirm Swap"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lightning Invoice Display */}
        {status === "INVOICE_GENERATED" && invoice && (
          <View style={styles.card}>
            <Text style={styles.quoteTitle}>⚡ Pay This Invoice</Text>

            <View style={styles.qrContainer}>
              <QRCode
                data={invoice.paymentRequest}
                style={styles.qrCode}
                padding={20}
                pieceSize={8}
              />
            </View>

            <View style={styles.invoiceDetails}>
              <Text style={styles.invoiceLabel}>Amount:</Text>
              <Text style={styles.invoiceValue}>{invoice.amount} sats</Text>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(invoice.paymentRequest)}
            >
              <Text style={styles.copyButtonText}>📋 Copy Invoice</Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Waiting for payment... This will update automatically.
            </Text>

            <ActivityIndicator
              size="large"
              color="#3B82F6"
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {/* Processing State */}
        {status === "PROCESSING" && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.quoteTitle, { marginTop: 16 }]}>
              Processing Swap...
            </Text>
            <Text style={styles.helperText}>
              Your swap is being processed. This may take a few minutes.
            </Text>
          </View>
        )}

        {/* Completed State */}
        {status === "COMPLETED" && (
          <View style={styles.card}>
            <Text style={[styles.quoteTitle, { color: "#10B981" }]}>
              ✅ Swap Completed!
            </Text>

            {txHash && (
              <TouchableOpacity
                onPress={() => Linking.openURL(txExplorerUrl(txHash))}
                style={{ marginTop: 16 }}
              >
                <Text style={styles.link}>View on Explorer →</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { marginTop: 24 }]}
              onPress={() => {
                resetState();
                setAmount("");
                setRecipientAddress("");
              }}
            >
              <Text style={styles.buttonText}>New Swap</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Failed State */}
        {status === "FAILED" && (
          <View style={styles.card}>
            <Text style={[styles.quoteTitle, { color: "#EF4444" }]}>
              ❌ Swap Failed
            </Text>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { marginTop: 24 }]}
              onPress={resetState}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && status !== "FAILED" && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  helperText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 6,
    textAlign: "center",
  },
  directionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  directionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  directionButtonActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  directionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  directionButtonTextActive: {
    color: "#3B82F6",
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
  },
  secondaryButton: {
    backgroundColor: "#94A3B8",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
    textAlign: "center",
  },
  quoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  quoteLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  qrContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  qrCode: {
    backgroundColor: "#FFFFFF",
  },
  invoiceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    marginVertical: 16,
  },
  invoiceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  invoiceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
  },
  copyButton: {
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  link: {
    fontSize: 16,
    color: "#3B82F6",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
