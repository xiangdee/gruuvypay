// app/(app)/bills/data.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
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
import { fetchBalance, fetchTransactions } from "@/store/slices/wallet.slice";
import { nanoid }       from "nanoid/non-secure";
import { S3Link } from "@/constants/links";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { BalanceBanner }  from "@/components/ui/BalanceBanner";
import { useBiometricPin } from "@/hooks/useBiometricPin";

const NETWORKS = [
  { id: "mtn",     name: "MTN",     logo:  S3Link +"/bill-providers/mtn.png", },
  { id: "airtel",  name: "Airtel",  logo: S3Link +"/bill-providers/airtel.png", },
  { id: "glo",     name: "Glo",     logo:  S3Link +"/bill-providers/glo.png", },
  { id: "9mobile", name: "9Mobile", logo:  S3Link +"/bill-providers/9mobile.png", },
];

export default function DataScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const toast     = useToast();
  const dispatch  = useAppDispatch();
  const [network,  setNetwork]  = useState(NETWORKS[0]);
  const [plans,    setPlans]    = useState<any[]>([]);
  const [plan,     setPlan]     = useState<any>(null);
  const [phone,    setPhone]    = useState("");
  const [step,     setStep]     = useState<"form"|"pin"|"success">("form");
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error,    setError]    = useState("");
  const [pinError, setPinError] = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);
  const { showBiometrics, onBiometrics } = useBiometricPin(submit);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (step === "success") { setStep("form"); setPhone(""); setPlan(null); setError(""); setPinError(false); }
      };
    }, [step]),
  );

  useEffect(() => {
    setFetching(true); setPlan(null);
    billsApi.getDataPlans(network.id)
      .then((r) => setPlans(r?.data ?? []))
      .catch(() => setPlans([]))
      .finally(() => setFetching(false));
  }, [network.id]);

  async function submit(pin: string) {
    if (!pin || pin.length < 4) { setPinError(true); pinRef.current?.shake(); return; }
    setPinError(false);
    setLoading(true);
    try {
      await billsApi.buyData({ network: network.id, phone, plan_id: plan.item_code, pin, idempotency_key: nanoid() });
      dispatch(fetchBalance());
      dispatch(fetchTransactions({ page: 1 }));
      setStep("success");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Payment failed";
      setPinError(true); pinRef.current?.shake(); setError(msg);
    } finally { setLoading(false); }
  }

  if (step === "success") return (
    <Screen padded>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Data Purchased!</Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center", marginTop: spacing[2] }]}>
          {network.name} {plan?.name} activated on {phone}
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
        <Image source={{ uri: network.logo }} style={styles.logoBig} resizeMode="contain" />
        <Text style={[textStyles.h1, { color: theme.text.primary }]}>{"\u20a6"}{parseFloat(plan?.amount ?? "0").toLocaleString()}</Text>
        <Text style={[textStyles.body, { color: theme.text.secondary }]}>{network.name} {plan?.name}</Text>
        <Text style={[textStyles.caption, { color: theme.text.muted }]}>{phone}</Text>
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
        <Text style={[textStyles.label, { color: theme.text.primary, marginLeft: spacing[2] }]}>Buy Data</Text>
      </TouchableOpacity>
      <BalanceBanner />

      <Text style={[textStyles.labelSm, { color: theme.text.secondary, marginTop: spacing[5], marginBottom: spacing[2] }]}>SELECT NETWORK</Text>
      <View style={styles.netRow}>
        {NETWORKS.map((n) => (
          <TouchableOpacity key={n.id} onPress={() => setNetwork(n)}
            style={[styles.netCard, { backgroundColor: theme.bg.secondary, borderColor: network.id === n.id ? theme.brand.primary : "transparent" }]}>
            <Image source={{ uri: n.logo }} style={styles.logo} resizeMode="contain" />
            <Text style={[textStyles.caption, { color: theme.text.primary }]}>{n.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Phone Number" value={phone} onChangeText={setPhone}
        keyboardType="phone-pad" maxLength={11} placeholder="08012345678" style={{ marginTop: spacing[4] }} />

      <Text style={[textStyles.labelSm, { color: theme.text.secondary, marginTop: spacing[4], marginBottom: spacing[2] }]}>SELECT PLAN</Text>
      {fetching ? <ActivityIndicator color={theme.brand.primary} style={{ marginVertical: spacing[4] }} /> : (
        <View style={styles.plans}>
          {plans.map((p) => (
            <TouchableOpacity key={p.item_code} onPress={() => setPlan(p)}
              style={[styles.planCard, {
                backgroundColor: plan?.item_code === p.item_code ? theme.brand.primary + "15" : theme.bg.secondary,
                borderColor:     plan?.item_code === p.item_code ? theme.brand.primary : "transparent",
              }]}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>{p.name}</Text>
              <Text style={[textStyles.h3, { color: theme.brand.primary }]}>{"\u20a6"}{parseFloat(p.amount).toLocaleString()}</Text>
              {p.validity ? <Text style={[textStyles.caption, { color: theme.text.muted }]}>{p.validity}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
      <Button label="Continue" disabled={!plan || phone.length < 10}
        onPress={() => {
          if (!plan) { toast.error("Select a plan"); return; }
          if (phone.length < 10) { toast.error("Enter phone number"); return; }
          setStep("pin");
        }} style={{ marginTop: spacing[6] }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:     { flexDirection: "row", alignItems: "center", marginBottom: spacing[2] },
  netRow:   { flexDirection: "row", gap: spacing[2] },
  netCard:  { flex: 1, alignItems: "center", borderRadius: radius.xl, padding: spacing[3], gap: spacing[1], borderWidth: 2 },
  logo:     { width: 36, height: 36, borderRadius: 8 },
  logoBig:  { width: 64, height: 64, borderRadius: 12 },
  plans:    { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  planCard: { width: "47%", borderRadius: radius.xl, padding: spacing[3], gap: spacing[1], borderWidth: 1.5 },
  center:   { alignItems: "center", paddingTop: spacing[6] },
});