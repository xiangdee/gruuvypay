// app/(app)/convert.tsx — Currency conversion screen (NGN ↔ Crypto)
// Routes here from Quick Action bar "Convert" button

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, textStyles, spacing, radius } from '@/theme';

const OPTIONS = [
  {
    icon:        'logo-bitcoin' as const,
    title:       'Buy Crypto',
    description: 'Convert NGN to BTC, ETH, USDT and more',
    route:       '/(app)/crypto/buy' as const,
    color:       '#F7931A',
  },
  {
    icon:        'cash-outline' as const,
    title:       'Sell Crypto',
    description: 'Convert crypto back to NGN',
    route:       '/(app)/crypto/sell' as const,
    color:       '#22C55E',
  },
];

export default function ConvertScreen() {
  const { theme } = useTheme();
  const router    = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Convert</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Text style={[textStyles.body, { color: theme.text.secondary, marginBottom: spacing[6] }]}>
          Choose a conversion type:
        </Text>

        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.title}
            onPress={() => router.push(opt.route as any)}
            style={[styles.optionCard, { backgroundColor: theme.bg.secondary }]}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: opt.color + '20' }]}>
              <Ionicons name={opt.icon} size={28} color={opt.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>{opt.title}</Text>
              <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[0.5] }]}>
                {opt.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.text.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  backBtn:    { width: 36, alignItems: 'center', justifyContent: 'center' },
  content:    { paddingHorizontal: spacing[4], paddingTop: spacing[4] },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[3] },
  iconWrap:   { width: 52, height: 52, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
});
