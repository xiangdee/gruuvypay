import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { palette } from '@/theme/colors';

interface PortfolioCardProps {
  totalNGN:   string;
  totalUSD:   string;
  hasHoldings: boolean;
  onSend:     () => void;
  onReceive:  () => void;
  onBuy:      () => void;
}

export function PortfolioCard({
  totalNGN, totalUSD, hasHoldings,
  onSend, onReceive, onBuy,
}: PortfolioCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.brand.primary }]}>
      {/* Portfolio label */}
      <Text style={[textStyles.labelSm, { color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }]}>
        CRYPTO PORTFOLIO
      </Text>

      {/* Total value */}
      <Text style={[textStyles.display, { color: palette.white, marginVertical: spacing[2] }]}>
        {totalNGN}
      </Text>
      <Text style={[textStyles.body, { color: 'rgba(255,255,255,0.6)' }]}>
        ≈ {totalUSD}
      </Text>

      {/* Action buttons */}
      <View style={styles.actions}>
        <ActionBtn icon="arrow-up-outline"    label="Send"    onPress={onSend}    />
        <ActionBtn icon="arrow-down-outline"  label="Receive" onPress={onReceive} />
        <ActionBtn icon="add-circle-outline"  label="Buy"     onPress={onBuy}     />
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
        <Ionicons name={icon} size={20} color={palette.white} />
      </View>
      <Text style={[textStyles.caption, { color: palette.white, marginTop: spacing[1] }]}>
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
    gap:            spacing[6],
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