// app/(app)/bills/data.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Modal, FlatList, ScrollView } from "react-native";
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
import { S3Link } from "@/constants/links";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { BalanceBanner }  from "@/components/ui/BalanceBanner";
import { useBiometricPin } from "@/hooks/useBiometricPin";
import { recentCache, RecentBillContact } from "@/services/recentCache";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";
import { SaveBeneficiaryModal } from "@/components/ui/SaveBeneficiaryModal";
import * as Contacts from 'expo-contacts';

const NETWORKS = [
  { id: "mtn",     name: "MTN",     logo:  S3Link + "/bill-providers/mtn.png" },
  { id: "airtel",  name: "Airtel",  logo: S3Link + "/bill-providers/airtel.png" },
  { id: "glo",     name: "Glo",     logo:  S3Link + "/bill-providers/glo.png" },
  { id: "9mobile", name: "9Mobile", logo:  S3Link + "/bill-providers/9mobile.png" },
];

export default function DataScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const toast     = useToast();
  const dispatch  = useAppDispatch();
  const user      = useAppSelector((s) => s.auth.user);
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

  // â”€â”€ Self / Other toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [mode, setMode] = useState<"self" | "other">("other");

  useEffect(() => {
    if (mode === "self") {
      setPhone(user?.phone ?? "");
    } else {
      setPhone("");
    }
  }, [mode]);

  // â”€â”€ Contacts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [billContacts, setBillContacts] = useState<RecentBillContact[]>([]);
  const [showContacts, setShowContacts] = useState(false);
  const { beneficiaries: savedBeneficiaries, add: saveBeneficiary, remove: removeBeneficiary } = useBeneficiaries('airtime');
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{ item: RecentBillContact; key: string } | null>(null);

  useEffect(() => {
    recentCache.getBillContacts().then(setBillContacts);
  }, []);

  async function pickContact() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') { toast.error('Allow contacts access to use this feature'); return; }
    const contact = await Contacts.presentContactPickerAsync();
    const number = contact?.phoneNumbers?.[0]?.number?.replace(/\D/g, '').slice(-11);
    if (number) setPhone(number);
  }

  const { showBiometrics, onBiometrics } = useBiometricPin(submit);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (step === "success") {
          setStep("form");
          setPhone(mode === "self" ? (user?.phone ?? "") : "");
          setPlan(null);
          setError("");
          setPinError(false);
        }
      };
    }, [step, mode]),
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
      // Save to shared bill contacts cache
      await recentCache.addBillContact({
        phone,
        networkId:   network.id,
        networkName: network.name,
        networkLogo: network.logo,
      });
      const fresh = await recentCache.getBillContacts();
      setBillContacts(fresh);
      setStep("success");
    } catch (err: any) {
      const msg = err?.message ?? "Payment failed";
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

      {!savedBeneficiaries.some((b) => b.details.phone === phone && b.details.networkId === network.id) && (
        <TouchableOpacity
          onPress={() => setPendingSave({ item: { phone, networkId: network.id, networkName: network.name, networkLogo: network.logo }, key: phone + network.id })}
          style={[styles.saveBeneficiaryCard, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
          activeOpacity={0.75}
        >
          <Ionicons name="star-outline" size={20} color={theme.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>Save to beneficiaries</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>Quickly access this number next time</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
        </TouchableOpacity>
      )}

      <SaveBeneficiaryModal
        visible={!!pendingSave}
        defaultAlias={pendingSave?.item.phone ?? ''}
        onCancel={() => setPendingSave(null)}
        onSave={async (alias) => {
          if (!pendingSave) return;
          await saveBeneficiary({ type: 'airtime', label: pendingSave.item.phone, details: { ...pendingSave.item, alias } });
          setPendingSave(null);
        }}
      />
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
        <Text style={[textStyles.h1, { color: theme.text.primary }]}>{"₦"}{parseFloat(plan?.amount ?? "0").toLocaleString()}</Text>
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

      {/* â”€â”€ Self / Other toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={[styles.toggleRow, { backgroundColor: theme.bg.secondary, marginTop: spacing[4] }]}>
        {(["self", "other"] as const).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[styles.toggleBtn, mode === m && { backgroundColor: theme.brand.primary }]}
          >
            <Ionicons
              name={m === "self" ? "person-outline" : "people-outline"}
              size={15}
              color={mode === m ? "#000" : theme.text.muted}
            />
            <Text style={[textStyles.labelSm, { color: mode === m ? "#000" : theme.text.muted }]}>
              {m === "self" ? "Send to Self" : "Send to Other"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* â”€â”€ Phone input with contacts icon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Input
        label="Phone Number"
        value={phone}
        editable={mode === "other"}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={11}
        placeholder="08012345678"
        style={{ marginTop: spacing[3] }}
        //@ts-ignore
        rightElement={
          mode === "other" ? (
            <TouchableOpacity
              onPress={pickContact}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.contactIconBtn, { backgroundColor: theme.bg.secondary }]}
            >
              <Ionicons name="book-outline" size={16} color={theme.brand.primary} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="lock-closed-outline" size={18} color={theme.text.muted} />
          )
        }
      />

      {mode === "other" && (
        <TouchableOpacity onPress={() => setShowContacts(true)} style={styles.savedLink}>
          <Ionicons name="star-outline" size={13} color={theme.brand.primary} />
          <Text style={[textStyles.bodySm, { color: theme.brand.primary }]}>Select from saved beneficiaries</Text>
        </TouchableOpacity>
      )}

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
              <Text style={[textStyles.h3, { color: theme.brand.primary }]}>{"₦"}{parseFloat(p.amount).toLocaleString()}</Text>
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

      {/* â”€â”€ Contacts modal (saved + recent) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Modal
        visible={showContacts}
        animationType="slide"
        transparent
        onRequestClose={() => setShowContacts(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg.primary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border.DEFAULT }]}>
              <Text style={[textStyles.h3, { color: theme.text.primary }]}>Contacts</Text>
              <TouchableOpacity onPress={() => setShowContacts(false)}>
                <Ionicons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
              {savedBeneficiaries.length > 0 && (
                <>
                  <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] }]}>SAVED</Text>
                  {savedBeneficiaries.map((b) => (
                    <TouchableOpacity key={b.id} onPress={() => { setPhone(b.details.phone); setNetwork(NETWORKS.find((n) => n.id === b.details.networkId) ?? NETWORKS[0]); setShowContacts(false); }}
                      style={[styles.contactRow, { borderBottomColor: theme.border.DEFAULT }]}>
                      <Image source={{ uri: b.details.networkLogo }} style={styles.contactLogo} resizeMode="contain" />
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.label, { color: theme.text.primary }]}>{b.details.alias || b.details.phone}</Text>
                        <Text style={[textStyles.caption, { color: theme.text.muted }]}>{b.details.phone} · {b.details.networkName}</Text>
                      </View>
                      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={async () => { setSavingId(b.id); await removeBeneficiary(b.id); setSavingId(null); }}>
                        {savingId === b.id ? <ActivityIndicator size="small" color={theme.brand.primary} /> : <Ionicons name="star" size={20} color={theme.brand.primary} />}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {billContacts.filter((c) => !savedBeneficiaries.some((b) => b.details.phone === c.phone && b.details.networkId === c.networkId)).length > 0 && (
                <>
                  <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] }]}>RECENTLY USED</Text>
                  {billContacts
                    .filter((c) => !savedBeneficiaries.some((b) => b.details.phone === c.phone && b.details.networkId === c.networkId))
                    .map((item) => {
                      const key = item.phone + item.networkId;
                      return (
                        <TouchableOpacity key={key} onPress={() => { setPhone(item.phone); setNetwork(NETWORKS.find((n) => n.id === item.networkId) ?? NETWORKS[0]); setShowContacts(false); }}
                          style={[styles.contactRow, { borderBottomColor: theme.border.DEFAULT }]}>
                          <Image source={{ uri: item.networkLogo }} style={styles.contactLogo} resizeMode="contain" />
                          <View style={{ flex: 1 }}>
                            <Text style={[textStyles.label, { color: theme.text.primary }]}>{item.phone}</Text>
                            <Text style={[textStyles.caption, { color: theme.text.muted }]}>{item.networkName}</Text>
                          </View>
                          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => { setShowContacts(false); setPendingSave({ item, key }); }}>
                            {savingId === key ? <ActivityIndicator size="small" color={theme.brand.primary} /> : <Ionicons name="star-outline" size={20} color={theme.text.muted} />}
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                </>
              )}

              {savedBeneficiaries.length === 0 && billContacts.length === 0 && (
                <View style={styles.emptyContacts}>
                  <Ionicons name="people-outline" size={40} color={theme.text.muted} />
                  <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3], textAlign: "center" }]}>
                    No contacts yet.{"\n"}Buy data or airtime to save contacts.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SaveBeneficiaryModal
        visible={!!pendingSave}
        defaultAlias={pendingSave?.item.phone ?? ''}
        onCancel={() => setPendingSave(null)}
        onSave={async (alias) => {
          if (!pendingSave) return;
          setSavingId(pendingSave.key);
          setPendingSave(null);
          await saveBeneficiary({ type: 'airtime', label: pendingSave.item.phone, details: { ...pendingSave.item, alias } });
          setSavingId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:     { flexDirection: "row", alignItems: "center", marginBottom: spacing[2] },
  netRow:   { flexDirection: "row", gap: spacing[2] },
  netCard:  { flex: 1, alignItems: "center", borderRadius: radius.xl, padding: spacing[3], gap: spacing[1], borderWidth: 2 },
  logo:     { width: 36, height: 36, borderRadius: 8 },
  logoBig:  { width: 64, height: 64, borderRadius: 12 },

  toggleRow: { flexDirection: "row", borderRadius: radius.full, padding: spacing[1] },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing[1.5], paddingVertical: spacing[2.5], borderRadius: radius.full,
  },

  plans:    { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  planCard: { width: "47%", borderRadius: radius.xl, padding: spacing[3], gap: spacing[1], borderWidth: 1.5 },
  center:   { alignItems: "center", paddingTop: spacing[6] },

  modalBg:   { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], maxHeight: "70%", minHeight: 300 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1,
  },
  emptyContacts: { alignItems: "center", paddingTop: spacing[10], paddingBottom: spacing[10] },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: spacing[3],
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 0.5,
  },
  contactLogo:    { width: 40, height: 40, borderRadius: 8 },
  contactIconBtn:      { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  savedLink:           { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginTop: spacing[2], marginBottom: spacing[1] },
  saveBeneficiaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderWidth: 1, borderRadius: radius.xl, padding: spacing[4],
    marginTop: spacing[4],
  },
});
