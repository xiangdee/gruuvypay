// app/(app)/bills/betting.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
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
import { useAppDispatch } from "@/store/hooks";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { BalanceBanner }  from "@/components/ui/BalanceBanner";
import { useBiometricPin } from "@/hooks/useBiometricPin";
import { fetchBalance, fetchTransactions } from "@/store/slices/wallet.slice";
import { nanoid }       from "nanoid/non-secure";

const QUICK = [500, 1000, 2000, 5000, 10000];

export default function BettingScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const dispatch   = useAppDispatch();
  const [providers, setProviders] = useState<any[]>([]);
  const [provider,  setProvider]  = useState<any>(null);
  const [accountId, setAccountId] = useState("");
  const [phone,     setPhone]     = useState("");
  const [amount,    setAmount]    = useState("");
  const [step,      setStep]      = useState<"form"|"pin"|"success">("form");
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(true);
  const [error,     setError]     = useState("");
  const [pinError,  setPinError]  = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);
  const { showBiometrics, onBiometrics } = useBiometricPin(submit);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (step === "success") { setStep("form"); setAccountId(""); setPhone(""); setAmount(""); setError(""); setPinError(false); }
      };
    }, [step]),
  );

  useEffect(() => {
    billsApi.getBettingProviders()
      .then((r) => {
        const data = r?.data ?? [];
        setProviders(data);
        if (data.length) setProvider(data[0]);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  async function submit(pin: string) {
    if (!pin || pin.length < 4) { setPinError(true); pinRef.current?.shake(); return; }
    setPinError(false); setError("");
    setLoading(true);
    try {
      await billsApi.buyBetting({
        provider: provider.biller_code ?? provider.id, account_id: accountId,
        amount: parseInt(amount), phone, pin, idempotency_key: nanoid(),
      });
      dispatch(fetchBalance());
      dispatch(fetchTransactions({ page: 1 }));
      setStep("success");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Payment failed";
      setPinError(true); pinRef.current?.shake(); setError(msg);
    } finally { setLoading(false); }
  }

  function validate() {
    if (!provider) { toast.error("Select a provider"); return false; }
    if (!accountId) { setError("Enter your betting account ID"); return false; }
    if (!amount || parseInt(amount) < 100) { setError("Minimum is \u20a6100"); return false; }
    if (!phone || phone.length < 10) { setError("Enter your phone number"); return false; }
    setError(""); return true;
  }

  if (step === "success") return (
    <Screen padded>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Wallet Funded!</Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center", marginTop: spacing[2] }]}>
          {"\u20a6"}{parseInt(amount).toLocaleString()} added to your {provider?.name} wallet
        </Text>
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing[8], width: "100%" }} />
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
        <Ionicons name="trophy" size={48} color="#EC4899" />
        <Text style={[textStyles.h1, { color: theme.text.primary }]}>{"\u20a6"}{parseInt(amount).toLocaleString()}</Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center" }]}>
          {provider?.name} Wallet{"\n"}Account: {accountId}
        </Text>
        <View style={{ marginTop: spacing[8], width: "100%" }}>
          <PinInput onComplete={submit} error={pinError} onRef={(api) => { pinRef.current = api; }} showBiometrics={showBiometrics} onBiometrics={onBiometrics} />
        </View>
        {error ? <ErrorCard message={error} style={{ marginTop: spacing[4] }} /> : null}
      </View>
    </Screen>
  );

  return (
    <Screen padded scrollable>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        <Text style={[textStyles.label, { color: theme.text.primary, marginLeft: spacing[2] }]}>Fund Betting Wallet</Text>
      </TouchableOpacity>
      <BalanceBanner />

      <Text style={[textStyles.labelSm, { color: theme.text.secondary, marginTop: spacing[5], marginBottom: spacing[2] }]}>SELECT PROVIDER</Text>
      {fetching ? <ActivityIndicator color={theme.brand.primary} /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: spacing[2] }}>
            {providers.map((p) => (
              <TouchableOpacity key={p.biller_code ?? p.id} onPress={() => setProvider(p)}
                style={[styles.provBtn, { backgroundColor: provider?.biller_code === p.biller_code ? theme.brand.primary : theme.bg.secondary }]}>
                <Text style={[textStyles.label, { color: provider?.biller_code === p.biller_code ? "#fff" : theme.text.primary }]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <Input label="Betting Account ID" value={accountId} onChangeText={setAccountId}
        placeholder="Enter your account ID" style={{ marginTop: spacing[4] }} />
      <Input label="Phone Number" value={phone} onChangeText={setPhone}
        keyboardType="phone-pad" maxLength={11} placeholder="08012345678" style={{ marginTop: spacing[3] }} />
      <Input label="Amount (\u20a6)" value={amount} onChangeText={setAmount}
        keyboardType="numeric" placeholder="Minimum \u20a6100" style={{ marginTop: spacing[3] }} />

      <View style={styles.quickRow}>
        {QUICK.map((a) => (
          <TouchableOpacity key={a} onPress={() => setAmount(String(a))}
            style={[styles.quickBtn, { backgroundColor: amount === String(a) ? theme.brand.primary : theme.bg.secondary }]}>
            <Text style={[textStyles.caption, { color: amount === String(a) ? "#fff" : theme.text.secondary }]}>
              {"\u20a6"}{a.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
      <Button label="Continue" onPress={() => { if (validate()) setStep("pin"); }} style={{ marginTop: spacing[6] }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:     { flexDirection: "row", alignItems: "center", marginBottom: spacing[2] },
  provBtn:  { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderRadius: radius.xl },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginTop: spacing[3] },
  quickBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  center:   { alignItems: "center", paddingTop: spacing[4] },
});