import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { palette } from '@/theme/colors';

interface PortfolioCardProps {
  totalNGN:    string;
  hasHoldings: boolean;
  onSend:      () => void;
  onReceive:   () => void;
  onBuy:       () => void;
  onSell:      () => void;
}

export function PortfolioCard({
  totalNGN, hasHoldings,
  onSend, onReceive, onBuy, onSell,
}: PortfolioCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.brand.primary }]}>
      <Text style={[textStyles.labelSm, { color: palette.black, letterSpacing: 1 }]}>
        CRYPTO PORTFOLIO
      </Text>

      <Text style={[textStyles.display, { color: palette.white, marginVertical: spacing[2] }]}>
        {totalNGN}
      </Text>

      <View style={styles.actions}>
        <ActionBtn icon="arrow-up-outline"     label="Send"    onPress={onSend}    />
        <ActionBtn icon="arrow-down-outline"   label="Receive" onPress={onReceive} />
        <ActionBtn icon="add-circle-outline"   label="Buy"     onPress={onBuy}     />
        <ActionBtn icon="swap-horizontal"      label="Sell"    onPress={onSell}    />
      </View>
    </View>
  );
}

function ActionBtn({
  icon, label, onPress,
}: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionBtn} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
        <Ionicons name={icon} size={20} color={palette.black} />
      </View>
      <Text style={[textStyles.caption, { color: palette.black, marginTop: spacing[1] }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius:   radius['2xl'],
    padding:        spacing[5],
    marginBottom:   spacing[4],
  },
  actions: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      spacing[5],
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIcon: {
    width:          48,
    height:         48,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
});