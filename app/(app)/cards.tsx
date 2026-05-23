// app/(app)/cards.tsx
// Virtual Cards — NGN and USD cards, coming soon

import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from "react-native";
import { SafeAreaView }  from "react-native-safe-area-context";
import { Ionicons }      from "@expo/vector-icons";
import { useTheme, textStyles, spacing, radius } from "@/theme";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";

const { width } = Dimensions.get("window");
const CARD_W    = width - spacing[8];

const FEATURES = [
  { icon: "globe-outline",            title: "Online Payments",    body: "Shop on any international or local website that accepts card payments." },
  { icon: "shield-checkmark-outline", title: "Secure & Disposable",body: "Freeze, unfreeze, or delete your card anytime from the app." },
  { icon: "flash-outline",            title: "Instant Issuance",   body: "Get your virtual card in seconds — no physical delivery needed." },
  { icon: "repeat-outline",           title: "Subscriptions",      body: "Netflix, Spotify, ChatGPT — manage all your recurring payments." },
];

export default function CardsScreen() {
  const { theme } = useTheme();
  const tabBarH   = useTabBarHeight();
  const [active, setActive] = useState<"ngn" | "usd">("ngn");
  const isNgn = active === "ngn";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarH + spacing[4] }]} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[textStyles.h2, { color: theme.text.primary }]}>Virtual Cards</Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[1] }]}>
            Pay anywhere online, securely
          </Text>
        </View>

        {/* Toggle */}
        <View style={[styles.toggle, { backgroundColor: theme.bg.secondary }]}>
          {(["ngn", "usd"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setActive(type)}
              style={[styles.toggleBtn, active === type && { backgroundColor: theme.bg.card }]}
            >
              <Text style={[textStyles.label, { color: active === type ? theme.text.primary : theme.text.muted }]}>
                {type === "ngn" ? "🇳🇬  NGN Card" : "🇺🇸  USD Card"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card visual */}
        <View style={[styles.card, { backgroundColor: isNgn ? "#1B4FD8" : "#111827" }]}>
          <View style={[styles.circle1, { backgroundColor: isNgn ? "rgba(255,255,255,0.08)" : "rgba(124,58,237,0.15)" }]} />
          <View style={[styles.circle2, { backgroundColor: isNgn ? "rgba(255,255,255,0.05)" : "rgba(124,58,237,0.08)" }]} />
          <View style={[styles.badge, { backgroundColor: isNgn ? "rgba(255,255,255,0.15)" : "rgba(124,58,237,0.35)" }]}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{isNgn ? `\u20A6 NGN` : "$ USD"}</Text>
          </View>
          <View style={styles.chip}>
            <View style={styles.chipLine} />
            <View style={[styles.chipLine, { marginTop: 5 }]} />
          </View>
          <Text style={styles.cardNum}>{'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}  {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}  {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}  {'\u2022'}{'\u2022'}{'\u2022'}{'\u2022'}</Text>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLbl}>CARD HOLDER</Text>
              <Text style={styles.cardVal}>Your Name Here</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.cardLbl}>EXPIRES</Text>
              <Text style={styles.cardVal}>{'\u2022'}{'\u2022'}/{'\u2022'}{'\u2022'}</Text>
            </View>
          </View>
        </View>

        {/* Coming soon */}
        <View style={[styles.soon, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
          <Ionicons name="time-outline" size={16} color={theme.brand.primary} />
          <Text style={[textStyles.label, { color: theme.brand.primary }]}>Coming Soon</Text>
          <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: "center", lineHeight: 18 }]}>
            Virtual cards are launching very soon. You will be notified when ready.
          </Text>
        </View>

        <Text style={[textStyles.h3, { color: theme.text.primary, marginTop: spacing[6], marginBottom: spacing[4] }]}>
          What you will get
        </Text>

        <View style={styles.grid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.feat, { backgroundColor: theme.bg.secondary }]}>
              <View style={[styles.featIcon, { backgroundColor: theme.bg.card }]}>
                <Ionicons name={f.icon as any} size={20} color={theme.brand.primary} />
              </View>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>{f.title}</Text>
              <Text style={[textStyles.caption, { color: theme.text.muted, lineHeight: 18 }]}>{f.body}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.cta, { backgroundColor: theme.brand.primary }]} activeOpacity={0.85}>
          <Ionicons name="notifications-outline" size={18} color="#fff" />
          <Text style={[textStyles.label, { color: "#fff" }]}>Notify Me When Available</Text>
        </TouchableOpacity>

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  content:    { padding: spacing[4] },
  header:     { marginBottom: spacing[5] },
  toggle:     { flexDirection: "row", borderRadius: radius.xl, padding: spacing[1], marginBottom: spacing[5] },
  toggleBtn:  { flex: 1, alignItems: "center", paddingVertical: spacing[3], borderRadius: radius.lg },
  card:       { width: CARD_W, height: 210, borderRadius: radius["2xl"], padding: spacing[5], marginBottom: spacing[4], overflow: "hidden", position: "relative" },
  circle1:    { position: "absolute", width: 220, height: 220, borderRadius: 110, right: -50, bottom: -70 },
  circle2:    { position: "absolute", width: 140, height: 140, borderRadius: 70, right: 80, bottom: -40 },
  badge:      { position: "absolute", top: spacing[4], right: spacing[4], paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full },
  chip:       { width: 42, height: 32, borderRadius: 6, backgroundColor: "#D4AF37", padding: 7, marginBottom: spacing[4], justifyContent: "center" },
  chipLine:   { height: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  cardNum:    { fontSize: 17, letterSpacing: 2, color: "rgba(255,255,255,0.7)", marginBottom: spacing[5], fontFamily: "monospace" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardLbl:    { fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 3, letterSpacing: 0.5 },
  cardVal:    { fontSize: 14, fontWeight: "600", color: "#fff" },
  soon:       { borderRadius: radius.xl, borderWidth: 1, padding: spacing[4], gap: spacing[1], alignItems: "center" },
  grid:       { flexDirection: "row", flexWrap: "wrap", gap: spacing[3], marginBottom: spacing[5] },
  feat:       { width: (CARD_W - spacing[3]) / 2, borderRadius: radius.xl, padding: spacing[4], gap: spacing[2] },
  featIcon:   { width: 44, height: 44, borderRadius: radius.xl, justifyContent: "center", alignItems: "center", marginBottom: spacing[1] },
  cta:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[4], borderRadius: radius.xl },
});