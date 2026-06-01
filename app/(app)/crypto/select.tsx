// app/(app)/crypto/select.tsx
// Coin picker — shown when user taps Buy/Sell/Send/Receive
// from the portfolio card (no coin pre-selected).

import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView }      from 'react-native-safe-area-context';
import { Ionicons }          from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCryptoWallets, fetchCryptoPrices } from '@/store/slices/crypto.slice';
import { SUPPORTED_COINS, CoinSymbol } from '@/screens/app/crypto.logic';

type Mode = 'buy' | 'sell' | 'send' | 'receive';

const MODE_META: Record<Mode, { title: string; subtitle: string; icon: any; color: string }> = {
  buy:     { title: 'Buy Crypto',     subtitle: 'Select a coin to purchase',      icon: 'trending-up',   color: '#22C55E' },
  sell:    { title: 'Sell Crypto',    subtitle: 'Select a coin to sell',           icon: 'trending-down', color: '#EF4444' },
  send:    { title: 'Send Crypto',    subtitle: 'Select a coin to send',           icon: 'paper-plane',   color: '#6366F1' },
  receive: { title: 'Receive Crypto', subtitle: 'Select a coin to receive',        icon: 'download',      color: '#0EA5E9' },
};

const DEST: Record<Mode, string> = {
  buy:     '/(app)/crypto/buy',
  sell:    '/(app)/crypto/sell',
  send:    '/(app)/crypto/send',
  receive: '/(app)/crypto/receive',
};

export default function CryptoSelectScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const dispatch   = useAppDispatch();
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode = (rawMode ?? 'buy') as Mode;
  const meta = MODE_META[mode] ?? MODE_META.buy;

  const wallets        = useAppSelector((s) => s.crypto.wallets);
  const prices         = useAppSelector((s) => s.crypto.prices);
  const walletsLoading = useAppSelector((s) => s.crypto.walletsLoading);
  const pricesLoading  = useAppSelector((s) => s.crypto.pricesLoading);

  useEffect(() => {
    dispatch(fetchCryptoWallets());
    dispatch(fetchCryptoPrices());
  }, []);

  function selectCoin(symbol: CoinSymbol) {
    router.push({ pathname: DEST[mode] as any, params: { symbol } });
  }

  // For sell/send show only coins with balance; for buy/receive show all
  const coins = (mode === 'sell' || mode === 'send')
    ? [...SUPPORTED_COINS].sort((a, b) => {
        const balA = parseFloat(wallets.find((w) => w.symbol === a.symbol)?.balance ?? '0');
        const balB = parseFloat(wallets.find((w) => w.symbol === b.symbol)?.balance ?? '0');
        return balB - balA; // coins with balance first
      })
    : [...SUPPORTED_COINS];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={[textStyles.h3, { color: theme.text.primary }]}>{meta.title}</Text>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>{meta.subtitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {(walletsLoading || pricesLoading) && (
        <ActivityIndicator size="small" color={theme.brand.primary} style={{ marginBottom: spacing[2] }} />
      )}

      <FlatList
        data={coins as unknown as typeof SUPPORTED_COINS[number][]}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={styles.list}
        renderItem={({ item: coin }) => {
          const price   = prices[coin.symbol];
          const wallet  = wallets.find((w) => w.symbol === coin.symbol);
          const balance = parseFloat(wallet?.balance ?? '0');
          const priceNGN = price?.priceNGN ?? 0;
          const valueNGN = balance * priceNGN;
          const hasBalance = balance > 0;

          return (
            <TouchableOpacity
              onPress={() => selectCoin(coin.symbol as CoinSymbol)}
              activeOpacity={0.7}
              style={[
                styles.card,
                {
                  backgroundColor: theme.bg.secondary,
                  opacity: (mode === 'sell' || mode === 'send') && !hasBalance ? 0.4 : 1,
                },
              ]}
            >
              {/* Left: logo + name */}
              <View style={styles.cardLeft}>
                <View style={[styles.logoWrap, { backgroundColor: coin.color + '18' }]}>
                  <Image source={{ uri: coin.logoUrl }} style={styles.logo} resizeMode="contain" />
                </View>
                <View>
                  <Text style={[textStyles.label, { color: theme.text.primary }]}>{coin.name}</Text>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{coin.symbol}</Text>
                </View>
              </View>

              {/* Right: price or balance */}
              <View style={styles.cardRight}>
                {(mode === 'sell' || mode === 'send') ? (
                  hasBalance ? (
                    <>
                      <Text style={[textStyles.label, { color: theme.text.primary, textAlign: 'right' }]}>
                        {balance.toFixed(8).replace(/\.?0+$/, '')} {coin.symbol}
                      </Text>
                      <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'right' }]}>
                        ≈ ₦{valueNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                      </Text>
                    </>
                  ) : (
                    <Text style={[textStyles.caption, { color: theme.text.muted }]}>No balance</Text>
                  )
                ) : (
                  <>
                    <Text style={[textStyles.label, { color: theme.text.primary, textAlign: 'right' }]}>
                      {priceNGN > 0
                        ? `₦${priceNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
                        : '—'}
                    </Text>
                    {typeof price?.change24h === 'number' && (
                      <Text style={[textStyles.caption, {
                        color: price.change24h >= 0 ? '#22C55E' : '#EF4444',
                        textAlign: 'right',
                      }]}>
                        {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
                      </Text>
                    )}
                  </>
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.text.muted} style={{ marginTop: spacing[1] }} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  topBar:  {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
  },
  backBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  list:      { padding: spacing[4], gap: spacing[3] },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.xl, padding: spacing[4],
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  cardRight: { alignItems: 'flex-end', gap: spacing[0.5] },
  logoWrap:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logo:      { width: 26, height: 26 },
});
