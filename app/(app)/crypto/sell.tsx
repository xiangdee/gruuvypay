// app/(app)/crypto/sell.tsx
// Example sell screen — shows the full useLiveRate + RateChangedBanner pattern

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';

import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useLiveRate } from '@/hooks/useLiveRate';
import { RateChangedBanner } from '@/components/crypto/crypto/RateChangedBanner';

export default function SellCryptoScreen() {
  const { theme }  = useTheme();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();

  const [cryptoInput, setCryptoInput] = useState('');
  const [fiatInput,   setFiatInput]   = useState('');
  const [inputMode,   setInputMode]   = useState<'crypto' | 'fiat'>('crypto');

  const {
    rate, loading, error, fetchedAt,
    rateChanged, changePct,
    convert, convertReverse,
    formatTo, formatFrom,
    acceptNewRate, refresh,
  } = useLiveRate(symbol ?? 'BTC', 'NGN', '₦');

  // ─── Input handlers — all math is local, zero API calls ──────────────

  function handleCryptoInput(val: string) {
    setCryptoInput(val);
    setInputMode('crypto');
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setFiatInput(convert(num).toFixed(2));
    } else {
      setFiatInput('');
    }
  }

  function handleFiatInput(val: string) {
    setFiatInput(val);
    setInputMode('fiat');
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const decimals = ['BTC', 'ETH'].includes(symbol) ? 8 : 4;
      setCryptoInput(convertReverse(num).toFixed(decimals));
    } else {
      setCryptoInput('');
    }
  }

  function handleConfirm() {
    // TODO: call Quidax sell API
  }

  if (loading && !rate) {
    return (
      <Screen padded>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3] }]}>
            Fetching live rate...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded scrollable>

      {/* Rate change warning — shown when rate moves > 1% */}
      {rateChanged && (
        <RateChangedBanner
          changePct={changePct}
          fromSymbol={symbol ?? 'BTC'}
          toSymbol="₦"
          onAccept={acceptNewRate}
        />
      )}

      {/* Error */}
      {error && <ErrorCard message={error} style={{ marginBottom: spacing[4] }} />}

      {/* Live rate display */}
      <View style={[styles.rateRow, { backgroundColor: theme.bg.secondary }]}>
        <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>
          1 {symbol} = ₦{rate?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) ?? '...'}
        </Text>
        <View style={styles.rateRight}>
          {fetchedAt && (
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>
              Updated {fetchedAt.toLocaleTimeString()}
            </Text>
          )}
          <TouchableOpacity onPress={refresh}>
            <Ionicons name="refresh-outline" size={14} color={theme.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Crypto amount input */}
      <View style={[styles.inputCard, { backgroundColor: theme.bg.secondary }]}>
        <Text style={[textStyles.labelSm, { color: theme.text.muted }]}>
          You sell
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            value={cryptoInput}
            onChangeText={handleCryptoInput}
            placeholder="0"
            placeholderTextColor={theme.text.muted}
            keyboardType="decimal-pad"
            style={[textStyles.h2, { color: theme.text.primary, flex: 1 }]}
          />
          <Text style={[textStyles.h3, { color: theme.text.secondary }]}>
            {symbol}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.arrowRow}>
        <Ionicons name="arrow-down" size={20} color={theme.text.muted} />
      </View>

      {/* NGN amount input */}
      <View style={[styles.inputCard, { backgroundColor: theme.bg.secondary }]}>
        <Text style={[textStyles.labelSm, { color: theme.text.muted }]}>
          You receive
        </Text>
        <View style={styles.inputRow}>
          <Text style={[textStyles.h2, { color: theme.text.secondary }]}>₦</Text>
          <TextInput
            value={fiatInput}
            onChangeText={handleFiatInput}
            placeholder="0.00"
            placeholderTextColor={theme.text.muted}
            keyboardType="decimal-pad"
            style={[textStyles.h2, { color: theme.text.primary, flex: 1 }]}
          />
        </View>
      </View>

      {/* Confirm — disabled if rate has changed and user hasn't accepted */}
      <View style={styles.cta}>
        <Button
          label={rateChanged ? 'Accept new rate first' : `Sell ${symbol}`}
          onPress={handleConfirm}
          disabled={rateChanged || !cryptoInput || !rate}
          variant={rateChanged ? 'secondary' : 'primary'}
        />
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rateRow:  {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderRadius:   radius.lg,
    padding:        spacing[3],
    marginBottom:   spacing[4],
  },
  rateRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  inputCard: {
    borderRadius:      radius.xl,
    padding:           spacing[4],
    marginBottom:      spacing[2],
  },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[2] },
  arrowRow:  { alignItems: 'center', marginVertical: spacing[1] },
  cta:       { marginTop: spacing[6] },
});