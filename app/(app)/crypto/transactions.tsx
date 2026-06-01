// app/(app)/crypto/transactions.tsx
// All crypto transaction history (deposits + withdrawals across all coins)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons }     from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { cryptoApi }       from '@/api/crypto.api';
import { SUPPORTED_COINS } from '@/screens/app/crypto.logic';

const TX_STATE_COLOR: Record<string, string> = {
  accepted:  '#22C55E',
  submitted: '#F59E0B',
  failed:    '#EF4444',
  rejected:  '#EF4444',
};

function coinMeta(symbol: string) {
  return SUPPORTED_COINS.find((c) => c.symbol.toLowerCase() === symbol?.toLowerCase());
}

export default function CryptoTransactionsScreen() {
  const { theme }   = useTheme();
  const router      = useRouter();
  const { symbol }  = useLocalSearchParams<{ symbol?: string }>();

  const [txList,     setTxList]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const title = symbol
    ? `${symbol.toUpperCase()} Transactions`
    : 'Crypto Transactions';

  useEffect(() => {
    load();
  }, [symbol]);

  async function load() {
    setLoading(true);
    try {
      const data = await cryptoApi.getTransactions(symbol ?? undefined);
      setTxList(Array.isArray(data) ? data : []);
    } catch {
      setTxList([]);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [symbol]);

  function renderItem({ item: tx }: { item: any }) {
    const isDeposit  = tx.type === 'deposit' || tx.kind === 'deposit' || !!tx.txid;
    const icon       = isDeposit ? 'arrow-down-circle' : 'arrow-up-circle';
    const iconColor  = isDeposit ? '#22C55E' : '#EF4444';
    const stateColor = TX_STATE_COLOR[tx.state] ?? '#6B7280';
    const label      = isDeposit ? 'Received' : 'Sent';
    const currency   = (tx.currency ?? symbol ?? '').toUpperCase();
    const amount     = tx.amount ?? tx.volume ?? '—';
    const coin       = coinMeta(currency);
    const date       = tx.created_at
      ? new Date(tx.created_at).toLocaleDateString('en-NG', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      : '';

    return (
      <View style={[styles.row, { borderBottomColor: theme.border.DEFAULT }]}>
        {/* Coin logo with direction overlay */}
        <View style={styles.iconStack}>
          <View style={[styles.logoWrap, { backgroundColor: (coin?.color ?? '#888') + '18' }]}>
            {coin
              ? <Image source={{ uri: coin.logoUrl }} style={styles.logo} resizeMode="contain" />
              : <Text style={[textStyles.label, { color: theme.text.muted }]}>{currency.slice(0, 3)}</Text>
            }
          </View>
          <View style={[styles.dirBadge, { backgroundColor: iconColor }]}>
            <Ionicons name={icon as any} size={10} color="#fff" />
          </View>
        </View>

        {/* Label + date */}
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.label, { color: theme.text.primary }]}>
            {label} {currency}
          </Text>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>{date}</Text>
        </View>

        {/* Amount + status */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[textStyles.label, { color: isDeposit ? '#22C55E' : theme.text.primary }]}>
            {isDeposit ? '+' : '-'}{amount} {currency}
          </Text>
          <Text style={[textStyles.caption, { color: stateColor, textTransform: 'capitalize' }]}>
            {tx.state === 'submitted' && tx.payment_transaction?.confirmations != null
              ? `${tx.payment_transaction.confirmations}/${tx.payment_transaction.required_confirmations} confirmations`
              : tx.state ?? 'confirmed'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border.DEFAULT }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.brand.primary} style={{ marginTop: spacing[10] }} />
      ) : (
        <FlatList
          data={txList}
          keyExtractor={(item, i) => item.id ?? String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.brand.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="swap-horizontal-outline" size={48} color={theme.text.muted} />
              <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3] }]}>
                No crypto transactions yet
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    borderBottomWidth: 0.5,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  list:    { paddingHorizontal: spacing[4] },
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 0.5,
  },
  iconStack: { position: 'relative', width: 44, height: 44 },
  logoWrap: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  logo:     { width: 26, height: 26 },
  dirBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: spacing[16],
  },
});
