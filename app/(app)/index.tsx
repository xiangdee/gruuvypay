import React from 'react';
import {
  View, Text, TouchableOpacity,
  FlatList, RefreshControl, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { BalanceCard }        from '@/components/home/BalanceCard';
import { QuickActionBar }     from '@/components/home/QuickActionBar';
import { BillsRow }           from '@/components/home/BillsRow';
import { TransactionItem }    from '@/components/home/TransactionItem';
import { TransactionSkeleton } from '@/components/home/TransactionSkeleton';
import { EmptyTransactions }  from '@/components/home/EmptyTransactions';
import { useHomeLogic }       from '@/screens/app/useHome';
import { useTabBarHeight }    from '@/hooks/useTabBarHeight';

export default function HomeScreen() {
  const { theme }  = useTheme();
  const tabBarH    = useTabBarHeight();

  const {
    user, wallet, refreshing,
    onRefresh, loadMoreTransactions,
    handleToggleBalance,
    handleTransfer, handleTopUp, handleConvert, handleAnalytics,handleGetHelp, handleRewards,
    handleAirtime, handleData, handleElectricity, handleCable,
    handleBetting, handleAirtimeToCash,
    handleViewAllBills, handleTransactionPress,
    greeting,
  } = useHomeLogic();

  const hasTransactions = wallet.transactions.length > 0;
  const isLoadingFirst  = wallet.txLoading && !hasTransactions;
  const isLoadingMore   = wallet.txLoading && hasTransactions;

  const username = user?.username?.replace('@', '') ?? 'there';
  const initial  = username.slice(0, 1).toUpperCase();

  function renderHeader() {
    return (
      <View>
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.userRow}>
            <View style={[
              styles.avatar,
              { backgroundColor: theme.bg.card, borderColor: theme.border.DEFAULT },
            ]}>
              <Text style={[styles.avatarText, { color: theme.brand.accent }]}>{initial}</Text>
            </View>
            <View>
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                {greeting},
              </Text>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                {username}
              </Text>
            </View>
          </View>

          <View style={styles.topIcons}>
            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: theme.bg.card, borderColor: theme.border.DEFAULT,
                  flexDirection: 'row', alignItems: 'center', gap: spacing[2],
                },
              ]}
              onPress={handleGetHelp}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.text.primary} />

            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: theme.bg.card, borderColor: theme.border.DEFAULT,
                  width: 100,
                  flexDirection: 'row', alignItems: 'center', gap: spacing[2],
                },
              ]}
              onPress={handleRewards}
            >
              <Ionicons name="gift-outline" size={20} color={theme.text.primary} />
              <Text style={[textStyles.caption, { color: theme.text.primary }]}>Rewards</Text>
            </TouchableOpacity>
            
          </View>
        </View>

        {/* ── Balance card ── */}
        <View style={styles.cardWrap}>
          <BalanceCard
            balance={wallet.balance}
            visible={wallet.balanceVisible}
            onToggle={handleToggleBalance}
            currency="NGN"
          />
        </View>

        {/* ── Quick actions ── */}
        <QuickActionBar
          onTransfer={handleTransfer}
          onTopUp={handleTopUp}
          onConvert={handleConvert}
          onAnalytics={handleAnalytics}
        />

        {/* ── Bills ── */}
        <View style={styles.section}>
          <BillsRow
            onAirtime={handleAirtime}
            onData={handleData}
            onElectricity={handleElectricity}
            onCable={handleCable}
            onBetting={handleBetting}
            onAirtimeToCash={handleAirtimeToCash}
            onViewAll={handleViewAllBills}
          />
        </View>

        {/* ── Transactions header ── */}
        <View style={styles.sectionHeader}>
          <Text style={[textStyles.label, { color: theme.text.primary }]}>Transactions</Text>
        </View>

        {isLoadingFirst && (
          <View style={[styles.txContainer, { backgroundColor: theme.bg.secondary }]}>
            <TransactionSkeleton />
            <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
            <TransactionSkeleton />
            <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
            <TransactionSkeleton />
          </View>
        )}

        {!isLoadingFirst && !hasTransactions && (
          <EmptyTransactions onFundWallet={handleTopUp} />
        )}
      </View>
    );
  }

  function renderTransaction({ item, index }: { item: any; index: number }) {
    const isFirst = index === 0;
    const isLast  = index === wallet.transactions.length - 1;

    return (
      <View style={[
        styles.txItem,
        {
          backgroundColor: theme.bg.secondary,
          borderTopLeftRadius:     isFirst ? radius.xl : 0,
          borderTopRightRadius:    isFirst ? radius.xl : 0,
          borderBottomLeftRadius:  isLast  ? radius.xl : 0,
          borderBottomRightRadius: isLast  ? radius.xl : 0,
        },
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
            createdAt={item.created_at}
            metadata={item.metadata}
          />
        </TouchableOpacity>
        {!isLast && <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />}
      </View>
    );
  }

  function renderFooter() {
    if (!isLoadingMore) return <View style={{ height: tabBarH + 16 }} />;
    return (
      <View style={[styles.loadMore, { paddingBottom: tabBarH }]}>
        <ActivityIndicator size="small" color={theme.brand.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['left', 'right']}>
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
            tintColor={theme.brand.accent}
          />
        }
        style={[styles.list, { backgroundColor: theme.bg.primary }]}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { flex: 1 },

  topBar: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[12],
    paddingBottom:     spacing[3],
  },
  userRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
  },
  avatar: {
    width:        44,
    height:       44,
    borderRadius: radius.full,
    alignItems:   'center',
    justifyContent: 'center',
    borderWidth:  1,
  },
  avatarText: {
    fontSize:   18,
    fontWeight: '800',
  },
  topIcons: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  iconBtn: {
    width:          40,
    height:         40,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },

  cardWrap: {
    paddingHorizontal: spacing[4],
    marginBottom:      spacing[1],
  },

  section: {
    paddingHorizontal: spacing[4],
  },

  sectionHeader: {
    paddingHorizontal: spacing[5],
    paddingTop:        spacing[4],
    paddingBottom:     spacing[3],
  },

  txContainer: {
    marginHorizontal: spacing[4],
    borderRadius:     radius.xl,
    overflow:         'hidden',
    marginBottom:     spacing[4],
  },
  txItem: {
    marginHorizontal: spacing[4],
    paddingHorizontal: spacing[4],
  },
  divider: {
    height:     0.5,
    marginLeft: spacing[14],
  },
  loadMore: {
    paddingVertical: spacing[4],
    alignItems:      'center',
  },
});

