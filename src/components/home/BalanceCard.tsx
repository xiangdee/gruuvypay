import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius, textStyles } from '@/theme';

const CARD_W = Dimensions.get('window').width - spacing[8];

interface BalanceCardProps {
  balance:   string | null;
  visible:   boolean;
  currency?: string;
  onToggle:  () => void;
}

export function BalanceCard({ balance, visible, currency = 'NGN', onToggle }: BalanceCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT },
    ]}>
      {/* Decorative glow circles */}
      <View style={[styles.circle1, { backgroundColor: theme.brand.accent }]} />
      <View style={[styles.circle2, { backgroundColor: theme.brand.accent }]} />

      {/* Top row: currency pill + eye toggle */}
      <View style={styles.topRow}>
        <View style={[styles.currencyPill, { backgroundColor: theme.bg.card }]}>
          <Text style={styles.flag}>🇳🇬</Text>
          <Text style={[textStyles.labelSm, { color: theme.text.primary }]}>{currency}</Text>
          <Ionicons name="chevron-down" size={12} color={theme.text.muted} />
        </View>
        <TouchableOpacity
          onPress={onToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.text.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Balance */}
      <Text style={[styles.balanceLabel, { color: theme.text.muted }]}>TOTAL BALANCE</Text>
      <Text style={[styles.balanceAmount, { color: theme.text.primary }]}>
        {visible ? (balance ?? '₦0.00') : '₦ ••••••'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width:         CARD_W,
    height:        180,
    borderRadius:  radius['2xl'],
    padding:       spacing[5],
    overflow:      'hidden',
    borderWidth:   1,
    shadowColor:   '#000',
    shadowOpacity: 0.12,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 6 },
    elevation:     6,
  },
  circle1: {
    position:     'absolute',
    width:        180,
    height:       180,
    borderRadius: 90,
    opacity:      0.08,
    top:          -60,
    right:        -40,
  },
  circle2: {
    position:     'absolute',
    width:        120,
    height:       120,
    borderRadius: 60,
    opacity:      0.05,
    bottom:       -40,
    left:         20,
  },
  topRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing[5],
  },
  currencyPill: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical:  spacing[1],
    borderRadius:     radius.full,
  },
  flag:         { fontSize: 14 },
  balanceLabel: {
    ...textStyles.labelSm,
    letterSpacing: 1.5,
    marginBottom:  spacing[1],
  },
  balanceAmount: {
    fontSize:      34,
    fontWeight:    '800',
    letterSpacing: -0.5,
  },
});
