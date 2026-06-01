import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Modal, FlatList, ScrollView,
} from 'react-native';
import { useRouter }   from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons }    from '@expo/vector-icons';
import * as Clipboard  from 'expo-clipboard';
import { Screen }      from '@/components/layout/Screen';
import { Input }       from '@/components/ui/Input';
import { Button }      from '@/components/ui/Button';
import { PinInput }    from '@/components/ui/PinInput';
import { ErrorCard }   from '@/components/ui/ErrorCard';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { BalanceBanner }  from '@/components/ui/BalanceBanner';
import { useBiometricPin } from '@/hooks/useBiometricPin';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { billsApi }    from '@/api/bills.api';
import { useToast }    from '@/hooks/useToast';
import { useAppDispatch } from '@/store/hooks';
import { fetchBalance, fetchTransactions } from '@/store/slices/wallet.slice';
import { nanoid }      from 'nanoid/non-secure';
import { recentCache, ElectricityBeneficiary } from '@/services/recentCache';
import { useBeneficiaries } from '@/hooks/useBeneficiaries';
import { SaveBeneficiaryModal } from '@/components/ui/SaveBeneficiaryModal';

const QUICK = [1000, 2000, 5000, 10000, 20000];

type Step = 'provider' | 'meter' | 'verify' | 'pin' | 'success';

type ElectricityProvider = {
  id: string;
  name: string;
  shortName: string;
  billerCode: string;
  logo_url: string;
};

export default function ElectricityScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const dispatch   = useAppDispatch();
  const [step,        setStep]        = useState<Step>('provider');
  const [pinError,    setPinError]    = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);
  const { showBiometrics, onBiometrics } = useBiometricPin(submit);
  const [provider,    setProvider]    = useState<ElectricityProvider | null>(null);
  const [providers,   setProviders]   = useState<ElectricityProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  const [meterNumber, setMeterNumber] = useState('');
  const [meterType,   setMeterType]   = useState<'prepaid' | 'postpaid'>('prepaid');
  const [phone,       setPhone]       = useState('');
  const [amount,      setAmount]      = useState('');
  const [customer,    setCustomer]    = useState<any>(null);
  const [token,       setToken]       = useState<string | null>(null);
  const [copied,      setCopied]      = useState(false);

  const [loading,   setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState('');

  // â”€â”€ Beneficiaries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [beneficiaries, setBeneficiaries] = useState<ElectricityBeneficiary[]>([]);
  const [showBeneficiaries, setShowBeneficiaries] = useState(false);
  const { beneficiaries: savedBeneficiaries, add: saveBeneficiary, remove: removeBeneficiary } = useBeneficiaries('electricity');
  const [savingId, setSavingId]       = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState<{ item: ElectricityBeneficiary; key: string } | null>(null);

  useEffect(() => {
    recentCache.getElectricityBeneficiaries().then(setBeneficiaries);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (step === 'success') {
          setStep('provider'); setMeterNumber(''); setPhone('');
          setAmount(''); setCustomer(null); setToken(null);
          setError(''); setPinError(false);
        }
      };
    }, [step]),
  );

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setProvidersLoading(true);
      const res = await billsApi.getElectricityProviders();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setProviders(data);
    } catch {
      toast.error('Failed to load electricity providers');
    } finally {
      setProvidersLoading(false);
    }
  }

  async function verify() {
    if (!provider) return;
    if (meterNumber.length < 8) { setError('Enter a valid meter number'); return; }
    setVerifying(true);
    setError('');
    try {
      const res = await billsApi.verifyMeter({ provider: provider.id, meter_number: meterNumber });
      const customerData = res?.customer_name ? res : res?.data ?? res;
      setCustomer(customerData);
      setStep('verify');
      toast.success('Meter verified');
    } catch (err: any) {
      setCustomer(null);
      setError(err?.message ?? 'Could not verify meter number');
    } finally {
      setVerifying(false);
    }
  }

  async function submit(pinValue: string) {
    if (!provider) { toast.error('Select a provider'); return; }
    if (!pinValue || pinValue.length < 4) { setPinError(true); pinRef.current?.shake(); return; }
    setPinError(false);
    setLoading(true);
    setError('');
    try {
      const res = await billsApi.buyElectricity({
        provider: provider.id, meter_number: meterNumber,
        meter_type: meterType, amount: parseInt(amount),
        phone, pin: pinValue, idempotency_key: nanoid(),
      });
      dispatch(fetchBalance());
      dispatch(fetchTransactions({ page: 1 }));
      // Save beneficiary
      await recentCache.addElectricityBeneficiary({
        meterNumber,
        meterType,
        customerName: customer?.customer_name ?? customer?.name ?? meterNumber,
        providerId:   provider.id,
        providerName: provider.shortName,
        providerLogo: provider.logo_url,
      });
      const fresh = await recentCache.getElectricityBeneficiaries();
      setBeneficiaries(fresh);
      setToken(res?.data?.token ?? res?.token ?? null);
      setStep('success');
    } catch (err: any) {
      const msg = err?.message ?? 'Payment failed';
      setPinError(true); pinRef.current?.shake(); setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    if (!token) return;
    await Clipboard.setStringAsync(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function goBack() {
    setError('');
    if      (step === 'meter')   setStep('provider');
    else if (step === 'verify')  setStep('meter');
    else if (step === 'pin')     setStep('verify');
    else router.back();
  }

  const stepTitle: Record<Step, string> = {
    provider: 'Electricity',
    meter:    'Meter Details',
    verify:   'Confirm Details',
    pin:      'Enter PIN',
    success:  'Success',
  };

  // â”€â”€ Success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'success') return (
    <Screen padded scrollable>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color={theme.status.success} />
        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>
          Payment Successful!
        </Text>
        {token ? (
          <View style={[styles.tokenCard, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
            <Text style={[textStyles.labelSm, { color: theme.brand.primary, letterSpacing: 1.5 }]}>
              âš¡ ELECTRICITY TOKEN
            </Text>
            <Text style={[styles.tokenText, { color: theme.text.primary }]}>{token}</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>
              Enter this token on your meter
            </Text>
            <Button
              label={copied ? 'Copied!' : 'Copy Token'}
              variant={copied ? 'secondary' : 'primary'}
              onPress={copyToken}
              style={{ marginTop: spacing[3] }}
            />
          </View>
        ) : (
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[3] }]}>
            Your token will arrive via push notification shortly.
          </Text>
        )}
        <Button
          label="Done"
          onPress={() => router.back()}
          style={{ marginTop: spacing[6], width: '100%' }}
        />
      </View>

      {!savedBeneficiaries.some((b) => b.details.meterNumber === meterNumber && b.details.providerId === provider?.id) && (
        <TouchableOpacity
          onPress={() => setPendingSave({
            item: {
              meterNumber,
              meterType,
              customerName: customer?.customer_name ?? customer?.name ?? meterNumber,
              providerId:   provider!.id,
              providerName: provider!.shortName,
              providerLogo: provider!.logo_url,
            },
            key: meterNumber + provider?.id,
          })}
          style={[styles.saveBeneficiaryCard, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
          activeOpacity={0.75}
        >
          <Ionicons name="star-outline" size={20} color={theme.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>Save to beneficiaries</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>Quickly access this meter next time</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
        </TouchableOpacity>
      )}

      <SaveBeneficiaryModal
        visible={!!pendingSave}
        defaultAlias={pendingSave?.item.customerName ?? pendingSave?.item.meterNumber ?? ''}
        onCancel={() => setPendingSave(null)}
        onSave={async (alias) => {
          if (!pendingSave) return;
          await saveBeneficiary({ type: 'electricity', label: pendingSave.item.meterNumber, details: { ...pendingSave.item, alias } });
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
        <Ionicons name="flash" size={48} color={theme.status.warning} />
        <Text style={[textStyles.h1, { color: theme.text.primary, marginTop: spacing[3] }]}>
          ₦{parseInt(amount).toLocaleString()}
        </Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[1] }]}>
          {provider?.shortName} · {meterType}{'\n'}{meterNumber}
        </Text>
        <View style={{ marginTop: spacing[8], width: '100%' }}>
          <PinInput onComplete={submit} error={pinError} onRef={(api) => { pinRef.current = api; }} showBiometrics={showBiometrics} onBiometrics={onBiometrics} />
        </View>
        {error ? <ErrorCard message={error} style={{ marginTop: spacing[4] }} /> : null}
      </View>
    </Screen>
  );

  // â”€â”€ Provider / Meter / Verify â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            onPress={() => setStep('meter')}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* â”€â”€ Step 2: Meter details â”€â”€ */}
      {step === 'meter' && (
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

          <Text style={[textStyles.labelSm, { color: theme.text.muted, marginTop: spacing[5], marginBottom: spacing[2] }]}>
            METER TYPE
          </Text>
          <View style={styles.meterTypeRow}>
            {(['prepaid', 'postpaid'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setMeterType(t)}
                style={[
                  styles.typeBtn,
                  { flex: 1, backgroundColor: meterType === t ? theme.brand.primary : theme.bg.secondary },
                ]}
              >
                <Text style={[textStyles.label, { color: meterType === t ? '#000' : theme.text.secondary }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Meter Number"
            value={meterNumber}
            onChangeText={(t) => { setMeterNumber(t); setCustomer(null); }}
            keyboardType="numeric"
            placeholder="Enter meter number"
            style={{ marginTop: spacing[4] }}
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
            style={{ marginTop: spacing[3] }}
          />

          {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
          <Button
            label={verifying ? 'Verifying...' : 'Verify Meter'}
            onPress={verify}
            loading={verifying}
            disabled={meterNumber.length < 8}
            style={{ marginTop: spacing[6] }}
          />
        </>
      )}

      {/* â”€â”€ Step 3: Customer details + amount â”€â”€ */}
      {step === 'verify' && (
        <>
          <View style={[styles.customerCard, { backgroundColor: theme.bg.secondary, borderColor: theme.status.success }]}>
            <Ionicons name="checkmark-circle" size={22} color={theme.status.success} />
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                {customer?.customer_name ?? 'Meter Verified'}
              </Text>
              {customer?.address ? (
                <Text style={[textStyles.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                  {customer.address}
                </Text>
              ) : null}
              <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: 2 }]}>
                {provider?.shortName} · {meterType} · {meterNumber}
              </Text>
            </View>
          </View>

          <Input
            label="Amount (₦)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Minimum ₦500"
            style={{ marginTop: spacing[4] }}
          />

          <View style={styles.quickRow}>
            {QUICK.map((a) => (
              <TouchableOpacity
                key={a}
                onPress={() => setAmount(String(a))}
                style={[
                  styles.quickBtn,
                  { backgroundColor: amount === String(a) ? theme.brand.primary : theme.bg.secondary,
                    borderColor: amount === String(a) ? theme.brand.primary : theme.border.DEFAULT },
                ]}
              >
                <Text style={[textStyles.caption, { color: amount === String(a) ? '#000' : theme.text.secondary }]}>
                  ₦{a.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <ErrorCard message={error} style={{ marginTop: spacing[3] }} /> : null}
          <Button
            label="Continue to Pay"
            disabled={!amount || parseInt(amount) < 500}
            onPress={() => {
              if (!amount || parseInt(amount) < 500) { setError('Minimum is ₦500'); return; }
              setError('');
              setStep('pin');
            }}
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
              <Text style={[textStyles.h3, { color: theme.text.primary }]}>Meters</Text>
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
                      onPress={() => { setMeterNumber(b.details.meterNumber); setMeterType(b.details.meterType); const p = providers.find((pr) => pr.id === b.details.providerId); if (p) setProvider(p); setShowBeneficiaries(false); }}
                      style={[styles.beneficiaryRow, { borderBottomColor: theme.border.DEFAULT }]}>
                      <Image source={{ uri: b.details.providerLogo }} style={styles.bLogo} resizeMode="contain" />
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.label, { color: theme.text.primary }]}>{b.details.alias || b.details.customerName}</Text>
                        <Text style={[textStyles.caption, { color: theme.text.muted }]}>{b.details.meterNumber} · {b.details.providerName} · {b.details.meterType}</Text>
                      </View>
                      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={async () => { setSavingId(b.id); await removeBeneficiary(b.id); setSavingId(null); }}>
                        {savingId === b.id ? <ActivityIndicator size="small" color={theme.brand.primary} /> : <Ionicons name="star" size={20} color={theme.brand.primary} />}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {beneficiaries.filter((c) => !savedBeneficiaries.some((b) => b.details.meterNumber === c.meterNumber && b.details.providerId === c.providerId)).length > 0 && (
                <>
                  <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2] }]}>RECENTLY USED</Text>
                  {beneficiaries
                    .filter((c) => !savedBeneficiaries.some((b) => b.details.meterNumber === c.meterNumber && b.details.providerId === c.providerId))
                    .map((item) => {
                      const key = item.meterNumber + item.providerId;
                      return (
                        <TouchableOpacity key={key}
                          onPress={() => { setMeterNumber(item.meterNumber); setMeterType(item.meterType); const p = providers.find((pr) => pr.id === item.providerId); if (p) setProvider(p); setShowBeneficiaries(false); }}
                          style={[styles.beneficiaryRow, { borderBottomColor: theme.border.DEFAULT }]}>
                          <Image source={{ uri: item.providerLogo }} style={styles.bLogo} resizeMode="contain" />
                          <View style={{ flex: 1 }}>
                            <Text style={[textStyles.label, { color: theme.text.primary }]}>{item.customerName}</Text>
                            <Text style={[textStyles.caption, { color: theme.text.muted }]}>{item.providerName} · {item.meterType} · {item.meterNumber}</Text>
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
                  <Ionicons name="flash-outline" size={40} color={theme.text.muted} />
                  <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3], textAlign: 'center' }]}>
                    No saved meters yet.{'\n'}Pay electricity to save meters.
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
          await saveBeneficiary({ type: 'electricity', label: pendingSave.item.meterNumber, details: { ...pendingSave.item, alias } });
          setSavingId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:          { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] },
  loadingWrap:   { paddingVertical: spacing[10], alignItems: 'center' },
  center:        { alignItems: 'center', paddingTop: spacing[4] },

  providersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  providerCard:  {
    width: '30%', minHeight: 96, borderRadius: radius.xl, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', padding: spacing[3],
  },
  providerLogo:  { width: 44, height: 44 },

  providerChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[3], borderRadius: radius.xl, borderWidth: 1,
    marginTop: spacing[4],
  },
  chipLogo: { width: 36, height: 36 },

  meterTypeRow: { flexDirection: 'row', gap: spacing[2] },
  typeBtn:      { padding: spacing[3], borderRadius: radius.xl, alignItems: 'center' },

  customerCard: {
    flexDirection: 'row', gap: spacing[3], borderRadius: radius.xl,
    padding: spacing[4], marginTop: spacing[4], borderWidth: 1.5,
  },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3] },
  quickBtn: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    borderRadius: radius.full, borderWidth: 1,
  },

  tokenCard: {
    borderWidth: 1.5, borderRadius: radius.xl, padding: spacing[5],
    alignItems: 'center', gap: spacing[2], marginTop: spacing[4], width: '100%',
  },
  tokenText: { fontSize: 22, fontWeight: '700', letterSpacing: 3, fontFamily: 'monospace', textAlign: 'center' },

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
  savedLink: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], marginTop: spacing[2], marginBottom: spacing[1] },
  saveBeneficiaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderWidth: 1, borderRadius: radius.xl, padding: spacing[4],
    marginTop: spacing[4],
  },
});
