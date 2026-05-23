// src/components/crypto/CoinRow.tsx

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import type { CoinPrice } from '@/screens/app/crypto.logic';
import { SUPPORTED_COINS } from '@/screens/app/crypto.logic';


interface CoinRowProps {
  price:    CoinPrice;
  onPress:  () => void;
  onBuy:    () => void;
}

export function CoinRow({ price, onPress, onBuy }: CoinRowProps) {
  const { theme } = useTheme();
  const coin = SUPPORTED_COINS.find((c) => c.symbol === price.symbol);
  if (!coin) return null;

  const isPositive  = price.change24h >= 0;
  const changeColor = isPositive ? theme.status.success : theme.status.error;
  const changeIcon  = isPositive ? 'trending-up' : 'trending-down';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.row}
      activeOpacity={0.7}
    >
      {/* Coin icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: coin.color + '20' }]}>
        <Text style={[styles.iconText, { color: coin.color }]}>
          {coin.icon}
        </Text>
      </View>

      {/* Name + 24h change */}
      <View style={styles.nameCol}>
        <Text style={[textStyles.label, { color: theme.text.primary }]}>
          {coin.name}
        </Text>
        <View style={styles.changeRow}>
          <Ionicons name={changeIcon as any} size={12} color={changeColor} />
          <Text style={[textStyles.caption, { color: changeColor }]}>
            {isPositive ? '+' : ''}{price.change24h.toFixed(2)}%
          </Text>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>
            24h
          </Text>
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceCol}>
        <Text style={[textStyles.label, { color: theme.text.primary, textAlign: 'right' }]}>
          {price.priceNGN}
        </Text>
        <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'right' }]}>
          {price.priceUSD}
        </Text>
      </View>

      {/* Buy button */}
      {/* <TouchableOpacity
        onPress={onBuy}
        style={[styles.buyBtn, { backgroundColor: theme.brand.primary + '20' }]}
      >
        <Text style={[textStyles.labelSm, { color: theme.brand.primary }]}>
          Buy
        </Text>
      </TouchableOpacity> */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[3],
    paddingVertical: spacing[3],
  },
  iconCircle: {
    width:          44,
    height:         44,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize:   18,
    fontWeight: '700',
  },
  nameCol:  { flex: 1 },
  changeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
    marginTop:     2,
  },
  priceCol: { alignItems: 'flex-end' },
  buyBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1.5],
    borderRadius:      radius.full,
  },
});