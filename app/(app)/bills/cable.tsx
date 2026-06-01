import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, ScrollView, Modal,
} from 'react-native';
import { useRouter }  from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons }   from '@expo/vector-icons';
import { Screen }     from '@/components/layout/Screen';
import { Input }      from '@/components/ui/Input';
import { Button }     from '@/components/ui/Button';
import { PinInput }   from '@/components/ui/PinInput';
import { ErrorCard }  from '@/components/ui/ErrorCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { BalanceBanner }  from '@/components/ui/BalanceBanner';
import { useBiometricPin } from '@/hooks/useBiometricPin';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { billsApi }   from '@/api/bills.api';
import { useToast }   from '@/hooks/useToast';
import { useAppDispatch } from '@/store/hooks';
import { fetchBalance, fetchTransactions } from '@/store/slices/wallet.slice';
import { nanoid }     from 'nanoid/non-secure';
import { recentCache, CableBeneficiary } from '@/services/recentCache';
import { useBeneficiaries } from '@/hooks/useBeneficiaries';
import { SaveBeneficiaryModal } from '@/components/ui/SaveBeneficiaryModal';

type Step = 'provider' | 'plan' | 'details' | 'verify' | 'pin' | 'success';

type CableProvider = {
  id: string;
  name: string;
  shortName: string;
  biller_code: string;
  logo_url: string;
};

type CablePlan = {
  item_code: string;
  name: string;
  amount: string;
  duration?: string;
};

export default function CableScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const dispatch   = useAppDispatch();
  const [step,             setStep]             = useState<Step>('provider');
  const [pinError,         setPinError]         = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);
  const { showBiometrics, onBiometrics } = useBiometricPin(submit);
  const [provider,         setProvider]         = useState<CableProvider | null>(null);
  const [providers,        setProviders]        = useState<CableProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  const [plans,        setPlans]        = useState<CablePlan[]>([]);
  const [plan,         setPlan]         = useState<CablePlan | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  const [smartcard, setSmartcard] = useState('');
  const [phone,     setPhone]     = useState('');
  const [customer,  setCustomer]  = useState<any>(null);

  const [loading,   setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState('');

  // â”€â”€ Beneficiaries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [beneficiaries, setBeneficiaries] = useState<CableBeneficiary[]>([]);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const { beneficiaries: savedBeneficiaries, add: saveBeneficiary, remove: removeBeneficiary } = useBeneficiaries('cable');
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{ item: CableBeneficiary; key: string } | null>(null);

  useEffect(() => {
    recentCache.getCableBeneficiaries().then(setBeneficiaries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (step === 'success') {
          setStep('provider'); setSmartcard(''); setPhone('');
          setCustomer(null); setPlan(null); setError(''); setPinError(false);
        }
      };
    }, [step]),
  );

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (!provider) return;
    setPlansLoading(true);
    setPlan(null);
    billsApi.getCablePlans(provider.biller_code)
      .then((r) => {
        const data = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
        setPlans(data);
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [provider?.id]);

  async function fetchProviders() {
    try {
      setProvidersLoading(true);
      const res = await billsApi.getCableProviders();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setProviders(data);
    } catch {
      toast.error('Failed to load cable providers');
    } finally {
      setProvidersLoading(false);
    }
  }

  async function verify() {
    if (!plan)                { setError('Select a plan'); return; }
    if (smartcard.length < 5) { setError('Enter a valid smartcard number'); return; }
    setVerifying(true);
    setError('');
    try {
      const res = await billsApi.validateCustomer({
        item_code:   plan.item_code,
        biller_code: provider!.biller_code,
        customer_id: smartcard,
      });

      console.log(res)
      const customerData = res?.name ? res : res?.data ?? res;
      setCustomer(customerData);
      setStep('verify');
      toast.success('Smartcard verified');
    } catch (err: any) {
      setCustomer(null);
      setError(err?.message ?? 'Could not verify smartcard');
    } finally {
      setVerifying(false);
    }
  }

  async function submit(pinValue: string) {
    if (!pinValue || pinValue.length < 4) { setPinError(true); pinRef.current?.shake(); return; }
    setPinError(false);
    setLoading(true);
    setError('');
    try {
      await billsApi.buyCableTV({
        provider:          provider!.biller_code,
        smartcard_number:  smartcard,
        plan_id:           plan!.item_code,
        phone,
        pin:               pinValue,
        subscription_type: 'change',
        idempotency_key:   nanoid(),
      });
      dispatch(fetchBalance());
      dispatch(fetchTransactions({ page: 1 }));
      // Save beneficiary
      await recentCache.addCableBeneficiary({
        smartcard,
        customerName: customer?.name ?? customer?.Customer_Name ?? customer?.customer_name ?? smartcard,
        providerId:   provider!.id,
        providerName: provider!.shortName,
        providerLogo: provider!.logo_url,
      });
      const fresh = await recentCache.getCableBeneficiaries();
      setBeneficiaries(fresh);
      setStep('success');
    } catch (err: any) {
      const msg = err?.message ?? 'Payment failed';
      setPinError(true); pinRef.current?.shake(); setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError('');
    if      (step === 'plan')    setStep('provider');
    else if (step === 'details') setStep('plan');
    else if (step === 'verify')  setStep('details');
    else if (step === 'pin')     setStep('verify');
    else router.back();
  }

  const stepTitle: Record<Step, string> = {
    provider: 'Cable TV',
    plan:     'Select Plan',
    details:  'Subscription Details',
    verify:   'Confirm Details',
    pin:      'Enter PIN',
    success:  'Success',
  };

  const planAmount = parseFloat(plan?.amount ?? '0');

  // â”€â”€ Success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'success') return (
    <Screen padded scrollable>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color={theme.status.success} />
        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>
          Subscription Active!
        </Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
          {provider?.shortName} · {plan?.name}{'\n'}activated on {smartcard}
        </Text>
        <Button
          label="Done"
          onPress={() => router.back()}
          style={{ marginTop: spacing[8], width: '100%' }}
        />
      </View>

      {!savedBeneficiaries.some((b) => b.details.smartcard === smartcard && b.details.providerId === provider?.id) && (
        <TouchableOpacity
          onPress={() => setPendingSave({
            item: {
              smartcard,
              customerName: customer?.name ?? customer?.Customer_Name ?? customer?.customer_name ?? smartcard,
              providerId:   provider!.id,
              providerName: provider!.shortName,
              providerLogo: provider!.logo_url,
            },
            key: smartcard + provider?.id,
          })}
          style={[styles.saveBeneficiaryCard, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
          activeOpacity={0.75}
        >
          <Ionicons name="star-outline" size={20} color={theme.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>Save to beneficiaries</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>Quickly access this smartcard next time</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
        </TouchableOpacity>
      )}

      <SaveBeneficiaryModal
        visible={!!pendingSave}
        defaultAlias={pendingSave?.item.customerName ?? pendingSave?.item.smartcard ?? ''}
        onCancel={() => setPendingSave(null)}
        onSave={async (alias) => {
          if (!pendingSave) return;
          await saveBeneficiary({ type: 'cable', label: pendingSave.item.smartcard, details: { ...pendingSave.item, alias } });
          setPendingSave(null);
        }}
      />
    </Screen>
  );

  // â”€â”€ PIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'pin') return (
    <Screen padded>
      <LoadingOverlay visible={loading} message="Processing..." />
      <TouchableOpacity onPress={goBack} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        <Text style={[textStyles.label, { color: theme.text.primary, marginLeft: spacing[2] }]}>
          Back
        </Text>
      </TouchableOpacity>
      <View style={styles.center}>
        <Ionicons name="tv-outline" size={48} color={theme.brand.primary} />
        <Text style={[textStyles.h1, { color: theme.text.primary, marginTop: spacing[3] }]}>
          ₦{planAmount.toLocaleString()}
        </Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[1] }]}>
          {provider?.shortName} · {plan?.name}{'\n'}{smartcard}
        </Text>
        <View style={{ marginTop: spacing[8], width: '100%' }}>
          <PinInput onComplete={submit} error={pinError} onRef={(api) => { pinRef.current = api; }} showBiometrics={showBiometrics} onBiometrics={onBiometrics} />
        </View>
        {error ? <ErrorCard message={error} style={{ marginTop: spacing[4] }} /> : null}
      </View>
    </Screen>
  );

  // â”€â”€ Provider / Details / Verify â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <Screen padded scrollable>
      <TouchableOpacity onPress={goBack} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        <Text style={[textStyles.label, { color: theme.text.primary, marginLeft: spacing[2] }]}>
          {stepTitle[step]}
        </Text>
      </TouchableOpacity>

      <BalanceBanner />

      {/* â”€â”€ Step 1: Select provider â”€â”€ */}
      {step === 'provider' && (
        <>
          <Text style={[textStyles.labelSm, { color: theme.text.muted, marginTop: spacing[4], marginBottom: spacing[3] }]}>
            SELECT PROVIDER
          </Text>

          {providersLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.brand.primary} />
            </View>
          ) : (
            <View style={styles.providersGrid}>
              {providers.map((p) => {
                const active = provider?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setProvider(p)}
                    activeOpacity={0.85}
                    style={[
                      styles.providerCard,
                      {
                        backgroundColor: active ? theme.brand.primary : theme.bg.secondary,
                        borderColor:     active ? theme.brand.primary : theme.border.DEFAULT,
                      },
                    ]}
                  >
                    <Image source={{ uri: p.logo_url }} style={styles.providerLogo} resizeMode="contain" />
                    <Text
                      numberOfLines={1}
                      style={[textStyles.labelSm, { marginTop: spacing[2], color: active ? '#fff' : theme.text.primary }]}
                    >
                      {p.shortName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Button
            label="Continue"
            disabled={!provider}
            onPress={() => setStep('plan')}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* â”€â”€ Step 2: Select plan â”€â”€ */}
      {step === 'plan' && (
        <>
          {provider && (
            <TouchableOpacity
              onPress={() => setStep('provider')}
              style={[styles.providerChip, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
              activeOpacity={0.8}
            >
              <Image source={{ uri: provider.logo_url }} style={styles.chipLogo} resizeMode="contain" />
              <Text style={[textStyles.label, { color: theme.text.primary, flex: 1 }]}>{provider.name}</Text>
              <Text style={[textStyles.caption, { color: theme.brand.primary }]}>Change</Text>
            </TouchableOpacity>
          )}

          {plansLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.brand.primary} />
            </View>
          ) : (
            <View style={styles.plansGrid}>
              {plans.map((p) => {
                const active = plan?.item_code === p.item_code;
                return (
                  <TouchableOpacity
                    key={p.item_code}
                    onPress={() => setPlan(p)}
                    activeOpacity={0.85}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: active ? theme.brand.primary : theme.bg.secondary,
                        borderColor:     active ? theme.brand.primary : theme.border.DEFAULT,
                      },
                    ]}
                  >
                    <Text numberOfLines={2} style={[textStyles.label, { color: active ? '#000' : theme.text.primary }]}>
                      {p.name}
                    </Text>
                    <Text style={[textStyles.bodySm, {
                      color: active ? 'rgba(21, 13, 13, 0.9)' : theme.brand.primary,
                      fontWeight: '700', marginTop: spacing[1],
                    }]}>
                      ₦{parseFloat(p.amount).toLocaleString()}
                    </Text>
                    {p.duration ? (
                      <Text style={[textStyles.caption, { color: active ? 'rgba(255,255,255,0.7)' : theme.text.muted }]}>
                        {p.duration}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Button
            label="Continue"
            disabled={!plan}
            onPress={() => setStep('details')}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* â”€â”€ Step 3: Smartcard + phone â”€â”€ */}
      {step === 'details' && (
        <>
          {provider && plan && (
            <TouchableOpacity
              onPress={() => setStep('plan')}
              style={[styles.providerChip, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
              activeOpacity={0.8}
            >
              <Image source={{ uri: provider.logo_url }} style={styles.chipLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.label, { color: theme.text.primary }]}>{plan.name}</Text>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>{provider.shortName} · ₦{parseFloat(plan.amount).toLocaleString()}</Text>
              </View>
              <Text style={[textStyles.caption, { color: theme.brand.primary }]}>Change</Text>
            </TouchableOpacity>
          )}

          <Input
            label="Smartcard / IUC Number"
            value={smartcard}
            onChangeText={(t) => { setSmartcard(t); setCustomer(null); }}
            keyboardType="numeric"
            placeholder="Enter smartcard number"
            containerStyle={{ marginTop: spacing[4] }}
          />
          <TouchableOpacity onPress={() => setShowBeneficiaries(true)} style={styles.savedLink}>
            <Ionicons name="star-outline" size={14} color={theme.brand.primary} />
            <Text style={[textStyles.bodySm, { color: theme.brand.primary }]}>Select from saved beneficiaries</Text>
          </TouchableOpacity>
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={11}
            placeholder="08012345678"
            containerStyle={{ marginTop: spacing[3] }}
          />

          {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
          <Button
            label={verifying ? 'Verifying...' : 'Verify Smartcard'}
            onPress={verify}
            loading={verifying}
            disabled={smartcard.length < 5}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* â”€â”€ Step 3: Customer + plan summary â”€â”€ */}
      {step === 'verify' && (
        <>
          <View style={[styles.customerCard, { backgroundColor: theme.bg.secondary, borderColor: theme.status.success }]}>
            <Ionicons name="checkmark-circle" size={22} color={theme.status.success} />
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                {customer?.name ?? customer?.Customer_Name ?? customer?.customer_name ?? 'Smartcard Verified'}
              </Text>
              <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: 2 }]}>
                {smartcard}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
            <Image source={{ uri: provider!.logo_url }} style={styles.summaryLogo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>{plan?.name}</Text>
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>{provider?.shortName}</Text>
            </View>
            <Text style={[textStyles.label, { color: theme.brand.primary }]}>
              ₦{planAmount.toLocaleString()}
            </Text>
          </View>

          {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
          <Button
            label="Continue to Pay"
            onPress={() => { setError(''); setStep('pin'); }}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* â”€â”€ Beneficiaries modal (saved + recent) â”€â”€ */}
      <Modal
        visible={showBeneficiaries}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBeneficiaries(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg.primary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border.DEFAULT }]}>
              <Text style={[textStyles.h3, { color: theme.text.primary }]}>Smartcards</Text>
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
                      onPress={() => { setSmartcard(b.details.smartcard); const p = providers.find((pr) => pr.id === b.details.providerId); if (p) setProvider(p); setShowBeneficiaries(false); }}
                      style={[styles.beneficiaryRow, { borderBottomColor: theme.border.DEFAULT }]}>
                      <Image source={{ uri: b.details.providerLogo }} style={styles.bLogo} resizeMode="contain" />
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.label, { color: theme.text.primary }]}>{b.details.alias || b.details.customerName}</Text>
                        <Text style={[textStyles.caption, { color: theme.text.muted }]}>{b.details.smartcard} · {b.details.providerName}</Text>
                      </View>
                      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={async () => { setSavingId(b.id); await removeBeneficiary(b.id); setSavingId(null); }}>
                        {savingId === b.id ? <ActivityIndicator size="small" color={theme.brand.primary} /> : <Ionicons name="star" size={20} color={theme.brand.primary} />}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {beneficiaries.filter((c) => !savedBeneficiaries.some((b) => b.details.smartcard === c.smartcard && b.details.providerId === c.providerId)).length > 0 && (
                <>
                  <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] }]}>RECENTLY USED</Text>
                  {beneficiaries
                    .filter((c) => !savedBeneficiaries.some((b) => b.details.smartcard === c.smartcard && b.details.providerId === c.providerId))
                    .map((item) => {
                      const key = item.smartcard + item.providerId;
                      return (
                        <TouchableOpacity key={key}
                          onPress={() => { setSmartcard(item.smartcard); const p = providers.find((pr) => pr.id === item.providerId); if (p) setProvider(p); setShowBeneficiaries(false); }}
                          style={[styles.beneficiaryRow, { borderBottomColor: theme.border.DEFAULT }]}>
                          <Image source={{ uri: item.providerLogo }} style={styles.bLogo} resizeMode="contain" />
                          <View style={{ flex: 1 }}>
                            <Text style={[textStyles.label, { color: theme.text.primary }]}>{item.customerName}</Text>
                            <Text style={[textStyles.caption, { color: theme.text.muted }]}>{item.providerName} · {item.smartcard}</Text>
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
                  <Ionicons name="tv-outline" size={40} color={theme.text.muted} />
                  <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3], textAlign: 'center' }]}>
                    No saved smartcards yet.{'\n'}Pay cable TV to save smartcards.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SaveBeneficiaryModal
        visible={!!pendingSave}
        defaultAlias={pendingSave?.item.customerName ?? ''}
        onCancel={() => setPendingSave(null)}
        onSave={async (alias) => {
          if (!pendingSave) return;
          setSavingId(pendingSave.key);
          setPendingSave(null);
          await saveBeneficiary({ type: 'cable', label: pendingSave.item.smartcard, details: { ...pendingSave.item, alias } });
          setSavingId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:        { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] },
  loadingWrap: { paddingVertical: spacing[10], alignItems: 'center' },
  center:      { alignItems: 'center', paddingTop: spacing[4] },

  providersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  providerCard: {
    width: '30%', minHeight: 96, borderRadius: radius.xl, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', padding: spacing[3],
  },
  providerLogo: { width: 44, height: 44 },

  providerChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[3], borderRadius: radius.xl, borderWidth: 1,
    marginTop: spacing[4],
  },
  chipLogo: { width: 36, height: 36 },

  plansGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginTop: spacing[4] },
  planCard: {
    width: '47%', borderRadius: radius.xl, borderWidth: 1,
    padding: spacing[4], gap: spacing[0.5],
  },

  customerCard: {
    flexDirection: 'row', gap: spacing[3], borderRadius: radius.xl,
    padding: spacing[4], marginTop: spacing[4], borderWidth: 1.5,
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row', gap: spacing[3], borderRadius: radius.xl,
    padding: spacing[4], marginTop: spacing[3], borderWidth: 1,
    alignItems: 'center',
  },
  summaryLogo: { width: 40, height: 40 },

  modalBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], maxHeight: '70%', minHeight: 300 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1,
  },
  emptyWrap: { alignItems: 'center', paddingTop: spacing[10], paddingBottom: spacing[10] },
  beneficiaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 0.5,
  },
  bLogo:     { width: 40, height: 40 },
  savedLink: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginTop: spacing[1.5], marginBottom: 0 },
  saveBeneficiaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderWidth: 1, borderRadius: radius.xl, padding: spacing[4],
    marginTop: spacing[4],
  },
});
