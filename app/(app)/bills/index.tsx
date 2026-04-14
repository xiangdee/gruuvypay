import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, textStyles, spacing, radius } from '@/theme';

const CATEGORIES = [
  { id: 'airtime',     label: 'Airtime',         icon: 'call-outline',            color: '#FFCC00', route: '/(app)/bills/airtime'     },
  { id: 'data',        label: 'Data',             icon: 'wifi-outline',            color: '#007A00', route: '/(app)/bills/data'         },
  { id: 'electricity', label: 'Electricity',      icon: 'flash-outline',           color: '#FF6600', route: '/(app)/bills/electricity'  },
  { id: 'cable',       label: 'Cable TV',         icon: 'tv-outline',              color: '#003087', route: '/(app)/bills/cable'        },
  { id: 'betting',     label: 'Betting',           icon: 'game-controller-outline', color: '#00AA00', route: '/(app)/bills/betting'          },
  { id: 'airtime-cash',label: 'Airtime to Cash',  icon: 'swap-horizontal-outline', color: '#6366F1', route: '/(app)/bills/airtime-to-cash'  },
];

export default function BillsIndexScreen() {
  const { theme } = useTheme();
  const router    = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Bills & Services</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => router.push(cat.route as any)}
              style={[styles.card, { backgroundColor: theme.bg.secondary }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon as any} size={28} color={cat.color} />
              </View>
              <Text style={[textStyles.label, { color: theme.text.primary, marginTop: spacing[2] }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content:  { padding: spacing[4] },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  card: {
    width: '47%',
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: 'center',
  },
  iconWrap: {
    width: 60, height: 60,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
});