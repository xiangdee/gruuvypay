// app/(app)/bills/betting.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
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
import { recentCache, BettingBeneficiary } from "@/services/recentCache";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";
import { SaveBeneficiaryModal } from "@/components/ui/SaveBeneficiaryModal";

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

  // â”€â”€ Beneficiaries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [beneficiaries, setBeneficiaries] = useState<BettingBeneficiary[]>([]);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const { beneficiaries: savedBeneficiaries, add: saveBeneficiary, remove: removeBeneficiary } = useBeneficiaries('betting');
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{ item: BettingBeneficiary; key: string } | null>(null);

  useEffect(() => {
    recentCache.getBettingBeneficiaries().then(setBeneficiaries);
  }, []);

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
      // Save beneficiary
      await recentCache.addBettingBeneficiary({
        accountId,
        providerId:   provider.biller_code ?? provider.id,
        providerName: provider.name,
      });
      const fresh = await recentCache.getBettingBeneficiaries();
      setBeneficiaries(fresh);
      setStep("success");
    } catch (err: any) {
      const msg = err?.message ?? "Payment failed";
      setPinError(true); pinRef.current?.shake(); setError(msg);
    } finally { setLoading(false); }
  }

  function validate() {
    if (!provider) { toast.error("Select a provider"); return false; }
    if (!accountId) { setError("Enter your betting account ID"); return false; }
    if (!amount || parseInt(amount) < 100) { setError("Minimum is ₦100"); return false; }
    if (!phone || phone.length < 10) { setError("Enter your phone number"); return false; }
    setError(""); return true;
  }

  if (step === "success") return (
    <Screen padded>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Wallet Funded!</Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: "center", marginTop: spacing[2] }]}>
          {"₦"}{parseInt(amount).toLocaleString()} added to your {provider?.name} wallet
        </Text>
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing[8], width: "100%" }} />
      </View>

      {!savedBeneficiaries.some((b) => b.details.accountId === accountId && b.details.providerId === (provider?.biller_code ?? provider?.id)) && (
        <TouchableOpacity
          onPress={() => setPendingSave({
            item: { accountId, providerId: provider?.biller_code ?? provider?.id, providerName: provider?.name },
            key:  accountId + provider?.id,
          })}
          style={[styles.saveBeneficiaryCard, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
          activeOpacity={0.75}
        >
          <Ionicons name="star-outline" size={20} color={theme.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>Save to beneficiaries</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>Quickly access this account next time</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
        </TouchableOpacity>
      )}

      <SaveBeneficiaryModal
        visible={!!pendingSave}
        defaultAlias={pendingSave?.item.accountId ?? ''}
        onCancel={() => setPendingSave(null)}
        onSave={async (alias) => {
          if (!pendingSave) return;
          await saveBeneficiary({ type: 'betting', label: pendingSave.item.accountId, details: { ...pendingSave.item, alias } });
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
        <Ionicons name="trophy" size={48} color="#EC4899" />
        <Text style={[textStyles.h1, { color: theme.text.primary }]}>{"₦"}{parseInt(amount).toLocaleString()}</Text>
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

      <Input
        label="Betting Account ID"
        value={accountId}
        onChangeText={setAccountId}
        placeholder="Enter your account ID"
        style={{ marginTop: spacing[4] }}
      />
      <TouchableOpacity onPress={() => setShowBeneficiaries(true)} style={styles.savedLink}>
        <Ionicons name="star-outline" size={14} color={theme.brand.primary} />
        <Text style={[textStyles.bodySm, { color: theme.brand.primary }]}>Select from saved beneficiaries</Text>
      </TouchableOpacity>
      <Input label="Phone Number" value={phone} onChangeText={setPhone}
        keyboardType="phone-pad" maxLength={11} placeholder="08012345678" style={{ marginTop: spacing[3] }} />
      <Input label="Amount (₦)" value={amount} onChangeText={setAmount}
        keyboardType="numeric" placeholder="Minimum ₦100" style={{ marginTop: spacing[3] }} />

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
      <Button label="Continue" onPress={() => { if (validate()) setStep("pin"); }} style={{ marginTop: spacing[6] }} />

      {/* â”€â”€ Accounts modal (saved + recent) â”€â”€ */}
      <Modal
        visible={showBeneficiaries}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBeneficiaries(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg.primary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border.DEFAULT }]}>
              <Text style={[textStyles.h3, { color: theme.text.primary }]}>Betting Accounts</Text>
              <TouchableOpacity onPress={() => setShowBeneficiaries(false)}>
                <Ionicons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: spacing[8] }}>
              {savedBeneficiaries.length > 0 && (
                <>
                  <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] }]}>SAVED</Text>
                  {savedBeneficiaries.map((b) => (
                    <TouchableOpacity key={b.id}
                      onPress={() => { setAccountId(b.details.accountId); const p = providers.find((pr) => (pr.biller_code ?? pr.id) === b.details.providerId); if (p) setProvider(p); setShowBeneficiaries(false); }}
                      style={[styles.beneficiaryRow, { borderBottomColor: theme.border.DEFAULT }]}>
                      <View style={[styles.bIcon, { backgroundColor: theme.bg.secondary }]}>
                        <Ionicons name="trophy-outline" size={22} color={theme.brand.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.label, { color: theme.text.primary }]}>{b.details.alias || b.details.accountId}</Text>
                        <Text style={[textStyles.caption, { color: theme.text.muted }]}>{b.details.accountId} · {b.details.providerName}</Text>
                      </View>
                      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={async () => { setSavingId(b.id); await removeBeneficiary(b.id); setSavingId(null); }}>
                        {savingId === b.id ? <ActivityIndicator size="small" color={theme.brand.primary} /> : <Ionicons name="star" size={20} color={theme.brand.primary} />}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {beneficiaries.filter((c) => !savedBeneficiaries.some((b) => b.details.accountId === c.accountId && b.details.providerId === c.providerId)).length > 0 && (
                <>
                  <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] }]}>RECENTLY USED</Text>
                  {beneficiaries
                    .filter((c) => !savedBeneficiaries.some((b) => b.details.accountId === c.accountId && b.details.providerId === c.providerId))
                    .map((item) => {
                      const key = item.accountId + item.providerId;
                      return (
                        <TouchableOpacity key={key}
                          onPress={() => { setAccountId(item.accountId); const p = providers.find((pr) => (pr.biller_code ?? pr.id) === item.providerId); if (p) setProvider(p); setShowBeneficiaries(false); }}
                          style={[styles.beneficiaryRow, { borderBottomColor: theme.border.DEFAULT }]}>
                          <View style={[styles.bIcon, { backgroundColor: theme.bg.secondary }]}>
                            <Ionicons name="trophy-outline" size={22} color={theme.text.muted} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[textStyles.label, { color: theme.text.primary }]}>{item.accountId}</Text>
                            <Text style={[textStyles.caption, { color: theme.text.muted }]}>{item.providerName}</Text>
                          </View>
                          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => { setShowBeneficiaries(false); setPendingSave({ item, key }); }}>
                            {savingId === key ? <ActivityIndicator size="small" color={theme.brand.primary} /> : <Ionicons name="star-outline" size={20} color={theme.text.muted} />}
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                </>
              )}

              {savedBeneficiaries.length === 0 && beneficiaries.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Ionicons name="trophy-outline" size={40} color={theme.text.muted} />
                  <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3], textAlign: "center" }]}>
                    No saved accounts yet.{"\n"}Fund a betting wallet to save accounts.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SaveBeneficiaryModal
        visible={!!pendingSave}
        defaultAlias={pendingSave?.item.accountId ?? ''}
        onCancel={() => setPendingSave(null)}
        onSave={async (alias) => {
          if (!pendingSave) return;
          setSavingId(pendingSave.key);
          setPendingSave(null);
          await saveBeneficiary({ type: 'betting', label: pendingSave.item.accountId, details: { ...pendingSave.item, alias } });
          setSavingId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:     { flexDirection: "row", alignItems: "center", marginBottom: spacing[2] },
  provBtn:  { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderRadius: radius.xl },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2], marginTop: spacing[3] },
  quickBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  center:   { alignItems: "center", paddingTop: spacing[4] },

  modalBg:   { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: radius["2xl"], borderTopRightRadius: radius["2xl"], maxHeight: "70%", minHeight: 280 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1,
  },
  emptyWrap: { alignItems: "center", paddingTop: spacing[10], paddingBottom: spacing[10] },
  beneficiaryRow: {
    flexDirection: "row", alignItems: "center", gap: spacing[3],
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 0.5,
  },
  bIcon:     { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  savedLink: { flexDirection: "row", alignItems: "center", gap: spacing[1.5], marginTop: spacing[2], marginBottom: spacing[1] },
  saveBeneficiaryCard: {
    flexDirection: "row", alignItems: "center", gap: spacing[3],
    borderWidth: 1, borderRadius: radius.xl, padding: spacing[4],
    marginTop: spacing[4],
  },
});
