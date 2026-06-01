// app/(app)/crypto/send.tsx — personalized, 3-step flow
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Image,
} from 'react-native';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { Ionicons }        from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { cryptoApi }       from '@/api/crypto.api';
import { useToast }        from '@/hooks/useToast';
import { PinInput }        from '@/components/ui/PinInput';
import { LoadingOverlay }  from '@/components/ui/LoadingOverlay';
import { SUPPORTED_COINS } from '@/screens/app/crypto.logic';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCryptoWallets } from '@/store/slices/crypto.slice';
import { sanitizeCryptoInput, truncateCryptoAmount } from '@/utils/crypto';

const COIN_NETWORK: Record<string, string> = {
  BTC: 'btc', ETH: 'eth', USDT: 'trx', SOL: 'sol', LTC: 'ltc', XRP: 'xrp',
};

const MIN_SEND: Record<string, number> = {
  BTC: 0.000005, ETH: 0.0001, USDT: 0.5, SOL: 0.005, LTC: 0.005, XRP: 1,
};

function detectCoinFromAddress(address: string): string | null {
  const a = address.trim();
  if (a.length < 10) return null;
  if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,}/.test(a))  return 'BTC';
  if (/^0x[0-9a-fA-F]{40}$/.test(a))                  return 'ETH';
  if (/^T[a-zA-Z0-9]{33}$/.test(a))                   return 'USDT';
  if (/^r[a-zA-Z0-9]{24,33}$/.test(a))                return 'XRP';
  if (/^(L|M|ltc1)[a-zA-Z0-9]{25,}/.test(a))          return 'LTC';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a))        return 'SOL';
  return null;
}

// Step indicator
function StepBar({ current }: { current: number }) {
  const { theme } = useTheme();
  const steps = ['Address', 'Amount', 'Review'];
  return (
    <View style={stepStyles.row}>
      {steps.map((label, i) => {
        const idx   = i + 1;
        const done  = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={label}>
            <View style={stepStyles.step}>
              <View style={[
                stepStyles.dot,
                { backgroundColor: done || active ? theme.brand.primary : theme.bg.secondary,
                  borderColor: done || active ? theme.brand.primary : theme.border.DEFAULT },
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={12} color="#000" />
                  : <Text style={[stepStyles.num, { color: active ? '#000' : theme.text.muted }]}>{idx}</Text>
                }
              </View>
              <Text style={[textStyles.caption, {
                color: active ? theme.text.primary : theme.text.muted,
                fontWeight: active ? '600' : '400',
              }]}>{label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[stepStyles.line, { backgroundColor: idx < current ? theme.brand.primary : theme.border.DEFAULT }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  step: { alignItems: 'center', gap: spacing[1] },
  dot:  { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  num:  { fontSize: 12, fontWeight: '600' },
  line: { flex: 1, height: 1.5, marginBottom: spacing[4], marginHorizontal: spacing[1] },
});

type FlowStep = 1 | 2 | 3 | 'pin' | 'success';

export default function CryptoSendScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const toast     = useToast();
  const dispatch  = useAppDispatch();
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol?: string }>();

  const coin = SUPPORTED_COINS.find((c) => c.symbol === rawSymbol) ?? SUPPORTED_COINS[0];

  const wallets  = useAppSelector((s) => s.crypto.wallets);
  const balance  = wallets.find((w) => w.symbol === coin.symbol)?.balance ?? '0';

  const [step,            setStep]            = useState<FlowStep>(1);
  const [toAddress,       setToAddress]       = useState('');
  const [detectedSymbol,  setDetectedSymbol]  = useState<string | null>(null);
  const [amount,          setAmount]          = useState('');
  const [destinationTag,  setDestinationTag]  = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [pinError,        setPinError]        = useState(false);
  const [txRef,           setTxRef]           = useState('');
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  useEffect(() => { dispatch(fetchCryptoWallets()); }, []);

  function handleAddressChange(val: string) {
    setToAddress(val);
    setDetectedSymbol(detectCoinFromAddress(val));
  }

  const addressValid = toAddress.trim().length >= 10;
  const xrpTagMissing = coin.symbol === 'XRP' && !destinationTag.trim();

  function validateAddress(): boolean {
    if (!addressValid) { toast.error('Enter a valid destination address'); return false; }
    if (xrpTagMissing) { toast.error('XRP requires a destination tag'); return false; }
    return true;
  }

  function validateAmount(): boolean {
    const amt = parseFloat(amount);
    const min = MIN_SEND[coin.symbol] ?? 0;
    if (!amt || amt <= 0)          { toast.error('Enter a valid amount'); return false; }
    if (amt < min)                 { toast.error(`Minimum send is ${min} ${coin.symbol}`); return false; }
    if (amt > parseFloat(balance)) { toast.error('Insufficient balance'); return false; }
    return true;
  }

  async function send(pin: string) {
    setPinError(false); setLoading(true);
    try {
      const res = await cryptoApi.withdraw({
        symbol:          coin.symbol,
        amount:          truncateCryptoAmount(amount),
        toAddress:       toAddress.trim(),
        pin,
        destinationTag:  destinationTag.trim() || undefined,
        network:         COIN_NETWORK[coin.symbol],
        beneficiaryName: beneficiaryName.trim() || undefined,
      });
      setTxRef(res?.reference ?? '');
      setStep('success');
    } catch (err: any) {
      setPinError(true); pinRef.current?.shake();
      toast.error(err?.message ?? 'Send failed. Check your PIN and try again.');
    } finally { setLoading(false); }
  }

  function goBack() {
    if (step === 2)       { setStep(1); return; }
    if (step === 3)       { setStep(2); return; }
    if (step === 'pin')   { setStep(3); return; }
    router.back();
  }

  const stepNumber = step === 'pin' ? 3 : step === 'success' ? 3 : step as number;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      {/* Personalized header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <View style={styles.coinHeader}>
            <Image source={{ uri: coin.logoUrl }} style={styles.coinHeaderLogo} resizeMode="contain" />
            <Text style={[textStyles.h3, { color: theme.text.primary }]}>Send {coin.name}</Text>
          </View>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>
            {parseFloat(balance) > 0
              ? `${parseFloat(balance).toFixed(8).replace(/\.?0+$/, '')} ${coin.symbol} available`
              : `No ${coin.symbol} balance`}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      {step !== 'success' && <StepBar current={Math.min(stepNumber, 3)} />}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: ADDRESS ── */}
        {step === 1 && (
          <>
            <Text style={[textStyles.h3, { color: theme.text.primary }]}>Where are you sending?</Text>
            <Text style={[textStyles.body, { color: theme.text.muted }]}>
              Paste the {coin.name} wallet address below.
            </Text>

            <View style={[styles.inputWrap, {
              backgroundColor: theme.bg.secondary,
              borderColor: detectedSymbol === coin.symbol ? coin.color : theme.border.DEFAULT,
              borderWidth: detectedSymbol === coin.symbol ? 2 : 1,
            }]}>
              <TextInput
                style={[textStyles.body, { color: theme.text.primary, flex: 1 }]}
                value={toAddress}
                onChangeText={handleAddressChange}
                placeholder={`Paste ${coin.symbol} address`}
                placeholderTextColor={theme.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Detection feedback */}
            {toAddress.length > 0 && (
              <View style={[styles.detectionRow, {
                backgroundColor: detectedSymbol === coin.symbol
                  ? coin.color + '15'
                  : detectedSymbol
                    ? '#EF444415'
                    : theme.bg.secondary,
              }]}>
                <Ionicons
                  name={detectedSymbol === coin.symbol ? 'checkmark-circle' : detectedSymbol ? 'warning' : 'help-circle'}
                  size={16}
                  color={detectedSymbol === coin.symbol ? coin.color : detectedSymbol ? '#EF4444' : theme.text.muted}
                />
                <Text style={[textStyles.caption, {
                  color: detectedSymbol === coin.symbol ? coin.color : detectedSymbol ? '#EF4444' : theme.text.muted,
                }]}>
                  {detectedSymbol === coin.symbol
                    ? `Valid ${coin.symbol} address`
                    : detectedSymbol
                      ? `Looks like a ${detectedSymbol} address — you are on ${coin.symbol} network`
                      : 'Address format not recognised'}
                </Text>
              </View>
            )}

            {/* XRP destination tag */}
            {coin.symbol === 'XRP' && (
              <>
                <Text style={[textStyles.label, { color: theme.text.secondary }]}>
                  Destination Tag <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <View style={[styles.inputWrap, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
                  <TextInput
                    style={[textStyles.body, { color: theme.text.primary, flex: 1 }]}
                    value={destinationTag}
                    onChangeText={setDestinationTag}
                    placeholder="e.g. 123456789"
                    placeholderTextColor={theme.text.muted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.warnBox, { backgroundColor: '#EF444415', borderColor: '#EF444440' }]}>
                  <Ionicons name="warning-outline" size={16} color="#EF4444" />
                  <Text style={[textStyles.caption, { color: '#EF4444', flex: 1 }]}>
                    Wrong destination tag = permanent loss of funds.
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary }]}
              onPress={() => { if (validateAddress()) setStep(2); }}
            >
              <Text style={[textStyles.label, { color: '#000' }]}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2: AMOUNT ── */}
        {step === 2 && (
          <>
            <Text style={[textStyles.h3, { color: theme.text.primary }]}>How much?</Text>

            {/* Balance + max */}
            <View style={[styles.balanceCard, { backgroundColor: coin.color + '12', borderColor: coin.color + '30', borderWidth: 1 }]}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>Available</Text>
                  <Text style={[textStyles.h3, { color: theme.text.primary }]}>
                    {parseFloat(balance).toFixed(8).replace(/\.?0+$/, '') || '0'} {coin.symbol}
                  </Text>
                </View>
                {parseFloat(balance) > 0 && (
                  <TouchableOpacity
                    onPress={() => setAmount(truncateCryptoAmount(balance))}
                    style={[styles.maxBtn, { backgroundColor: coin.color }]}
                  >
                    <Text style={[textStyles.labelSm, { color: '#fff', fontWeight: '700' }]}>Max</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.inputWrap, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
              <Image source={{ uri: coin.logoUrl }} style={{ width: 24, height: 24 }} resizeMode="contain" />
              <TextInput
                style={[textStyles.h2, { color: theme.text.primary, flex: 1 }]}
                value={amount}
                onChangeText={(v) => setAmount(sanitizeCryptoInput(v))}
                placeholder="0"
                placeholderTextColor={theme.text.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={[textStyles.label, { color: theme.text.muted }]}>{coin.symbol}</Text>
            </View>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>
              Minimum: {MIN_SEND[coin.symbol]} {coin.symbol}
            </Text>

            {/* Beneficiary name */}
            <Text style={[textStyles.label, { color: theme.text.secondary, marginTop: spacing[2] }]}>
              Recipient Name{' '}
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>(for large transfers)</Text>
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
              <TextInput
                style={[textStyles.body, { color: theme.text.primary, flex: 1 }]}
                value={beneficiaryName}
                onChangeText={setBeneficiaryName}
                placeholder="Full name of wallet owner"
                placeholderTextColor={theme.text.muted}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>
              Required for transfers above ₦1,650,000 (FATF Travel Rule)
            </Text>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary }]}
              onPress={() => { if (validateAmount()) setStep(3); }}
            >
              <Text style={[textStyles.label, { color: '#000' }]}>Review Send</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === 3 && (
          <>
            <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
              <Image source={{ uri: coin.logoUrl }} style={styles.summaryLogo} resizeMode="contain" />
              <Text style={[textStyles.h1, { color: theme.text.primary, marginTop: spacing[2] }]}>
                {amount} {coin.symbol}
              </Text>
              <View style={styles.divider} />
              {[
                { label: 'To',      value: `${toAddress.slice(0, 14)}...${toAddress.slice(-8)}` },
                { label: 'Network', value: coin.name },
                ...(destinationTag ? [{ label: 'Destination tag', value: destinationTag }] : []),
                ...(beneficiaryName ? [{ label: 'Recipient', value: beneficiaryName }] : []),
              ].map((row, i) => (
                <View key={i} style={styles.detailRow}>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{row.label}</Text>
                  <Text style={[textStyles.caption, { color: theme.text.primary, fontWeight: '600', flex: 1, textAlign: 'right' }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={[styles.warnBox, { backgroundColor: '#EF444410', borderColor: '#EF444430' }]}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text style={[textStyles.caption, { color: '#EF4444', flex: 1 }]}>
                  Crypto transactions are irreversible. Double-check the address.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.cta, { backgroundColor: '#EF4444' }]} onPress={() => setStep('pin')}>
              <Text style={[textStyles.label, { color: '#fff' }]}>Confirm & Enter PIN</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── PIN ── */}
        {step === 'pin' && (
          <View style={styles.center}>
            <LoadingOverlay visible={loading} message="Sending..." />
            <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary, width: '100%' }]}>
              <Image source={{ uri: coin.logoUrl }} style={styles.summaryLogo} resizeMode="contain" />
              <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[2] }]}>
                {amount} {coin.symbol}
              </Text>
              <Text style={[textStyles.caption, { color: theme.text.muted }]} numberOfLines={1}>
                → {toAddress.slice(0, 18)}...{toAddress.slice(-6)}
              </Text>
            </View>
            <Text style={[textStyles.label, { color: theme.text.secondary, marginTop: spacing[6], marginBottom: spacing[3] }]}>
              Enter your PIN to confirm
            </Text>
            <PinInput onComplete={send} error={pinError} onRef={(api) => { pinRef.current = api; }} />
          </View>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Sent!</Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              {amount} {coin.symbol} is on its way to the destination address.
            </Text>
            {txRef ? (
              <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[3] }]}>Ref: {txRef}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.cta, { backgroundColor: theme.brand.primary, marginTop: spacing[6], width: '100%' }]}
              onPress={() => router.back()}
            >
              <Text style={[textStyles.label, { color: '#000' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  topBar:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
  },
  backBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center', gap: spacing[0.5] },
  coinHeader:{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  coinHeaderLogo: { width: 28, height: 28 },
  content:   { padding: spacing[4], gap: spacing[4] },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    borderRadius: radius.xl, borderWidth: 1,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
  },
  detectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    borderRadius: radius.lg, padding: spacing[3],
  },
  warnBox: { flexDirection: 'row', gap: spacing[2], borderRadius: radius.lg, padding: spacing[3], borderWidth: 1 },

  balanceCard: { borderRadius: radius.xl, padding: spacing[4] },
  balanceRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  maxBtn:      { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },

  cta:       { padding: spacing[4], borderRadius: radius.xl, alignItems: 'center' },
  summaryCard:{ borderRadius: radius.xl, padding: spacing[5], alignItems: 'center', gap: spacing[2] },
  summaryLogo:{ width: 56, height: 56 },
  divider:   { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', width: '100%', marginVertical: spacing[2] },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%', gap: spacing[3],
  },
  center:    { alignItems: 'center', paddingTop: spacing[4], width: '100%' },
});
