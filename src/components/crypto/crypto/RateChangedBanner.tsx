// Shows when the BTC/NGN rate shifts > 1% while the user has the sell screen open.
// User must tap "Accept" before they can confirm the transaction.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface RateChangedBannerProps {
  changePct:     number;    // e.g. 0.023 = 2.3%
  onAccept:      () => void;
  fromSymbol:    string;    // e.g. 'BTC'
  toSymbol:      string;    // e.g. '₦'
}

export function RateChangedBanner({
  changePct, onAccept, fromSymbol, toSymbol,
}: RateChangedBannerProps) {
  const { theme } = useTheme();
  const pct       = (changePct * 100).toFixed(2);
  const isDown    = changePct < 0;

  return (
    <View style={[
      styles.banner,
      { backgroundColor: theme.status.warning + '18', borderColor: theme.status.warning + '50' },
    ]}>
      <Ionicons
        name="warning-outline"
        size={18}
        color={theme.status.warning}
        style={styles.icon}
      />
      <View style={styles.text}>
        <Text style={[textStyles.label, { color: theme.status.warning }]}>
          Rate updated
        </Text>
        <Text style={[textStyles.caption, { color: theme.text.secondary }]}>
          {fromSymbol}/{toSymbol} moved {isDown ? '▼' : '▲'} {Math.abs(Number(pct))}% since you started.
          Your amount has been recalculated.
        </Text>
      </View>
      <TouchableOpacity
        onPress={onAccept}
        style={[styles.acceptBtn, { backgroundColor: theme.status.warning }]}
      >
        <Text style={[textStyles.labelSm, { color: '#000' }]}>Accept</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   radius.lg,
    borderWidth:    1,
    padding:        spacing[3],
    gap:            spacing[2],
    marginBottom:   spacing[4],
  },
  icon:      { flexShrink: 0 },
  text:      { flex: 1, gap: 2 },
  acceptBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1.5],
    borderRadius:      radius.full,
    flexShrink:        0,
  },
});