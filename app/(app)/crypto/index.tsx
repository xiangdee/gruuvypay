// app/(app)/crypto.tsx
// Full crypto experience — portfolio, live prices, buy/sell
// This tab owns everything crypto — home screen has zero crypto content

import React, { useEffect } from 'react';
import {
  View, Text, FlatList,
  RefreshControl, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { PortfolioCard } from '@/components/crypto/PortfolioCard';
import { CoinRow }       from '@/components/crypto/CoinRow';
import { TransactionSkeleton } from '@/components/home/TransactionSkeleton';
import { useCryptoLogic, SUPPORTED_COINS } from '@/screens/app/crypto.logic';
import { useRouter } from 'expo-router';



export default function CryptoScreen() {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const tabBarH   = useTabBarHeight();

  const router = useRouter();
  const {
    prices, holdings, portfolio,
    refreshing, pricesLoading, hasHoldings,
    onRefresh, loadAll,
    handleBuy, handleSell, handleCoinDetail,
    handleSend, handleReceive,
  } = useCryptoLogic();

  useEffect(() => { loadAll(); }, []);

  // ─── Header — portfolio card + section labels ────────────────────────
  function renderHeader() {
    return (
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        {/* Page title */}
        <View style={styles.titleRow}>
          <Text style={[textStyles.h2, { color: theme.text.primary }]}>
            Crypto
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/crypto/transactions' as any)}
            style={[styles.historyBtn, { backgroundColor: theme.bg.card }]}
          >
            <Ionicons name="time-outline" size={18} color={theme.text.secondary} />
            <Text style={[textStyles.labelSm, { color: theme.text.secondary }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Portfolio card */}
        <PortfolioCard
          totalNGN={portfolio.totalNGN}
          hasHoldings={hasHoldings}
          onSend={() => handleSend()}
          onReceive={() => handleReceive()}
          onBuy={() => handleBuy()}
          onSell={() => handleSell()}
        />

        {/* My Holdings section — only shown if user has crypto */}
        {hasHoldings && (
          <View style={[styles.section, { backgroundColor: theme.bg.secondary }]}>
            <Text style={[textStyles.label, { color: theme.text.muted, marginBottom: spacing[3] }]}>
              MY HOLDINGS
            </Text>
            {holdings.map((h) => (
              <View key={h.symbol} style={styles.holdingRow}>
                <Text style={[textStyles.label, { color: theme.text.primary }]}>
                  {h.symbol}
                </Text>
                <View style={styles.holdingValues}>
                  <Text style={[textStyles.label, { color: theme.text.primary }]}>
                    {h.balance}
                  </Text>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                    {h.valueNGN}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Market prices label */}
        <Text style={[textStyles.label, { color: theme.text.muted, marginBottom: spacing[3] }]}>
          MARKET PRICES
        </Text>
      </View>
    );
  }

  // ─── Coin price rows ─────────────────────────────────────────────────
  function renderCoin({ item: coin }: { item: typeof SUPPORTED_COINS[number] }) {
    const price = prices[coin.symbol];

    if (pricesLoading || !price) {
      return <TransactionSkeleton />;
    }

    return (
      <CoinRow
        price={price}
        onPress={() => handleCoinDetail(coin.symbol)}
        onBuy={() => handleBuy(coin.symbol)}
      />
    );
  }

  function renderSeparator() {
    return (
      <View style={[styles.separator, { backgroundColor: theme.border.DEFAULT }]} />
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <FlatList
        data={[...SUPPORTED_COINS]}
        keyExtractor={(item) => item.symbol}
        renderItem={renderCoin}
        ItemSeparatorComponent={renderSeparator}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={{ height: tabBarH + 16 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          { backgroundColor: theme.bg.primary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  content: { flexGrow: 1 },
  header: {
    paddingHorizontal: spacing[4],
    paddingBottom:     spacing[2],
  },
  titleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing[4],
  },
  historyBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1.5],
    borderRadius:     radius['3xl'],
  },
  section: {
    borderRadius:   radius.xl,
    padding:        spacing[4],
    marginBottom:   spacing[4],
  },
  holdingRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: spacing[2],
  },
  holdingValues: { alignItems: 'flex-end' },
  separator: {
    height:          0.5,
    marginLeft:      spacing[4] + 44 + spacing[3], // aligns under text
    marginRight:     spacing[4],
  },
});