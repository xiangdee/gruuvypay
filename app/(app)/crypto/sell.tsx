// app/(app)/crypto/sell.tsx — personalized for one coin
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Image,
} from 'react-native';
import { SafeAreaView }    from 'react-native-safe-area-context';
import { Ionicons }        from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { cryptoApi, SwapQuote } from '@/api/crypto.api';
import { useToast }        from '@/hooks/useToast';
import { PinInput }        from '@/components/ui/PinInput';
import { LoadingOverlay }  from '@/components/ui/LoadingOverlay';
import { SUPPORTED_COINS } from '@/screens/app/crypto.logic';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCryptoWallets } from '@/store/slices/crypto.slice';
import { sanitizeCryptoInput, truncateCryptoAmount } from '@/utils/crypto';

const MIN_SELL: Record<string, number> = {
  BTC: 0.000005, ETH: 0.0001, USDT: 0.5, SOL: 0.005, LTC: 0.005, XRP: 1,
};

export default function CryptoSellScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const toast     = useToast();
  const dispatch  = useAppDispatch();
  const { symbol: rawSymbol } = useLocalSearchParams<{ symbol?: string }>();

  const coin = SUPPORTED_COINS.find((c) => c.symbol === rawSymbol) ?? SUPPORTED_COINS[0];

  const wallets        = useAppSelector((s) => s.crypto.wallets);
  const walletsLoading = useAppSelector((s) => s.crypto.walletsLoading);
  const prices         = useAppSelector((s) => s.crypto.prices);

  const balance      = wallets.find((w) => w.symbol === coin.symbol)?.balance ?? '0';
  const balanceNum   = parseFloat(balance);
  const coinPriceNGN = prices[coin.symbol]?.priceNGN ?? 0;
  const balanceNGN   = balanceNum * coinPriceNGN;

  const [inputMode,   setInputMode]   = useState<'crypto' | 'fiat'>('crypto');
  const [cryptoValue, setCryptoValue] = useState('');
  const [fiatValue,   setFiatValue]   = useState('');
  const [quote,       setQuote]       = useState<SwapQuote | null>(null);
  const [pinError,    setPinError]    = useState(false);
  const [step,        setStep]        = useState<'form' | 'quote' | 'pin' | 'success'>('form');
  const [loading,     setLoading]     = useState(false);
  const [quoting,     setQuoting]     = useState(false);
  const [countdown,   setCountdown]   = useState(0);

  const pinRef   = useRef<{ shake: () => void; reset: () => void } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cryptoNum = parseFloat(cryptoValue || '0');
  const fiatNum   = parseFloat(fiatValue   || '0');

  const estimatedNgn    = coinPriceNGN > 0 && cryptoNum > 0
    ? (cryptoNum * coinPriceNGN).toLocaleString('en-NG', { maximumFractionDigits: 2 }) : '';
  const estimatedCrypto = coinPriceNGN > 0 && fiatNum > 0
    ? truncateCryptoAmount(fiatNum / coinPriceNGN) : '';

  const cryptoForQuote = inputMode === 'crypto' ? cryptoValue : estimatedCrypto;

  useEffect(() => { dispatch(fetchCryptoWallets()); }, []);

  useEffect(() => {
    if (step === 'quote') {
      setCountdown(15);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setStep('form'); setQuote(null);
            toast.error('Quote expired. Get a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  function toggleMode() {
    setInputMode((m) => {
      if (m === 'crypto' && cryptoValue && coinPriceNGN > 0)
        setFiatValue(String(Math.round(cryptoNum * coinPriceNGN)));
      else if (m === 'fiat' && fiatValue && coinPriceNGN > 0)
        setCryptoValue(truncateCryptoAmount(fiatNum / coinPriceNGN));
      return m === 'crypto' ? 'fiat' : 'crypto';
    });
  }

  function useMax() {
    setInputMode('crypto');
    setCryptoValue(truncateCryptoAmount(balance));
  }

  async function getQuote() {
    const amt = parseFloat(cryptoForQuote || '0');
    const min = MIN_SELL[coin.symbol] ?? 0;
    if (!amt || amt <= 0)    { toast.error('Enter a valid amount'); return; }
    if (amt < min)           { toast.error(`Minimum sell is ${min} ${coin.symbol}`); return; }
    if (amt > balanceNum)    { toast.error('Insufficient balance'); return; }
    setQuoting(true);
    try {
      const res = await cryptoApi.swapQuote(coin.symbol, 'sell', { cryptoAmount: truncateCryptoAmount(amt) });
      setQuote(res); setStep('quote');
    } catch (err: any) { toast.error(err?.message ?? 'Could not get quote'); }
    finally { setQuoting(false); }
  }

  async function sell(pin: string) {
    if (!quote) return;
    setPinError(false); setLoading(true);
    try {
      await cryptoApi.swapConfirm({ quotationId: quote.quotationId, pin });
      setStep('success');
    } catch (err: any) {
      setPinError(true); pinRef.current?.shake(); pinRef.current?.reset();
      toast.error(err?.message ?? 'Sell failed');
    } finally { setLoading(false); }
  }

  const ngnReceived = quote?.toAmount   ?? '0';
  const cryptoSold  = quote?.fromAmount ?? '0';
  const rate = quote
    ? (parseFloat(quote.toAmount) / parseFloat(quote.fromAmount)).toFixed(2) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      {/* Personalized header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => {
          if (step === 'quote') { setStep('form'); setQuote(null); }
          else if (step === 'pin') setStep('quote');
          else router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <View style={styles.coinHeader}>
            <Image source={{ uri: coin.logoUrl }} style={styles.coinHeaderLogo} resizeMode="contain" />
            <Text style={[textStyles.h3, { color: theme.text.primary }]}>Sell {coin.name}</Text>
          </View>
          {coinPriceNGN > 0 && (
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>
              ₦{coinPriceNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })} / {coin.symbol}
            </Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {step === 'form' && (
          <>
            {/* Balance card with prominent Max */}
            <View style={[styles.balanceCard, { backgroundColor: coin.color + '12', borderColor: coin.color + '30', borderWidth: 1 }]}>
              <View style={styles.balanceTop}>
                <View>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>Your {coin.symbol} Balance</Text>
                  <Text style={[textStyles.h3, { color: theme.text.primary }]}>
                    {walletsLoading && !balance ? '...' : `${balanceNum > 0 ? balanceNum.toFixed(8).replace(/\.?0+$/, '') : '0'} ${coin.symbol}`}
                  </Text>
                  {balanceNGN > 0 && (
                    <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                      ≈ ₦{balanceNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                    </Text>
                  )}
                </View>
                {balanceNum > 0 && (
                  <TouchableOpacity
                    onPress={useMax}
                    style={[styles.maxBtn, { backgroundColor: coin.color }]}
                  >
                    <Text style={[textStyles.label, { color: '#fff', fontWeight: '700' }]}>Sell Max</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bi-directional input */}
            <View style={[styles.swapBox, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
              <View style={styles.swapField}>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                  {inputMode === 'crypto' ? 'You Sell' : 'You Want (NGN)'}
                </Text>
                <View style={styles.inputRow}>
                  {inputMode === 'crypto' ? (
                    <>
                      <Image source={{ uri: coin.logoUrl }} style={{ width: 24, height: 24 }} resizeMode="contain" />
                      <TextInput
                        style={[textStyles.h2, { color: theme.text.primary, flex: 1 }]}
                        value={cryptoValue}
                        onChangeText={(v) => setCryptoValue(sanitizeCryptoInput(v))}
                        placeholder="0"
                        placeholderTextColor={theme.text.muted}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                      <Text style={[textStyles.label, { color: theme.text.muted }]}>{coin.symbol}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[textStyles.h2, { color: theme.text.muted }]}>₦</Text>
                      <TextInput
                        style={[textStyles.h2, { color: theme.text.primary, flex: 1 }]}
                        value={fiatValue}
                        onChangeText={(v) => setFiatValue(v.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                        placeholderTextColor={theme.text.muted}
                        keyboardType="numeric"
                        autoFocus
                      />
                    </>
                  )}
                </View>
              </View>

              <TouchableOpacity onPress={toggleMode} style={[styles.swapToggle, { borderColor: theme.border.DEFAULT, backgroundColor: theme.bg.primary }]}>
                <Ionicons name="swap-vertical" size={18} color="#EF4444" />
              </TouchableOpacity>

              <View style={[styles.swapField, { opacity: 0.65 }]}>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                  {inputMode === 'crypto' ? 'You Receive (est.)' : 'You Sell (est.)'}
                </Text>
                <View style={styles.inputRow}>
                  {inputMode === 'crypto' ? (
                    <>
                      <Text style={[textStyles.h2, { color: theme.text.muted }]}>₦</Text>
                      <Text style={[textStyles.h2, { color: theme.text.secondary, flex: 1 }]}>
                        {estimatedNgn || '0'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Image source={{ uri: coin.logoUrl }} style={{ width: 24, height: 24 }} resizeMode="contain" />
                      <Text style={[textStyles.h2, { color: theme.text.secondary, flex: 1 }]}>
                        {estimatedCrypto || '0'}
                      </Text>
                      <Text style={[textStyles.label, { color: theme.text.muted }]}>{coin.symbol}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.cta, { backgroundColor: '#EF4444' }]}
              onPress={getQuote}
              disabled={quoting}
            >
              {quoting ? <ActivityIndicator color="#fff" /> : <Text style={[textStyles.label, { color: '#fff' }]}>Get Quote</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 'quote' && quote && (
          <>
            <View style={[styles.quoteCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.label, { color: theme.text.secondary }]}>You sell</Text>
              <Text style={[{ fontSize: 28, fontWeight: '700', color: coin.color }]}>
                {truncateCryptoAmount(cryptoSold)} {coin.symbol}
              </Text>
              <Ionicons name="arrow-down" size={24} color={theme.text.muted} style={{ marginVertical: spacing[2] }} />
              <Text style={[textStyles.label, { color: theme.text.secondary }]}>You receive</Text>
              <Text style={[textStyles.h1, { color: '#22C55E' }]}>
                ₦{parseFloat(ngnReceived).toLocaleString('en-NG', { maximumFractionDigits: 2 })}
              </Text>
              <View style={styles.divider} />
              <View style={styles.quoteRow}>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>Rate</Text>
                <Text style={[textStyles.caption, { color: theme.text.primary, fontWeight: '600' }]}>
                  {rate ? `₦${parseFloat(rate).toLocaleString('en-NG', { maximumFractionDigits: 0 })} / ${coin.symbol}` : '—'}
                </Text>
              </View>
              {quote.spreadPercent && quote.spreadAmount && (
                <View style={styles.quoteRow}>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>Service fee ({quote.spreadPercent})</Text>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                    -₦{parseFloat(quote.spreadAmount).toLocaleString('en-NG', { maximumFractionDigits: 2 })}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.infoBox, { backgroundColor: countdown <= 5 ? '#EF444420' : theme.bg.secondary }]}>
              <Ionicons name="time-outline" size={16} color={countdown <= 5 ? '#EF4444' : theme.text.muted} />
              <Text style={[textStyles.caption, { color: countdown <= 5 ? '#EF4444' : theme.text.muted, flex: 1 }]}>
                Quote expires in {countdown}s
              </Text>
            </View>
            <TouchableOpacity style={[styles.cta, { backgroundColor: '#EF4444' }]} onPress={() => setStep('pin')}>
              <Text style={[textStyles.label, { color: '#fff' }]}>Confirm Sell</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'pin' && (
          <View style={styles.center}>
            <LoadingOverlay visible={loading} message="Submitting order..." />
            <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
              <Image source={{ uri: coin.logoUrl }} style={styles.summaryLogo} resizeMode="contain" />
              <Text style={[textStyles.h2, { color: theme.text.primary }]}>{cryptoSold} {coin.symbol}</Text>
              <Text style={[textStyles.body, { color: '#22C55E' }]}>
                → ₦{parseFloat(ngnReceived).toLocaleString('en-NG', { maximumFractionDigits: 2 })}
              </Text>
            </View>
            <Text style={[textStyles.label, { color: theme.text.secondary, marginTop: spacing[6], marginBottom: spacing[3] }]}>
              Enter PIN to confirm
            </Text>
            <PinInput onComplete={sell} error={pinError} onRef={(api) => { pinRef.current = api; }} />
          </View>
        )}

        {step === 'success' && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={72} color="#22C55E" />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>Order Submitted!</Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              ₦{parseFloat(ngnReceived).toLocaleString('en-NG', { maximumFractionDigits: 2 })} will be credited to your NGN wallet shortly.
            </Text>
            <TouchableOpacity style={[styles.cta, { backgroundColor: theme.brand.primary, marginTop: spacing[6] }]} onPress={() => router.back()}>
              <Text style={[textStyles.label, { color: '#000' }]}>View Portfolio</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  topCenter: { flex: 1, alignItems: 'center', gap: spacing[0.5] },
  coinHeader:{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  coinHeaderLogo: { width: 28, height: 28 },
  content:   { padding: spacing[4], gap: spacing[4] },

  balanceCard: { borderRadius: radius.xl, padding: spacing[4] },
  balanceTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  maxBtn:      { paddingHorizontal: spacing[4], paddingVertical: spacing[2.5], borderRadius: radius.full },

  swapBox:   { borderRadius: radius.xl, borderWidth: 1, padding: spacing[4], gap: spacing[3] },
  swapField: { gap: spacing[1] },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  swapToggle:{ alignSelf: 'center', borderRadius: 999, borderWidth: 1, padding: spacing[2] },

  cta:       { padding: spacing[4], borderRadius: radius.xl, alignItems: 'center' },
  infoBox:   { flexDirection: 'row', gap: spacing[2], borderRadius: radius.xl, padding: spacing[3] },
  quoteCard: { borderRadius: radius.xl, padding: spacing[5], alignItems: 'center', gap: spacing[2] },
  divider:   { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', width: '100%', marginVertical: spacing[2] },
  quoteRow:  { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  center:    { alignItems: 'center', paddingTop: spacing[4], width: '100%' },
  summaryCard:{ width: '100%', borderRadius: radius.xl, padding: spacing[5], alignItems: 'center', gap: spacing[2] },
  summaryLogo:{ width: 56, height: 56 },
});
