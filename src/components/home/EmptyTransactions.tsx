// Matches screenshot 8 — "No transactions yet" with fund wallet CTA

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface EmptyTransactionsProps {
  onFundWallet: () => void;
}

export function EmptyTransactions({ onFundWallet }: EmptyTransactionsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.label, { color: theme.text.primary, textAlign: 'center' }]}>
        No transactions yet
      </Text>
      <Text style={[
        textStyles.bodySm,
        { color: theme.text.muted, textAlign: 'center', marginTop: spacing[2] },
      ]}>
        No transactions yet. Your activity will show up here once you make a transaction.
      </Text>
      <TouchableOpacity
        onPress={onFundWallet}
        style={[
          styles.fundBtn,
          { borderColor: theme.text.primary, borderWidth: 1.5 },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[textStyles.label, { color: theme.text.primary }]}>
          Start By Funding Your Wallet
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems:    'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
  },
  fundBtn: {
    marginTop:        spacing[5],
    paddingVertical:  spacing[3.5],
    paddingHorizontal: spacing[6],
    borderRadius:     radius['3xl'],
  },
});