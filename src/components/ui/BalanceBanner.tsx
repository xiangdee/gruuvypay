import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { useTheme, textStyles, spacing, radius } from '@/theme';

export function BalanceBanner() {
  const { theme }  = useTheme();
  const balanceRaw = useAppSelector((s) => s.wallet.balanceRaw);
  const naira      = ((balanceRaw ? parseInt(balanceRaw) : 0) / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={[styles.banner, { backgroundColor: theme.bg.secondary }]}>
      <Text style={[textStyles.caption, { color: theme.text.muted }]}>Available Balance</Text>
      <Text style={[textStyles.label, { color: theme.brand.primary }]}>₦{naira}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderRadius:   radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[2],
    marginBottom:   spacing[3],
  },
});
