// src/components/crypto/CoinRow.tsx

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import type { CoinPrice } from '@/screens/app/crypto.logic';
import { SUPPORTED_COINS } from '@/screens/app/crypto.logic';


interface CoinRowProps {
  price:   CoinPrice;
  onPress: () => void;
  onBuy:   () => void;
}

export function CoinRow({ price, onPress }: CoinRowProps) {
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
      {/* Coin logo */}
      <View style={[styles.logoWrap, { backgroundColor: coin.color + '18' }]}>
        <Image
          source={{ uri: coin.logoUrl }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Name + symbol + 24h change */}
      <View style={styles.nameCol}>
        <Text style={[textStyles.label, { color: theme.text.primary }]}>
          {coin.name}
        </Text>
        <View style={styles.subtitleRow}>
          <Text style={[textStyles.caption, { color: theme.text.muted, fontWeight: '600' }]}>
            {coin.abbr}
          </Text>
          <Text style={[textStyles.caption, { color: theme.border.DEFAULT }]}>·</Text>
          <Ionicons name={changeIcon as any} size={11} color={changeColor} />
          <Text style={[textStyles.caption, { color: changeColor, fontWeight: '600' }]}>
            {isPositive ? '+' : ''}{price.change24h.toFixed(2)}%
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing[3],
    paddingVertical: spacing[3],
  },
  logoWrap: {
    width:          44,
    height:         44,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  logo: {
    width:  28,
    height: 28,
  },
  nameCol:     { flex: 1 },
  subtitleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[1],
    marginTop:     2,
  },
  priceCol: { alignItems: 'flex-end' },
});
