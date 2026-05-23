// app/(app)/crypto/sell.tsx
import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons }     from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme, textStyles, spacing, radius } from "@/theme";
import { cryptoApi }    from "@/api/crypto.api";
import { useToast }     from "@/hooks/useToast";
import { PinInput }     from "@/components/ui/PinInput";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const COINS = [
  { symbol: "BTC",  name: "Bitcoin",  icon: "₿", color: "#F7931A" },
  { symbol: "ETH",  name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  { symbol: "USDT", name: "Tether",   icon: "₮", color: "#26A17B" },
  { symbol: "SOL",  name: "Solana",   icon: "◎", color: "#9945FF" },
];

export default function CryptoSellScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const { symbol: defaultSymbol } = useLocalSearchParams<{ symbol?: string }>();

  const [coin,         setCoin]         = useState(COINS.find(c => c.symbol === defaultSymbol) ?? COINS[0]);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [quote,        setQuote]        = useState<any>(null);
  const [pinError,     setPinError]     = useState(false);
  const [step,         setStep]         = useState<"form"|"quote"|"pin"|"success">("form");
  const [loading,      setLoading]      = useState(false);
  const [quoting,      setQuoting]      = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  async function getQuote() {
    const amt = parseFloat(cryptoAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setQuoting(true);
    try {
      const amountNgn = amt * 1000; // approximate for quote — backend recalculates
      const res = await cryptoApi.getQuote(coin.symbol, amountNgn, "sell");
      setQuote({ ...res, cryptoAmount });
      setStep("quote");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not get quote");
    } finally { setQuoting(false); }
  }

  async function sell(pin: string) {
    setPinError(false);
    setLoading(true);
    try {
      await cryptoApi.sell({ symbol: coin.symbol, cryptoAmount, pin });
      setStep("success");
    } catch (err: any) {
      setPinError(true);
      pinRef.current?.shake();
      toast.error(err?.response?.data?.message ?? "Sell failed");
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => {
          if (step === "quote") setStep("form");
          else if (step === "pin") setStep("quote");
          else router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Sell Crypto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {step === "form" && (
          <>
            <Text style={[textStyles.label, { color: theme.text.secondary }]}>Select Coin to Sell</Text>
            <View style={styles.coinRow}>
              {COINS.map((c) => (
                <TouchableOpacity
                  key={c.symbol}
                  onPress={() => { setCoin(c); setQuote(null); }}
                  style={[styles.coinBtn, {
                    backgroundColor: coin.symbol === c.symbol ? c.color + "20" : theme.bg.secondary,
                    borderColor:     coin.symbol === c.symbol ? c.color : "transparent",
                    borderWidth: 1.5,
                  }]}
                >
                  <Text style={{ fontSize: 20, color: c.color }}>{c.icon}</Text>
                  <Text style={[textStyles.labelSm, { color: theme.text.primary }]}>{c.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[textStyles.label, { color: theme.text.secondary }]}>Amount ({coin.symbol})</Text>
            <View style={[styles.amountInput, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
              <Text style={[textStyles.h3, { color: coin.color }]}>{coin.icon}</Text>
              <TextInput
                style={[textStyles.h2, { color: theme.text.primary, flex: 1 }]}
                value={cryptoAmount} onChangeText={setCryptoAmount}
                placeholder="0.00" placeholderTextColor={theme.text.muted}
                keyboardType="decimal-pad"
              />
              <Text style={[textStyles.label, { color: theme.text.muted }]}>{coin.symbol}</Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.bg.secondary }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.text.muted} />
              <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1 }]}>
                Selling applies a 1.5% spread. Proceeds are credited to your NGN wallet instantly.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary }]}
              onPress={getQuote} disabled={quoting}
            >
              {quoting ? <ActivityIndicator color="#000" /> : <Text style={[textStyles.label, { color: "#000" }]}>Get Quote</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === "quote" && quote && (
          <>
            <View style={[styles.quoteCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.label, { color: theme.text.secondary }]}>You sell</Text>
              <Text style={[{ fontSize: 28, fontWeight: "700", color: coin.color }]}>{cryptoAmount} {coin.symbol}</Text>
              <Ionicons name="arrow-down" size={24} color={theme.text.muted} style={{ marginVertical: spacing[2] }} />
              <Text style={[textStyles.label, { color: theme.text.secondary }]}>You receive</Text>
              <Text style={[textStyles.h1, { color: "#22C55E" }]}>₦{parseFloat(quote.amountNgn ?? "0").toLocaleString()}</Text>
              <View style={styles.divider} />
              {[
                { label: "Exchange Rate", value: `₦${parseFloat(quote.rate ?? "0").toLocaleString()} per ${coin.symbol}` },
                { label: "Platform Fee",  value: `${quote.platformFee} (₦${parseFloat(quote.fee ?? "0").toLocaleString()})` },
              ].map((row, i) => (
                <View key={i} style={styles.quoteRow}>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{row.label}</Text>
                  <Text style={[textStyles.caption, { color: theme.text.primary, fontWeight: "500" }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={[styles.cta, { backgroundColor: "#EF4444" }]} onPress={() => setStep("pin")}>
              <Text style={[textStyles.label, { color: "#fff" }]}>Confirm Sell</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "pin" && (
          <View style={styles.center}>
            <LoadingOverlay visible={loading} message="Processing sale..." />
            <View style={[styles.summary, { backgroundColor: theme.bg.secondary }]}>
              <Text style={{ fontSize: 36 }}>{coin.icon}</Text>
              <Text style={[textStyles.h2, { color: theme.text.primary }]}>{cryptoAmount} {coin.symbol}</Text>
              <Text style={[textStyles.body, { color: "#22C55E" }]}>→ ₦{parseFloat(quote?.amountNgn ?? "0").toLocaleString()}</Text>
            </View>
            <Text style={[textStyles.label, { color: theme.text.secondary, marginTop: spacing[6], marginBottom: spacing[3] }]}>Enter PIN to confirm</Text>
            <PinInput
              onComplete={sell}
              error={pinError}
              onRef={(api) => { pinRef.current = api; }}
            />
          </View>
        )}

        {step === "success" && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Sell Successful!</Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: "center" }]}>
              ₦{parseFloat(quote?.amountNgn ?? "0").toLocaleString()} has been credited to your NGN wallet
            </Text>
            <TouchableOpacity style={[styles.cta, { backgroundColor: theme.brand.primary, marginTop: spacing[6] }]} onPress={() => router.back()}>
              <Text style={[textStyles.label, { color: "#000" }]}>View Portfolio</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing[4] },
  content: { padding: spacing[4], gap: spacing[4] },
  coinRow: { flexDirection: "row", gap: spacing[2] },
  coinBtn: { flex: 1, alignItems: "center", borderRadius: radius.xl, padding: spacing[3], gap: spacing[1] },
  amountInput: { flexDirection: "row", alignItems: "center", gap: spacing[2], borderRadius: radius.xl, borderWidth: 1, paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  infoBox: { flexDirection: "row", gap: spacing[2], borderRadius: radius.xl, padding: spacing[3] },
  cta: { padding: spacing[4], borderRadius: radius.xl, alignItems: "center" },
  quoteCard: { borderRadius: radius.xl, padding: spacing[5], alignItems: "center", gap: spacing[2] },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", width: "100%", marginVertical: spacing[2] },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  center: { alignItems: "center", paddingTop: spacing[4], width: "100%" },
  summary: { width: "100%", borderRadius: radius.xl, padding: spacing[5], alignItems: "center", gap: spacing[2] },
});