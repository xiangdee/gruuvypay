// app/(app)/transactions.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons }     from "@expo/vector-icons";
import { useRouter }    from "expo-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTransactions, fetchMoreTransactions } from "@/store/slices/wallet.slice";
import { useTheme, textStyles, spacing, radius } from "@/theme";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS:  "#22C55E",
  PENDING:  "#F59E0B",
  FAILED:   "#EF4444",
  REVERSED: "#8B5CF6",
};

const TYPE_ICONS: Record<string, string> = {
  DEPOSIT:    "arrow-down-circle",
  WITHDRAWAL: "arrow-up-circle",
  TRANSFER:   "swap-horizontal",
  FEE:        "remove-circle",
};

const FILTERS = ["All", "DEPOSIT", "WITHDRAWAL", "TRANSFER"];

export default function TransactionsScreen() {
  const { theme }   = useTheme();
  const router      = useRouter();
  const dispatch    = useAppDispatch();
  const { transactions, txLoading, txHasMore } = useAppSelector((s) => s.wallet);

  const [filter,     setFilter]     = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchTransactions({ type: filter === "All" ? undefined : filter }));
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTransactions({ type: filter === "All" ? undefined : filter }));
    setRefreshing(false);
  }, [filter]);

  const loadMore = useCallback(() => {
    if (!txLoading && txHasMore) {
      dispatch(fetchMoreTransactions({ type: filter === "All" ? undefined : filter }));
    }
  }, [txLoading, txHasMore, filter]);

  function renderItem({ item }: any) {
    const isCredit  = item.type === "DEPOSIT" || (item.type === "TRANSFER" && item.metadata?.direction === "credit");
    const iconColor = STATUS_COLORS[item.status] ?? theme.text.muted;
    const iconName  = TYPE_ICONS[item.type] ?? "ellipse";

    return (
      <TouchableOpacity
        style={[styles.txRow, { backgroundColor: theme.bg.secondary }]}
        onPress={() => router.push(`/(app)/transaction/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconColor + "15" }]}>
          <Ionicons name={iconName as any} size={22} color={iconColor} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[textStyles.label, { color: theme.text.primary }]} numberOfLines={1}>
            {item.narration ?? item.type}
          </Text>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>
            {new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[textStyles.label, { color: isCredit ? "#22C55E" : theme.text.primary }]}>
            {isCredit ? "+" : "-"}{item.amount}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: iconColor + "15" }]}>
            <Text style={[textStyles.caption, { color: iconColor, fontSize: 10 }]}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, {
              backgroundColor: filter === f ? theme.brand.primary : theme.bg.secondary,
            }]}
          >
            <Text style={[textStyles.caption, { color: filter === f ? "#fff" : theme.text.secondary }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        ListEmptyComponent={
          txLoading ? (
            <ActivityIndicator color={theme.brand.primary} style={{ marginTop: spacing[8] }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={theme.text.muted} />
              <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3] }]}>No transactions yet</Text>
            </View>
          )
        }
        ListFooterComponent={
          txLoading && transactions.length > 0
            ? <ActivityIndicator color={theme.brand.primary} style={{ padding: spacing[4] }} />
            : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing[4] },
  filterRow:  { flexDirection: "row", gap: spacing[2], paddingHorizontal: spacing[4], marginBottom: spacing[2] },
  filterBtn:  { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  list:       { padding: spacing[4] },
  txRow:      { flexDirection: "row", alignItems: "center", gap: spacing[3], borderRadius: radius.xl, padding: spacing[3] },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  txInfo:     { flex: 1 },
  txRight:    { alignItems: "flex-end", gap: spacing[1] },
  statusBadge:{ paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full },
  empty:      { alignItems: "center", paddingTop: spacing[12] },
});