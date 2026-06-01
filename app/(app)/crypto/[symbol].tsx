import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { SUPPORTED_COINS } from '@/screens/app/crypto.logic';
import { cryptoApi } from '@/api/crypto.api';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_H = 160;
const CHART_W = SCREEN_W - spacing[8] * 2;

function buildPath(values: number[]): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * CHART_W;
    const y = CHART_H - ((v - min) / range) * CHART_H;
    return `${x},${y}`;
  });
  return `M${pts.join(' L')}`;
}

const NGN_PER_USD = 1615;

const RANGE_CONFIG: Record<string, { points: number; volatility: number }> = {
  '1D': { points: 24,  volatility: 0.015 },
  '1W': { points: 48,  volatility: 0.012 },
  '1M': { points: 30,  volatility: 0.025 },
  '3M': { points: 90,  volatility: 0.022 },
  '1Y': { points: 52,  volatility: 0.035 },
};

function simulatePriceHistory(baseUSD: number, points: number, volatility: number): number[] {
  const pts: number[] = [baseUSD];
  for (let i = 1; i < points; i++) {
    const delta = (Math.random() - 0.48) * baseUSD * volatility;
    pts.push(Math.max(pts[i - 1] + delta, 0));
  }
  return pts;
}

const RANGES = ['1D', '1W', '1M', '3M', '1Y'] as const;
type Range = typeof RANGES[number];

// ─── Transaction row ──────────────────────────────────────────────────────────
const TX_STATE_COLOR: Record<string, string> = {
  accepted:  '#22C55E',
  submitted: '#F59E0B',
  failed:    '#EF4444',
  rejected:  '#EF4444',
};

function TxRow({ tx, symbol, theme }: { tx: any; symbol: string; theme: any }) {
  const isDeposit  = tx.type === 'deposit' || tx.kind === 'deposit' || !!tx.txid;
  const label      = isDeposit ? 'Received' : 'Sent';
  const icon       = isDeposit ? 'arrow-down-circle' : 'arrow-up-circle';
  const iconColor  = isDeposit ? '#22C55E' : '#EF4444';
  const stateColor = TX_STATE_COLOR[tx.state] ?? '#6B7280';
  const amount     = tx.amount ?? tx.volume ?? '—';
  const date       = tx.created_at
    ? new Date(tx.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <View style={[styles.txRow, { borderBottomColor: theme.border.DEFAULT }]}>
      <View style={[styles.txIcon, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.label, { color: theme.text.primary }]}>{label}</Text>
        <Text style={[textStyles.caption, { color: theme.text.muted }]}>{date}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[textStyles.label, { color: theme.text.primary }]}>
          {isDeposit ? '+' : '-'}{amount} {symbol}
        </Text>
        <Text style={[textStyles.caption, { color: stateColor, textTransform: 'capitalize' }]}>
          {tx.state ?? 'confirmed'}
        </Text>
      </View>
    </View>
  );
}

export default function CoinDetailScreen() {
  const { theme }    = useTheme();
  const router       = useRouter();
  const { symbol }   = useLocalSearchParams<{ symbol: string }>();

  const coin = SUPPORTED_COINS.find((c) => c.symbol === symbol);

  const [wallet,       setWallet]       = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [txList,       setTxList]       = useState<any[]>([]);
  const [txLoading,    setTxLoading]    = useState(true);
  const [range,        setRange]        = useState<Range>('1D');
  const [priceUSD,     setPriceUSD]     = useState<number>(0);
  const [change24h,    setChange24h]    = useState<number>(0);
  const [chartData,    setChartData]    = useState<number[]>([]);

  const rebuildChart = useCallback((base: number, r: Range) => {
    const cfg = RANGE_CONFIG[r];
    setChartData(simulatePriceHistory(base, cfg.points, cfg.volatility));
  }, []);

  const isUp       = chartData.length > 1 && chartData[chartData.length - 1] >= chartData[0];
  const chartColor = isUp ? '#22C55E' : '#EF4444';
  const linePath   = buildPath(chartData);
  const areaPath   = linePath ? linePath + ` L${CHART_W},${CHART_H} L0,${CHART_H} Z` : '';

  useEffect(() => {
    load();
    loadTxs();
  }, [symbol]);

  function onRangeChange(r: Range) {
    setRange(r);
    rebuildChart(priceUSD, r);
  }

  async function load() {
    if (!symbol) return;
    setLoading(true);
    try {
      const [pricesRes, walletRes] = await Promise.allSettled([
        cryptoApi.getAllPrices(),
        cryptoApi.getWallet(symbol),
      ]);

      let base = 0;
      if (pricesRes.status === 'fulfilled') {
        const p = pricesRes.value?.[symbol.toUpperCase()];
        if (p) {
          base = p.priceUSD as number;
          setPriceUSD(base);
          setChange24h(p.change24h ?? 0);
        }
      }

      if (walletRes.status === 'fulfilled') setWallet(walletRes.value);

      rebuildChart(base, '1D');
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }

  async function loadTxs() {
    if (!symbol) return;
    setTxLoading(true);
    try {
      const data = await cryptoApi.getTransactions(symbol);
      setTxList(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch {
      setTxList([]);
    } finally {
      setTxLoading(false);
    }
  }

  if (!coin) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <Text style={[textStyles.body, { color: theme.text.muted, textAlign: 'center', marginTop: spacing[10] }]}>
          Coin not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.coinTitle}>
            <View style={[styles.coinIcon, { backgroundColor: coin.color + '18' }]}>
              <Image
                source={{ uri: coin.logoUrl }}
                style={styles.coinLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[textStyles.h3, { color: theme.text.primary }]}>{coin.name}</Text>
              <Text style={[textStyles.caption, { color: theme.text.muted, fontWeight: '600' }]}>{coin.abbr}</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Price ──────────────────────────────────────────────────── */}
        <View style={styles.priceSection}>
          <Text style={[textStyles.h1, { color: theme.text.primary }]}>
            {priceUSD > 0
              ? `$${priceUSD.toLocaleString('en-US', { minimumFractionDigits: priceUSD < 1 ? 4 : 2, maximumFractionDigits: priceUSD < 1 ? 4 : 2 })}`
              : '—'}
          </Text>
          <View style={[styles.changeBadge, { backgroundColor: change24h >= 0 ? '#22C55E20' : '#EF444420' }]}>
            <Ionicons
              name={change24h >= 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={change24h >= 0 ? '#22C55E' : '#EF4444'}
            />
            <Text style={[textStyles.caption, { color: change24h >= 0 ? '#22C55E' : '#EF4444', fontWeight: '700' }]}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* ── Chart ──────────────────────────────────────────────────── */}
        <View style={styles.chartContainer}>
          <Svg width={CHART_W} height={CHART_H}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={chartColor} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#grad)" />
            <Path d={linePath} stroke={chartColor} strokeWidth={2} fill="none" />
          </Svg>

          <View style={styles.rangeRow}>
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => onRangeChange(r)}
                style={[
                  styles.rangeBtn,
                  range === r && { backgroundColor: theme.brand.primary },
                ]}
              >
                <Text style={[
                  textStyles.caption,
                  { color: range === r ? '#000' : theme.text.muted, fontWeight: '700' },
                ]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Holdings ───────────────────────────────────────────────── */}
        {loading ? (
          <ActivityIndicator color={theme.brand.primary} style={{ marginVertical: spacing[6] }} />
        ) : (
          <View style={[styles.holdingsCard, { backgroundColor: theme.bg.secondary }]}>
            <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
              YOUR HOLDINGS
            </Text>
            <View style={styles.holdingsRow}>
              <View>
                <Text style={[textStyles.h3, { color: theme.text.primary }]}>
                  {wallet?.balance ?? '0.00'} {coin.abbr}
                </Text>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                  ≈ ₦{((parseFloat(wallet?.balance ?? '0') * priceUSD * NGN_PER_USD)).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={[styles.addressBox, { backgroundColor: theme.bg.card }]}>
                <Text style={[textStyles.caption, { color: theme.text.muted }]} numberOfLines={1}>
                  {wallet?.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-4)}` : 'No address'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Actions ────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <ActionBtn
            icon="arrow-up-circle-outline"
            label="Buy"
            color={theme.brand.primary}
            onPress={() => router.push({ pathname: '/(app)/crypto/buy', params: { symbol } })}
            theme={theme}
          />
          <ActionBtn
            icon="arrow-down-circle-outline"
            label="Sell"
            color="#EF4444"
            onPress={() => router.push({ pathname: '/(app)/crypto/sell', params: { symbol } })}
            theme={theme}
          />
          <ActionBtn
            icon="paper-plane-outline"
            label="Send"
            color="#F59E0B"
            onPress={() => router.push({ pathname: '/(app)/crypto/send', params: { symbol } })}
            theme={theme}
          />
          <ActionBtn
            icon="qr-code-outline"
            label="Receive"
            color="#6366F1"
            onPress={() => router.push({ pathname: '/(app)/crypto/receive', params: { symbol } })}
            theme={theme}
          />
        </View>

        {/* ── Transactions ───────────────────────────────────────────── */}
        <View style={[styles.txCard, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, marginBottom: spacing[3] }]}>
            {coin.abbr} TRANSACTIONS
          </Text>
          {txLoading ? (
            <ActivityIndicator color={theme.brand.primary} />
          ) : txList.length === 0 ? (
            <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center', paddingVertical: spacing[4] }]}>
              No {coin.abbr} transactions yet
            </Text>
          ) : (
            txList.map((tx, i) => (
              <TxRow key={tx.id ?? i} tx={tx} symbol={coin.abbr} theme={theme} />
            ))
          )}
        </View>

        {/* ── About ──────────────────────────────────────────────────── */}
        <View style={[styles.aboutCard, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, marginBottom: spacing[2] }]}>
            ABOUT {coin.name.toUpperCase()}
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, lineHeight: 22 }]}>
            {getAbout(coin.symbol)}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ActionBtn({ icon, label, color, onPress, theme }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn}>
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[textStyles.caption, { color: theme.text.secondary, marginTop: spacing[1] }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getAbout(symbol: string): string {
  const map: Record<string, string> = {
    BTC:  'Bitcoin is the first decentralised cryptocurrency, created in 2009. It operates on a peer-to-peer network and is widely regarded as digital gold.',
    ETH:  'Ethereum is a programmable blockchain that powers decentralised applications and smart contracts. ETH is its native currency.',
    USDT: 'Tether (USDT) is a stablecoin pegged 1:1 to the US Dollar, making it ideal for preserving value and facilitating cross-border transfers.',
    SOL:  'Solana is a high-performance blockchain supporting thousands of transactions per second at low cost, powering DeFi and NFT ecosystems.',
    LTC:  'Litecoin is a peer-to-peer cryptocurrency based on Bitcoin with faster block times and a different hashing algorithm (Scrypt).',
    XRP:  'XRP is the native digital asset of the XRP Ledger, designed for fast and low-cost international money transfers.',
  };
  return map[symbol] ?? 'A digital asset available on GruuvyPay.';
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
  },
  backBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  coinTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  coinIcon: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  coinLogo: { width: 28, height: 28 },

  priceSection: {
    paddingHorizontal: spacing[5], paddingVertical: spacing[2],
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
  },
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[1],
    paddingHorizontal: spacing[2], paddingVertical: spacing[1],
    borderRadius: radius.full,
  },

  chartContainer: { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  rangeRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: spacing[1], marginTop: spacing[3],
  },
  rangeBtn: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },

  holdingsCard: {
    marginHorizontal: spacing[4], borderRadius: radius.xl,
    padding: spacing[4], gap: spacing[3], marginBottom: spacing[4],
  },
  holdingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  addressBox: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[1.5],
    borderRadius: radius.full, maxWidth: 140,
  },

  actions: {
    flexDirection: 'row', justifyContent: 'center',
    gap: spacing[6], paddingHorizontal: spacing[4], marginBottom: spacing[4],
  },
  actionBtn:  { alignItems: 'center', gap: spacing[1] },
  actionIcon: {
    width: 56, height: 56, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },

  txCard: {
    marginHorizontal: spacing[4], borderRadius: radius.xl,
    padding: spacing[4], marginBottom: spacing[4],
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 0.5,
  },
  txIcon: {
    width: 38, height: 38, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },

  aboutCard: {
    marginHorizontal: spacing[4], borderRadius: radius.xl,
    padding: spacing[4], marginBottom: spacing[10],
  },
});
