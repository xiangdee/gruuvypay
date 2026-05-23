// app/(app)/analytics.tsx — Spending Analytics

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { walletApi } from '@/api/wallet.api';

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'this_month' | 'last_month';

interface Category {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  types: string[];
}

const CATEGORIES: Category[] = [
  { key: 'bills',     label: 'Bill Payments', icon: 'receipt-outline',        color: '#6366F1', types: ['BILL_PAYMENT', 'AIRTIME', 'DATA', 'ELECTRICITY', 'CABLE', 'BETTING', 'AIRTIME_TO_CASH'] },
  { key: 'transfers', label: 'Transfers',     icon: 'swap-horizontal-outline', color: '#F59E0B', types: ['SEND', 'TRANSFER', 'BANK_TRANSFER', 'DEBIT'] },
  { key: 'crypto',    label: 'Crypto',        icon: 'logo-bitcoin',            color: '#F7931A', types: ['CRYPTO_BUY', 'CRYPTO_SELL'] },
  { key: 'topup',     label: 'Top-ups',       icon: 'arrow-down-circle-outline', color: '#22C55E', types: ['DEPOSIT', 'CREDIT', 'RECEIVE', 'REFUND'] },
];

interface CategoryStat {
  category: Category;
  amountNaira: number;
  count: number;
  percent: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNaira(kobo: number | string): number {
  return Math.abs(Number(kobo)) / 100;
}

function formatNaira(n: number): string {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function periodRange(p: Period): { start: Date; end: Date } {
  const now = new Date();
  if (p === 'this_month') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
  };
}

function periodLabel(p: Period): string {
  const now = new Date();
  if (p === 'this_month') {
    return now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const router    = useRouter();

  const [period,     setPeriod]     = useState<Period>('this_month');
  const [txs,        setTxs]        = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      // Pull up to 200 recent transactions — enough for a monthly breakdown
      const res = await walletApi.getTransactions(1, 200);
      setTxs(Array.isArray(res) ? res : res?.data ?? res?.transactions ?? []);
    } catch {
      setTxs([]);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // ── Filter txs to selected period ──────────────────────────────────────
  const { start, end } = periodRange(period);
  const periodTxs = txs.filter((tx) => {
    const d = new Date(tx.createdAt);
    return d >= start && d <= end;
  });

  // ── Build category stats ────────────────────────────────────────────────
  const stats: CategoryStat[] = CATEGORIES.map((cat) => {
    const matching = periodTxs.filter((tx) =>
      cat.types.some((t) => tx.type?.toUpperCase().includes(t))
    );
    const amount = matching.reduce((sum, tx) => sum + toNaira(tx.amount ?? 0), 0);
    return { category: cat, amountNaira: amount, count: matching.length, percent: 0 };
  });

  const spending = stats.filter((s) => s.category.key !== 'topup');
  const totalSpend = spending.reduce((sum, s) => sum + s.amountNaira, 0);
  const totalIn    = stats.find((s) => s.category.key === 'topup')?.amountNaira ?? 0;

  // Attach percentages
  spending.forEach((s) => {
    s.percent = totalSpend > 0 ? (s.amountNaira / totalSpend) * 100 : 0;
  });

  const topCategory = [...spending].sort((a, b) => b.amountNaira - a.amountNaira)[0];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Analytics</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Period toggle */}
      <View style={[styles.toggle, { backgroundColor: theme.bg.secondary }]}>
        {(['this_month', 'last_month'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.toggleBtn, period === p && { backgroundColor: theme.bg.card }]}
          >
            <Text style={[textStyles.labelSm, { color: period === p ? theme.text.primary : theme.text.muted }]}>
              {p === 'this_month' ? 'This Month' : 'Last Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.primary} />
          }
        >
          <Text style={[textStyles.caption, { color: theme.text.muted, marginBottom: spacing[3] }]}>
            {periodLabel(period)}
          </Text>

          {/* Summary row */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>Total Spent</Text>
              <Text style={[textStyles.h3, { color: theme.text.primary, marginTop: spacing[1] }]}>
                {formatNaira(totalSpend)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>Total In</Text>
              <Text style={[textStyles.h3, { color: theme.status.success, marginTop: spacing[1] }]}>
                {formatNaira(totalIn)}
              </Text>
            </View>
          </View>

          {/* Top category banner */}
          {topCategory && topCategory.amountNaira > 0 && (
            <View style={[styles.topBanner, { backgroundColor: topCategory.category.color + '15', borderColor: topCategory.category.color + '30' }]}>
              <View style={[styles.topBannerIcon, { backgroundColor: topCategory.category.color + '20' }]}>
                <Ionicons name={topCategory.category.icon as any} size={20} color={topCategory.category.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>Biggest spend</Text>
                <Text style={[textStyles.label, { color: theme.text.primary }]}>
                  {topCategory.category.label} — {formatNaira(topCategory.amountNaira)}
                </Text>
              </View>
            </View>
          )}

          {/* Category breakdown */}
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[3], marginTop: spacing[2] }]}>
            Breakdown
          </Text>

          <View style={[styles.breakdownCard, { backgroundColor: theme.bg.secondary }]}>
            {CATEGORIES.map((cat, idx) => {
              const s = stats.find((x) => x.category.key === cat.key)!;
              const isLast = idx === CATEGORIES.length - 1;
              return (
                <React.Fragment key={cat.key}>
                  <View style={styles.breakdownRow}>
                    <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                    </View>

                    <View style={styles.catInfo}>
                      <View style={styles.catHeader}>
                        <Text style={[textStyles.label, { color: theme.text.primary }]}>{cat.label}</Text>
                        <Text style={[textStyles.label, { color: theme.text.primary }]}>
                          {formatNaira(s.amountNaira)}
                        </Text>
                      </View>

                      <View style={styles.catMeta}>
                        <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                          {s.count} transaction{s.count !== 1 ? 's' : ''}
                        </Text>
                        {s.percent > 0 && (
                          <Text style={[textStyles.caption, { color: cat.color }]}>
                            {s.percent.toFixed(0)}%
                          </Text>
                        )}
                      </View>

                      {/* Progress bar */}
                      {s.percent > 0 && (
                        <View style={[styles.barBg, { backgroundColor: theme.border.DEFAULT }]}>
                          <View style={[styles.barFill, { width: `${Math.min(s.percent, 100)}%`, backgroundColor: cat.color }]} />
                        </View>
                      )}
                    </View>
                  </View>
                  {!isLast && <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />}
                </React.Fragment>
              );
            })}
          </View>

          {/* Empty state */}
          {periodTxs.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: theme.bg.secondary }]}>
              <Ionicons name="bar-chart-outline" size={40} color={theme.text.muted} />
              <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3], textAlign: 'center' }]}>
                No transactions found for {periodLabel(period)}.
              </Text>
            </View>
          )}

          <View style={{ height: spacing[10] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
  },
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },

  toggle: {
    flexDirection: 'row', marginHorizontal: spacing[4],
    borderRadius: radius.lg, padding: 3, marginBottom: spacing[4],
  },
  toggleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing[2],
    borderRadius: radius.md,
  },

  content: { paddingHorizontal: spacing[4] },

  summaryRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] },
  summaryCard: { flex: 1, borderRadius: radius.xl, padding: spacing[4] },

  topBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderRadius: radius.xl, borderWidth: 1,
    padding: spacing[3], marginBottom: spacing[4],
  },
  topBannerIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },

  breakdownCard: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing[4] },
  breakdownRow:  { flexDirection: 'row', gap: spacing[3], padding: spacing[4], alignItems: 'flex-start' },
  catIcon:       { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  catInfo:       { flex: 1 },
  catHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catMeta:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  barBg:         { height: 4, borderRadius: 2, marginTop: spacing[2], overflow: 'hidden' },
  barFill:       { height: 4, borderRadius: 2 },
  divider:       { height: 0.5, marginHorizontal: spacing[4] },

  emptyCard: { borderRadius: radius.xl, padding: spacing[6], alignItems: 'center', marginTop: spacing[4] },
});
