// Buy crypto with NGN wallet balance
// Live rate updates every 15s via useLiveRate

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useAppSelector } from '@/store/hooks';
import { cryptoApi }   from '@/api/crypto.api';
import { PinInput }    from '@/components/ui/PinInput';
import { Button }      from '@/components/ui/Button';
import { ErrorCard }   from '@/components/ui/ErrorCard';

import { useLiveRate } from '@/hooks/useLiveRate';
import { useToast }    from '@/hooks/useToast';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { RateChangedBanner } from '@/components/crypto/crypto/RateChangedBanner';

const SUPPORTED_COINS: Record<string, { name: string; color: string }> = {
  BTC:  { name: 'Bitcoin',  color: '#F7931A' },
  ETH:  { name: 'Ethereum', color: '#627EEA' },
  USDT: { name: 'Tether',   color: '#26A17B' },
  SOL:  { name: 'Solana',   color: '#9945FF' },
  LTC:  { name: 'Litecoin', color: '#BFBBBB' },
  XRP:  { name: 'XRP',      color: '#00AAE4' },
};

type BuyStep = 'amount' | 'confirm' | 'pin' | 'success';

export default function CryptoBuyScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const coin       = symbol?.toUpperCase() ?? 'BTC';
  const coinInfo   = SUPPORTED_COINS[coin] ?? SUPPORTED_COINS['BTC'];

  const wallet = useAppSelector((s) => s.wallet);
  const balanceNaira = parseInt(wallet.balanceRaw ?? '0') / 100;

  const [step,      setStep]      = useState<BuyStep>('amount');
  const [ngnInput,  setNgnInput]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [result,    setResult]    = useState<any>(null);
  const [pinError,  setPinError]  = useState(false);
  const idempotencyKey = useRef(uuidv4());
  const pinRef = useRef<{ shake: () => void } | null>(null);

  const {
    rate, loading: rateLoading,
    rateChanged, changePct,
    convert, formatTo, formatFrom,
    acceptNewRate, fetchedAt,
  } = useLiveRate(coin, 'NGN', '₦');

  const ngnAmount    = parseFloat(ngnInput) || 0;
  const cryptoAmount = rate ? (ngnAmount / rate).toFixed(8) : '0';

  const QUICK_AMOUNTS = ['5000', '10000', '20000', '50000', '100000'];

  function proceedToConfirm() {
    if (!ngnInput || ngnAmount <= 0) { setError('Enter an amount');    return; }
    if (ngnAmount < 1000)            { setError('Minimum is ₦1,000'); return; }
    if (ngnAmount > balanceNaira)    { setError('Insufficient balance'); return; }
    setError('');
    idempotencyKey.current = uuidv4();
    setStep('confirm');
  }

  async function onPinComplete(pin: string) {
    setPinError(false);
    setLoading(true);
    try {
      const data = await cryptoApi.buy({
        symbol:         coin,
        amountNgn:      ngnAmount,
        pin,
        idempotencyKey: idempotencyKey.current,
      });
      setResult(data);
      setStep('success');
    } catch (err: any) {
      setPinError(true);
      pinRef.current?.shake();
      toast.error('Purchase failed', err?.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Success ─────────────────────────────────────────────────────────
  if (step === 'success' && result) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.successScreen}>
          <View style={[styles.successIcon, { backgroundColor: coinInfo.color + '20' }]}>
            <Ionicons name="checkmark-circle" size={64} color={theme.status.success} />
          </View>
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
            Purchase Complete!
          </Text>
          <Text style={[textStyles.h3, { color: coinInfo.color, marginTop: spacing[2] }]}>
            {result.cryptoAmount} {coin}
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[1] }]}>
            for ₦{parseFloat(result.amountNgn).toLocaleString()}
          </Text>
          <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[2] }]}>
            Ref: {result.reference}
          </Text>
          <View style={styles.successActions}>
            <Button label="Buy More"     onPress={() => setStep('amount')} variant="secondary" />
            <Button label="Go to Crypto" onPress={() => router.replace('/(app)/crypto')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── PIN ─────────────────────────────────────────────────────────────
  if (step === 'pin') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={[styles.screen, { paddingTop: spacing[10] }]}>
          <Text style={[textStyles.h2, { color: theme.text.primary, textAlign: 'center' }]}>
            Enter PIN
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2], marginBottom: spacing[10] }]}>
            Confirm purchase of {cryptoAmount} {coin}
          </Text>
          {loading
            ? <ActivityIndicator size="large" color={theme.brand.primary} style={{ flex: 1 }} />
            : <PinInput onComplete={onPinComplete} error={pinError} onRef={(a) => { pinRef.current = a; }} style={{ flex: 1 }} />
          }
        </View>
      </SafeAreaView>
    );
  }

  // ── Confirm ──────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Text style={[textStyles.h2, { color: theme.text.primary, marginBottom: spacing[6] }]}>
            Confirm Purchase
          </Text>

          {rateChanged && (
            <RateChangedBanner
              changePct={changePct}
              fromSymbol={coin}
              toSymbol="₦"
              onAccept={acceptNewRate}
            />
          )}

          <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
            {[
              { label: 'You pay',     value: `₦${ngnAmount.toLocaleString()}`,    highlight: true },
              { label: 'You receive', value: `${cryptoAmount} ${coin}` },
              { label: 'Rate',        value: `1 ${coin} = ₦${rate?.toLocaleString() ?? '...'}` },
              { label: 'GruuvyPay fee', value: '2%' },
            ].map((row, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>{row.label}</Text>
                <Text style={[textStyles.label, { color: row.highlight ? theme.brand.primary : theme.text.primary }]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ gap: spacing[3], marginTop: spacing[6] }}>
            <Button
              label="Enter PIN to Buy"
              onPress={() => setStep('pin')}
              disabled={rateChanged}
            />
            <Button label="Go Back" onPress={() => setStep('amount')} variant="ghost" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Amount entry ─────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>
          Buy {coinInfo.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rateChanged && (
          <RateChangedBanner
            changePct={changePct}
            fromSymbol={coin}
            toSymbol="₦"
            onAccept={acceptNewRate}
          />
        )}

        {error ? <ErrorCard message={error} /> : null}

        {/* Live rate display */}
        <View style={[styles.rateCard, { backgroundColor: coinInfo.color + '15', borderColor: coinInfo.color + '30' }]}>
          {rateLoading && !rate
            ? <ActivityIndicator color={coinInfo.color} />
            : (
              <Text style={[textStyles.label, { color: coinInfo.color }]}>
                1 {coin} = ₦{rate?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) ?? '...'}
              </Text>
            )
          }
          {fetchedAt && (
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>
              Updated {fetchedAt.toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* NGN input */}
        <View style={[styles.inputCard, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted }]}>YOU PAY (NGN)</Text>
          <View style={styles.inputRow}>
            <Text style={[textStyles.h2, { color: theme.text.secondary }]}>₦</Text>
            <TextInput
              value={ngnInput}
              onChangeText={(v) => { setNgnInput(v.replace(/[^0-9.]/g, '')); setError(''); }}
              placeholder="0"
              placeholderTextColor={theme.text.muted}
              keyboardType="decimal-pad"
              style={[textStyles.h1, { color: theme.text.primary, flex: 1 }]}
              autoFocus
            />
          </View>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>
            Balance: ₦{balanceNaira.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Crypto preview */}
        <View style={[styles.inputCard, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted }]}>YOU RECEIVE</Text>
          <Text style={[textStyles.h2, { color: coinInfo.color, marginTop: spacing[2] }]}>
            {ngnAmount > 0 ? cryptoAmount : '0'} {coin}
          </Text>
        </View>

        {/* Quick amounts */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((q) => (
            <TouchableOpacity
              key={q}
              onPress={() => { setNgnInput(q); setError(''); }}
              style={[
                styles.quickChip,
                { backgroundColor: ngnInput === q ? coinInfo.color + '20' : theme.bg.card },
                ngnInput === q && { borderColor: coinInfo.color, borderWidth: 1.5 },
              ]}
            >
              <Text style={[textStyles.labelSm, {
                color: ngnInput === q ? coinInfo.color : theme.text.secondary,
              }]}>
                ₦{parseInt(q).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="Continue"
          onPress={proceedToConfirm}
          disabled={!ngnInput || ngnAmount < 1000 || rateLoading}
          style={{ marginTop: spacing[4] }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  screen:  { padding: spacing[4], flexGrow: 1 },
  content: { padding: spacing[4], gap: spacing[4] },
  rateCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: radius.lg, borderWidth: 1, padding: spacing[3],
  },
  inputCard:  { borderRadius: radius.xl, padding: spacing[4], gap: spacing[2] },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  quickRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  quickChip:  { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  summaryCard: { borderRadius: radius.xl, padding: spacing[4], gap: spacing[4] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  successIcon: { width: 120, height: 120, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  successActions: { width: '100%', gap: spacing[3], marginTop: spacing[10] },
});