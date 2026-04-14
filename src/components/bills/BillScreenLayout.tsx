// Shared UI components reused across all bill screens

import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PinInput }   from '@/components/ui/PinInput';
import { Button }     from '@/components/ui/Button';
import { useTheme, textStyles, spacing, radius } from '@/theme';

// ─── Screen wrapper ────────────────────────────────────────────────────────
export function BillScreen({
  title, children, onBack,
}: { title: string; children: React.ReactNode; onBack?: () => void }) {
  const { theme } = useTheme();
  const router    = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={[styles.header]}>
        <TouchableOpacity
          onPress={onBack ?? (() => router.back())}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>{title}</Text>
        <View style={styles.backBtn} />
      </View>
      {children}
    </SafeAreaView>
  );
}

// ─── Provider selector grid ────────────────────────────────────────────────
export function ProviderGrid({
  providers, selected, onSelect,
}: {
  providers: { id: string; name: string; logo: string; color: string }[];
  selected:  string;
  onSelect:  (id: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.providerGrid}>
      {providers.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => onSelect(p.id)}
          style={[
            styles.providerChip,
            { backgroundColor: theme.bg.secondary },
            selected === p.id && { borderColor: p.color, borderWidth: 2, backgroundColor: p.color + '15' },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.providerLogo}>{p.logo}</Text>
          <Text style={[textStyles.caption, { color: theme.text.primary, textAlign: 'center' }]}>
            {p.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Variation selector (data bundles, cable plans) ───────────────────────
export function VariationList({
  variations, selected, onSelect, loading,
}: {
  variations: any[];
  selected:   string;
  onSelect:   (code: string, name: string, amount: number) => void;
  loading:    boolean;
}) {
  const { theme } = useTheme();

  if (loading) return (
    <ActivityIndicator color={theme.brand.primary} style={{ marginTop: spacing[4] }} />
  );

  return (
    <View style={styles.variationList}>
      {variations.map((v) => (
        <TouchableOpacity
          key={v.variation_code}
          onPress={() => onSelect(v.variation_code, v.name, parseFloat(v.variation_amount))}
          style={[
            styles.variationItem,
            { backgroundColor: theme.bg.secondary },
            selected === v.variation_code && {
              borderColor: theme.brand.primary,
              borderWidth: 1.5,
              backgroundColor: theme.brand.primary + '10',
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.variationInfo}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>{v.name}</Text>
            {v.validity && (
              <Text style={[textStyles.caption, { color: theme.text.muted }]}>{v.validity}</Text>
            )}
          </View>
          <Text style={[textStyles.label, { color: theme.brand.primary }]}>
            ₦{parseFloat(v.variation_amount).toLocaleString()}
          </Text>
          {selected === v.variation_code && (
            <Ionicons name="checkmark-circle" size={20} color={theme.brand.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Confirm summary card ──────────────────────────────────────────────────
export function ConfirmSummary({
  rows, onConfirm, onBack, loading,
}: {
  rows:      { label: string; value: string; highlight?: boolean }[];
  onConfirm: () => void;
  onBack:    () => void;
  loading?:  boolean;
}) {
  const { theme } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: spacing[4] }}>
      <View style={[styles.summaryCard, { backgroundColor: theme.bg.secondary }]}>
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            <View style={styles.summaryRow}>
              <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>{row.label}</Text>
              <Text style={[
                textStyles.label,
                {
                  color: row.highlight ? theme.brand.primary : theme.text.primary,
                  flexShrink: 1, textAlign: 'right',
                },
              ]}>
                {row.value}
              </Text>
            </View>
            {i < rows.length - 1 && (
              <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <View style={{ gap: spacing[3], marginTop: spacing[6] }}>
        <Button label="Enter PIN to Pay" onPress={onConfirm} loading={loading} />
        <Button label="Go Back"          onPress={onBack}    variant="ghost" />
      </View>
    </ScrollView>
  );
}

// ─── PIN step ──────────────────────────────────────────────────────────────
export function BillPinStep({
  onComplete, pinRef, loading, onBack,
}: {
  onComplete: (pin: string) => void;
  pinRef:     any;
  loading:    boolean;
  onBack:     () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.pinScreen, { flex: 1 }]}>
      <Text style={[textStyles.h2, { color: theme.text.primary, textAlign: 'center' }]}>
        Enter PIN
      </Text>
      <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2], marginBottom: spacing[10] }]}>
        Confirm your PIN to complete the payment
      </Text>
      {loading
        ? <ActivityIndicator size="large" color={theme.brand.primary} style={{ flex: 1 }} />
        : <PinInput onComplete={onComplete} onRef={(a) => { pinRef.current = a; }} style={{ flex: 1 }} />
      }
    </View>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────
export function BillSuccess({
  title, subtitle, token, reference,
  onPayAnother, onGoHome,
}: {
  title:       string;
  subtitle:    string;
  token?:      string | null;
  reference:   string;
  onPayAnother: () => void;
  onGoHome:    () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.successScreen, { flex: 1, padding: spacing[4] }]}>
      <View style={[styles.successIcon, { backgroundColor: theme.status.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.status.success} />
      </View>
      <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
        {title}
      </Text>
      <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
        {subtitle}
      </Text>
      {token && (
        <View style={[styles.tokenCard, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
            ELECTRICITY TOKEN
          </Text>
          <Text style={[textStyles.h3, { color: theme.brand.primary, letterSpacing: 2, marginTop: spacing[2] }]}>
            {token}
          </Text>
          <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[1] }]}>
            Enter this token on your meter
          </Text>
        </View>
      )}
      <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[4] }]}>
        Ref: {reference}
      </Text>
      <View style={styles.successActions}>
        <Button label="Pay Another"  onPress={onPayAnother} variant="secondary" />
        <Button label="Go to Home"   onPress={onGoHome}     variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  providerGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing[3], padding: spacing[4],
  },
  providerChip: {
    width: '22%', aspectRatio: 1,
    borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
    gap: spacing[1], padding: spacing[2],
  },
  providerLogo: { fontSize: 24 },

  variationList: { gap: spacing[2], padding: spacing[4] },
  variationItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing[3], borderRadius: radius.xl,
    padding: spacing[4],
  },
  variationInfo: { flex: 1 },

  summaryCard: {
    borderRadius: radius.xl, padding: spacing[4], gap: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: spacing[4],
  },
  divider: { height: 0.5 },

  pinScreen: { paddingHorizontal: spacing[4], paddingTop: spacing[6] },

  successScreen: { alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    width: 120, height: 120, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  tokenCard: {
    borderRadius: radius.xl, padding: spacing[5],
    alignItems: 'center', marginTop: spacing[6], width: '100%',
  },
  successActions: { width: '100%', gap: spacing[3], marginTop: spacing[8] },
});