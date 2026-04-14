// app/(app)/index.tsx
// Home screen: wallet header + bills + FULL paginated transaction history
// Crypto lives entirely on its own tab — zero crypto here

import React from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, RefreshControl, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { palette }              from '@/theme/colors';
import { BalanceCard }          from '@/components/home/BalanceCard';
import { QuickActionBar }       from '@/components/home/QuickActionBar';
import { BillsRow }             from '@/components/home/BillsRow';
import { TransactionItem }      from '@/components/home/TransactionItem';
import { TransactionSkeleton }  from '@/components/home/TransactionSkeleton';
import { EmptyTransactions }    from '@/components/home/EmptyTransactions';
import { useHomeLogic } from '@/screens/app/useHome';


// ─── Section header component ─────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <Text style={[
      textStyles.label,
      { color: theme.text.muted, marginBottom: spacing[3], marginTop: spacing[1] },
    ]}>
      {title}
    </Text>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();

  const {
    user, wallet, refreshing,
    onRefresh, loadMoreTransactions,
    handleToggleBalance,
    handleTransfer, handleTopUp, handleConvert, handleAnalytics,
    handleAirtime, handleData, handleBetting, handleAirtimeToCash,
    handleViewAllBills, handleTransactionPress,
    greeting,
  } = useHomeLogic();

  const hasTransactions = wallet.transactions.length > 0;
  const isLoadingFirst  = wallet.txLoading && !hasTransactions;
  const isLoadingMore   = wallet.txLoading && hasTransactions;

  // ─── FlatList data ──────────────────────────────────────────────────
  // Using FlatList instead of ScrollView for proper virtualization
  // Header contains the blue section + bills — rendered as ListHeaderComponent

  function renderHeader() {
    return (
      <>
        {/* Blue wallet section */}
        <View style={{ backgroundColor: theme.brand.primary }}>
          <BalanceCard
            balance={wallet.balance}
            visible={wallet.balanceVisible}
            loading={wallet.loading}
            onToggle={handleToggleBalance}
            username={user?.username ?? ''}
            greeting={greeting}
          />
          <QuickActionBar
            onTransfer={handleTransfer}
            onTopUp={handleTopUp}
            onConvert={handleConvert}
            onAnalytics={handleAnalytics}
          />
        </View>

        {/* Dark body starts here */}
        <View style={styles.body}>
          <BillsRow
            onAirtime={handleAirtime}
            onData={handleData}
            onBetting={handleBetting}
            onAirtimeToCash={handleAirtimeToCash}
            onViewAll={handleViewAllBills}
          />

          {/* Transactions section header */}
          <View style={[styles.txCard, { backgroundColor: theme.bg.secondary }]}>
            <SectionHeader title="TRANSACTIONS" />

            {/* Loading skeletons for first load */}
            {isLoadingFirst && (
              <>
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
              </>
            )}

            {/* Empty state */}
            {!isLoadingFirst && !hasTransactions && (
              <EmptyTransactions onFundWallet={handleTopUp} />
            )}
          </View>
        </View>
      </>
    );
  }

  function renderTransaction({ item, index }: { item: any; index: number }) {
    const isLast = index === wallet.transactions.length - 1;
    return (
      <View style={[
        styles.txItemWrap,
        { backgroundColor: theme.bg.secondary },
        isLast && styles.txItemLast,
      ]}>
        <TouchableOpacity
          onPress={() => handleTransactionPress(item.id)}
          activeOpacity={0.7}
        >
          <TransactionItem
            type={item.type}
            amount={item.amount}
            narration={item.narration}
            status={item.status}
            createdAt={item.createdAt}
            metadata={item.metadata}
          />
        </TouchableOpacity>
        {!isLast && (
          <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
        )}
      </View>
    );
  }

  function renderFooter() {
    if (!isLoadingMore) return <View style={styles.bottomPad} />;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={theme.brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.brand.primary }]}
      edges={['left', 'right']}
    >
      <FlatList
        data={hasTransactions ? wallet.transactions : []}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.white}
            progressViewOffset={0}
          />
        }
        style={{ backgroundColor: theme.bg.primary }}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  listContent: { flexGrow: 1 },

  body: {
    padding:              spacing[4],
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    marginTop:            -24,
  },

  txCard: {
    borderRadius:   radius.xl,
    paddingTop:     spacing[4],
    paddingBottom:  spacing[2],
    paddingHorizontal: spacing[4],
  },

  // Transaction items rendered by FlatList — continuation of txCard
  txItemWrap: {
    paddingHorizontal: spacing[4],
    marginHorizontal:  spacing[4],
  },
  txItemLast: {
    borderBottomLeftRadius:  radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingBottom:           spacing[2],
    marginBottom:            spacing[4],
  },
  divider: {
    height: 0.5,
    marginLeft: spacing[14], // aligns with text, not icon
  },

  loadMoreContainer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  bottomPad: { height: 100 },
});