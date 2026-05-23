// app/(app)/bills/airtime.tsx

import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter }    from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons }     from "@expo/vector-icons";
import { Screen }       from "@/components/layout/Screen";
import { Input }        from "@/components/ui/Input";
import { Button }       from "@/components/ui/Button";
import { PinInput }     from "@/components/ui/PinInput";
import { ErrorCard }    from "@/components/ui/ErrorCard";
import { useTheme, textStyles, spacing, radius } from "@/theme";
import { billsApi }     from "@/api/bills.api";
import { useToast }     from "@/hooks/useToast";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchBalance, fetchTransactions } from "@/store/slices/wallet.slice";
import { nanoid }       from "nanoid/non-secure";
import { S3Link }       from "@/constants/links";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { BalanceBanner }  from "@/components/ui/BalanceBanner";
import { useBiometricPin } from "@/hooks/useBiometricPin";

const NETWORKS = [
  { id: "mtn",     name: "MTN",     logo: S3Link + "/bill-providers/mtn.png" },
  { id: "airtel",  name: "Airtel",  logo: S3Link + "/bill-providers/airtel.png" },
  { id: "glo",     name: "Glo",     logo: S3Link + "/bill-providers/glo.png" },
  { id: "9mobile", name: "9Mobile", logo: S3Link + "/bill-providers/9mobile.png" },
];
const QUICK = [100, 200, 500, 1000, 2000, 5000];


export default function AirtimeScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const toast     = useToast();
  const dispatch  = useAppDispatch();
  const wallet    = useAppSelector((s) => s.wallet);
  const user      = useAppSelector((s) => s.auth.user);

  const [network,  setNetwork]  = useState(NETWORKS[0]);
  const [phone,    setPhone]    = useState("");
  const [amount,   setAmount]   = useState("");
  const [step,     setStep]     = useState<"form" | "pin" | "success">("form");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [pinError, setPinError] = useState(false);
  const pinRef = React.useRef<{ shake: () => void; reset: () => void } | null>(null);
  const { showBiometrics, onBiometrics } = useBiometricPin(submit);

  // Reset to form when screen gains focus (prevents stale success state)
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (step === "success") {
          setStep("form");
          setPhone("");
          setAmount("");
          setError("");
          setPinError(false);
        }
      };
    }, [step]),
  );

  const balanceNaira = Math.floor(parseInt(wallet.balanceRaw ?? "0") / 100);

  function validate() {
    if (phone.length < 10) { setError("Enter a valid phone number"); return false; }
    if (!amount || parseInt(amount) < 50) { setError("Minimum is ₦50"); return false; }
    if (parseInt(amount) > balanceNaira) { setError("Insufficient balance"); return false; }
    setError("");
    return true;
  }

  async function submit(pin: string) {
    if (!pin || pin.length < 4) {
      setPinError(true);
      pinRef.current?.shake();
      setError("Enter your 4-digit PIN");
      return;
    }
    setPinError(false);
    setLoading(true);
    try {
      await billsApi.buyAirtime({
        network: network.id,
        phone,
        amount: parseInt(amount),
        pin,
        idempotency_key: nanoid(),
      });
      // Refresh balance & transactions
      dispatch(fetchBalance());
      dispatch(fetchTransactions({ page: 1 }));
      setStep("success");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Payment failed";
      setPinError(true);
      pinRef.current?.shake();
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") return (
    <Screen padded>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Airtime Sent!</Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center", marginTop: spacing[2] }]}>
          {"₦"}{parseInt(amount).toLocaleString()} {network.name} airtime sent to {phone}
        </Text>
        <Button
          label="Done"
          onPress={() => router.back()}
          style={{ marginTop: spacing[8], width: "100%" }}
        />
        <TouchableOpacity
          onPress={() => { setStep("form"); setPhone(""); setAmount(""); setError(""); setPinError(false); }}
          style={{ marginTop: spacing[3] }}
        >
          <Text style={[textStyles.body, { color: theme.text.link }]}>Buy Another</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );

  if (step === "pin") return (
    <Screen padded>
      <LoadingOverlay visible={loading} message="Processing..." />
      <TouchableOpacity onPress={() => setStep("form")} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        <Text style={[textStyles.label, { color: theme.text.primary, marginLeft: spacing[2] }]}>Back</Text>
      </TouchableOpacity>
      <View style={styles.center}>
        <Image source={{ uri: network.logo }} style={styles.logoBig} resizeMode="contain" />
        <Text style={[textStyles.h1, { color: theme.text.primary }]}>{"₦"}{parseInt(amount).toLocaleString()}</Text>
        <Text style={[textStyles.body, { color: theme.text.secondary }]}>{network.name} Airtime {"→"} {phone}</Text>
        <View style={{ marginTop: spacing[6], width: "100%" }}>
          <PinInput
            onComplete={submit}
            error={pinError}
            onRef={(api) => { pinRef.current = api; }}
            showBiometrics={showBiometrics}
            onBiometrics={onBiometrics}
          />
        </View>
        {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
      </View>
    </Screen>
  );

  return (
    <Screen padded scrollable>
      <LoadingOverlay visible={loading} message="Processing..." />
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        <Text style={[textStyles.label, { color: theme.text.primary, marginLeft: spacing[2] }]}>Buy Airtime</Text>
      </TouchableOpacity>

      <BalanceBanner />

      <Text style={[textStyles.labelSm, { color: theme.text.secondary, marginTop: spacing[4], marginBottom: spacing[2] }]}>SELECT NETWORK</Text>
      <View style={styles.netRow}>
        {NETWORKS.map((n) => (
          <TouchableOpacity key={n.id} onPress={() => setNetwork(n)}
            style={[styles.netCard, { backgroundColor: theme.bg.secondary, borderColor: network.id === n.id ? theme.brand.primary : "transparent" }]}>
            <Image source={{ uri: n.logo }} style={styles.logo} resizeMode="contain" />
            <Text style={[textStyles.caption, { color: theme.text.primary }]}>{n.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Phone Number"
        value={phone}
        onChangeText={(v) => { setPhone(v); setError(""); }}
        keyboardType="phone-pad"
        maxLength={11}
        placeholder="08012345678"
        style={{ marginTop: spacing[4] }}
      />

      <Input
        label="Amount (₦)"
        value={amount}
        onChangeText={(v) => { setAmount(v); setError(""); }}
        keyboardType="numeric"
        placeholder="Enter amount"
        style={{ marginTop: spacing[3] }}
      />

      <View style={styles.quickRow}>
        {QUICK.map((a) => (
          <TouchableOpacity key={a} onPress={() => setAmount(String(a))}
            style={[styles.quickBtn, { backgroundColor: amount === String(a) ? theme.brand.primary : theme.bg.secondary }]}>
            <Text style={[textStyles.caption, { color: amount === String(a) ? "#fff" : theme.text.secondary }]}>
              {"₦"}{a.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
      <Button
        label="Continue"
        onPress={() => { if (validate()) setStep("pin"); }}
        style={{ marginTop: spacing[6] }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:        { flexDirection: "row", alignItems: "center", marginBottom: spacing[2] },
  netRow:      { flexDirection: "row", gap: spacing[2] },
  netCard:     { flex: 1, alignItems: "center", borderRadius: radius.xl, padding: spacing[3], gap: spacing[1], borderWidth: 2 },
  logo:        { width: 36, height: 36, borderRadius: 8 },
  logoBig:     { width: 64, height: 64, borderRadius: 12 },
  quickRow:    { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginTop: spacing[3] },
  quickBtn:    { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  center:      { alignItems: "center", paddingTop: spacing[6] },
  overlayBg:   { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  overlayCard: { backgroundColor: "#fff", borderRadius: 16, paddingVertical: 28, paddingHorizontal: 40, alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  overlayText: { fontSize: 15, fontWeight: "600", color: "#111", marginTop: 4 },
});
