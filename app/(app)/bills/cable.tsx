import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, ScrollView,
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

type Step = 'provider' | 'details' | 'verify' | 'pin' | 'success';

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
      const customerData = res?.name ? res : res?.data ?? res;
      setCustomer(customerData);
      setStep('verify');
      toast.success('Smartcard verified');
    } catch (err: any) {
      setCustomer(null);
      setError(err?.response?.data?.message ?? 'Could not verify smartcard');
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
      setStep('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Payment failed';
      setPinError(true); pinRef.current?.shake(); setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError('');
    if      (step === 'details') setStep('provider');
    else if (step === 'verify')  setStep('details');
    else if (step === 'pin')     setStep('verify');
    else router.back();
  }

  const stepTitle: Record<Step, string> = {
    provider: 'Cable TV',
    details:  'Subscription Details',
    verify:   'Confirm Details',
    pin:      'Enter PIN',
    success:  'Success',
  };

  const planAmount = parseFloat(plan?.amount ?? '0');

  // ── Success ──────────────────────────────────────────────────────────
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
    </Screen>
  );

  // ── PIN ──────────────────────────────────────────────────────────────
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

  // ── Provider / Details / Verify ───────────────────────────────────────
  return (
    <Screen padded scrollable>
      <TouchableOpacity onPress={goBack} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        <Text style={[textStyles.label, { color: theme.text.primary, marginLeft: spacing[2] }]}>
          {stepTitle[step]}
        </Text>
      </TouchableOpacity>

      <BalanceBanner />

      {/* ── Step 1: Select provider ── */}
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
                    <Image
                      source={{ uri: p.logo_url }}
                      style={styles.providerLogo}
                      resizeMode="contain"
                    />
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
            onPress={() => setStep('details')}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* ── Step 2: Plan + smartcard + phone ── */}
      {step === 'details' && (
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

          <Text style={[textStyles.labelSm, { color: theme.text.muted, marginTop: spacing[5], marginBottom: spacing[3] }]}>
            SELECT PLAN
          </Text>

          {plansLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.brand.primary} />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
             style={{ marginBottom: spacing[2], height: 150 }}
            contentContainerStyle={{ height: 150, gap: spacing[3] }}
            >
              <View style={{ flexDirection: 'row', gap: spacing[3], paddingBottom: spacing[1] }}>
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
                      <Text numberOfLines={2} style={[textStyles.label, { color: active ? '#fff' : theme.text.primary }]}>
                        {p.name}
                      </Text>
                      <Text style={[textStyles.bodySm, {
                        color: active ? 'rgba(255,255,255,0.9)' : theme.brand.primary,
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
            </ScrollView>
          )}

          <Input
            label="Smartcard / IUC Number"
            value={smartcard}
            onChangeText={(t) => { setSmartcard(t); setCustomer(null); }}
            keyboardType="numeric"
            placeholder="Enter smartcard number"
            style={{ marginTop: spacing[3] }}
          />
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={11}
            placeholder="08012345678"
            style={{ marginTop: spacing[3] }}
          />

          {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
          <Button
            label={verifying ? 'Verifying…' : 'Verify Smartcard'}
            onPress={verify}
            loading={verifying}
            disabled={!plan || smartcard.length < 5}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* ── Step 3: Customer + plan summary ── */}
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

planCard: {
    width: 140, borderRadius: radius.xl, borderWidth: 1,
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
});
