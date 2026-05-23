// app/(app)/crypto/buy.tsx
import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
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

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];

export default function CryptoBuyScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const { symbol: defaultSymbol } = useLocalSearchParams<{ symbol?: string }>();

  const [coin,      setCoin]      = useState(COINS.find(c => c.symbol === defaultSymbol) ?? COINS[0]);
  const [amountNgn, setAmountNgn] = useState("");
  const [quote,     setQuote]     = useState<any>(null);
  const [pinError,  setPinError]  = useState(false);
  const [step,      setStep]      = useState<"form"|"quote"|"pin"|"success">("form");
  const [loading,   setLoading]   = useState(false);
  const [quoting,   setQuoting]   = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  async function getQuote() {
    const amt = parseInt(amountNgn);
    if (!amt || amt < 1000) { toast.error("Minimum purchase is ₦1,000"); return; }
    setQuoting(true);
    try {
      const res = await cryptoApi.getQuote(coin.symbol, amt, "buy");
      setQuote(res);
      setStep("quote");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not get quote");
    } finally { setQuoting(false); }
  }

  async function buy(pin: string) {
    setPinError(false);
    setLoading(true);
    try {
      await cryptoApi.buy({ symbol: coin.symbol, amountNgn: parseInt(amountNgn), pin });
      setStep("success");
    } catch (err: any) {
      setPinError(true);
      pinRef.current?.shake();
      toast.error(err?.response?.data?.message ?? "Purchase failed");
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
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Buy Crypto</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {step === "form" && (
          <>
            {/* Coin selector */}
            <Text style={[textStyles.label, { color: theme.text.secondary }]}>Select Coin</Text>
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

            {/* Amount */}
            <Text style={[textStyles.label, { color: theme.text.secondary }]}>Amount in Naira (₦)</Text>
            <View style={[styles.amountInput, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
              <Text style={[textStyles.h3, { color: theme.text.muted }]}>₦</Text>
              <TextInput
                style={[textStyles.h2, { color: theme.text.primary, flex: 1 }]}
                value={amountNgn}
                onChangeText={setAmountNgn}
                placeholder="0"
                placeholderTextColor={theme.text.muted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAmountNgn(String(a))}
                  style={[styles.quickBtn, { backgroundColor: amountNgn === String(a) ? theme.brand.primary : theme.bg.secondary }]}
                >
                  <Text style={[textStyles.caption, { color: amountNgn === String(a) ? "#000" : theme.text.secondary }]}>₦{a.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary }]}
              onPress={getQuote} disabled={quoting}
            >
              {quoting
                ? <ActivityIndicator color="#000" />
                : <Text style={[textStyles.label, { color: "#000" }]}>Get Quote</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {step === "quote" && quote && (
          <>
            <View style={[styles.quoteCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.label, { color: theme.text.secondary }]}>You pay</Text>
              <Text style={[textStyles.h1, { color: theme.text.primary }]}>₦{parseInt(amountNgn).toLocaleString()}</Text>
              <Ionicons name="arrow-down" size={24} color={theme.text.muted} style={{ marginVertical: spacing[2] }} />
              <Text style={[textStyles.label, { color: theme.text.secondary }]}>You receive</Text>
              <Text style={[{ fontSize: 28, fontWeight: "700", color: coin.color }]}>{quote.cryptoAmount} {coin.symbol}</Text>
              <View style={styles.divider} />
              {[
                { label: "Exchange Rate",   value: `₦${parseFloat(quote.rate).toLocaleString()} per ${coin.symbol}` },
                { label: "Platform Fee",    value: `${quote.platformFee} (₦${parseFloat(quote.fee).toLocaleString()})` },
              ].map((row, i) => (
                <View key={i} style={styles.quoteRow}>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{row.label}</Text>
                  <Text style={[textStyles.caption, { color: theme.text.primary, fontWeight: "500" }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.bg.secondary }]}>
              <Ionicons name="time-outline" size={16} color={theme.text.muted} />
              <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1 }]}>
                Quote valid for 30 seconds. Rate may change after confirmation.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary }]}
              onPress={() => setStep("pin")}
            >
              <Text style={[textStyles.label, { color: "#000" }]}>Confirm Purchase</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "pin" && (
          <View style={[styles.center, { width: "100%" }]}>
            <LoadingOverlay visible={loading} message="Processing purchase..." />
            <View style={[styles.summary, { backgroundColor: theme.bg.secondary }]}>
              <Text style={{ fontSize: 36 }}>{coin.icon}</Text>
              <Text style={[textStyles.h2, { color: theme.text.primary }]}>{quote?.cryptoAmount} {coin.symbol}</Text>
              <Text style={[textStyles.body, { color: theme.text.secondary }]}>for ₦{parseInt(amountNgn).toLocaleString()}</Text>
            </View>
            <Text style={[textStyles.label, { color: theme.text.secondary, marginTop: spacing[6], marginBottom: spacing[3] }]}>Enter PIN to confirm</Text>
            <PinInput
              onComplete={buy}
              error={pinError}
              onRef={(api) => { pinRef.current = api; }}
            />
          </View>
        )}

        {step === "success" && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Purchase Successful!</Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: "center" }]}>
              {quote?.cryptoAmount} {coin.symbol} added to your wallet
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
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  quickBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  cta: { padding: spacing[4], borderRadius: radius.xl, alignItems: "center" },
  quoteCard: { borderRadius: radius.xl, padding: spacing[5], alignItems: "center", gap: spacing[2] },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.06)", width: "100%", marginVertical: spacing[2] },
  quoteRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  infoBox: { flexDirection: "row", gap: spacing[2], borderRadius: radius.xl, padding: spacing[3] },
  center: { alignItems: "center", paddingTop: spacing[4] },
  summary: { width: "100%", borderRadius: radius.xl, padding: spacing[5], alignItems: "center", gap: spacing[2] },
});