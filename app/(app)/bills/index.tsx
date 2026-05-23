import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons }     from "@expo/vector-icons";
import { useRouter }    from "expo-router";
import { useTheme, textStyles, spacing, radius } from "@/theme";
import { S3Link } from "@/constants/links";

const CATEGORIES = [
  {
    id: "airtime", label: "Airtime", icon: "call-outline",
    color: "#22C55E", bg: "#F0FDF4", route: "/(app)/bills/airtime",
    logos: [
      S3Link +"/bill-providers/mtn.png",
       S3Link +"/bill-providers/airtel.png",
       S3Link +"/bill-providers/glo.png",
       S3Link +"/bill-providers/9mobile.png",
    ],
  },
  {
    id: "data", label: "Data", icon: "wifi-outline",
    color: "#3B82F6", bg: "#EFF6FF", route: "/(app)/bills/data",
    logos: [
       S3Link +"/bill-providers/mtn.png",
       S3Link +"/bill-providers/airtel.png",
       S3Link +"/bill-providers/glo.png",
       S3Link +"/bill-providers/9mobile.png",
    ],
  },
  { id: "electricity", label: "Electricity", icon: "flash-outline",    color: "#F59E0B", bg: "#FFFBEB", route: "/(app)/bills/electricity", logos: [] },
  { id: "cable",       label: "Cable TV",    icon: "tv-outline",        color: "#8B5CF6", bg: "#F5F3FF", route: "/(app)/bills/cable",       logos: [] },
  { id: "betting",     label: "Betting",     icon: "trophy-outline",    color: "#EC4899", bg: "#FDF2F8", route: "/(app)/bills/betting",     logos: [] },
  { id: "airtime-to-cash", label: "Airtime 2 Cash", icon: "swap-horizontal-outline", color: "#06B6D4", bg: "#ECFEFF", route: "/(app)/bills/airtime-to-cash", logos: [] },
];

export default function BillsHubScreen() {
  const { theme } = useTheme();
  const router    = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[textStyles.h2, { color: theme.text.primary }]}>Bill Payments</Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[1] }]}>
            Pay instantly with your GruuvyPay wallet
          </Text>
        </View>

        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.card, { backgroundColor: theme.bg.secondary }]}
              onPress={() => router.push(cat.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
                <Ionicons name={cat.icon as any} size={26} color={cat.color} />
              </View>
              <Text style={[textStyles.label, { color: theme.text.primary, marginTop: spacing[2] }]}>
                {cat.label}
              </Text>
              {cat.logos.length > 0 && (
                <View style={styles.logoRow}>
                  {cat.logos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.logo} resizeMode="contain" />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.tips, { backgroundColor: theme.bg.secondary }]}>
          {[
            { icon: "shield-checkmark-outline", text: "All payments are instant and secured" },
            { icon: "refresh-outline",          text: "Failed payments are automatically refunded" },
            { icon: "receipt-outline",          text: "Electricity tokens sent via push notification and email" },
          ].map((t, i) => (
            <View key={i} style={styles.tip}>
              <Ionicons name={t.icon as any} size={16} color={theme.brand.primary} />
              <Text style={[textStyles.caption, { color: theme.text.secondary, flex: 1, lineHeight: 18 }]}>{t.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  content:  { padding: spacing[4] },
  header:   { marginBottom: spacing[5] },
  grid:     { flexDirection: "row", flexWrap: "wrap", gap: spacing[3], marginBottom: spacing[5] },
  card:     { width: "47%", borderRadius: radius.xl, padding: spacing[4], gap: spacing[1] },
  iconWrap: { width: 52, height: 52, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  logoRow:  { flexDirection: "row", gap: spacing[1], marginTop: spacing[2], flexWrap: "wrap" },
  logo:     { width: 22, height: 22, borderRadius: 4, backgroundColor: "#f0f0f0" },
  tips:     { borderRadius: radius.xl, padding: spacing[4], gap: spacing[3] },
  tip:      { flexDirection: "row", alignItems: "flex-start", gap: spacing[2] },
});