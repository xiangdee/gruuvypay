// Shimmer skeleton matching the dark placeholder cards in screenshot 8

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme, spacing, radius } from '@/theme';

function SkeletonBox({ width, height, style }: { width: number | string; height: number; style?: any }) {
  const { theme } = useTheme();
  const shimmer   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius.md, backgroundColor: theme.bg.card, opacity },
        style,
      ]}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <View style={styles.row}>
      <SkeletonBox width={44} height={44} style={{ borderRadius: 22 }} />
      <View style={styles.lines}>
        <SkeletonBox width={140} height={12} />
        <SkeletonBox width={90}  height={10} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={60} height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    paddingVertical: spacing[3],
  },
  lines: { flex: 1 },
});