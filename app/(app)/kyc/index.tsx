// KYC hub — shows current tier and which upgrade step to take next

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { kycApi, KycStatus } from '@/api/kyc.api';

const STEPS = [
  {
    tier:    'TIER_0',
    label:   'Verify BVN',
    desc:    'Link your Bank Verification Number to unlock higher limits',
    icon:    'card-outline',
    color:   '#F59E0B',
    route:   '/(app)/kyc/bvn',
    unlocks: '₦200,000 per transaction',
  },
  {
    tier:    'TIER_1',
    label:   'Submit NIN + Utility Bill',
    desc:    'Upload your National ID and a recent utility bill',
    icon:    'document-text-outline',
    color:   '#6366F1',
    route:   '/(app)/kyc/nin',
    unlocks: '₦1,000,000 per transaction',
  },
  {
    tier:    'TIER_2',
    label:   'Verify Address',
    desc:    'Confirm your residential address with proof of residence',
    icon:    'home-outline',
    color:   '#1B4FD8',
    route:   '/(app)/kyc/address',
    unlocks: 'Unlimited transfers',
  },
];

export default function KycIndexScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const user       = useAppSelector((s) => s.auth.user);

  const [status,  setStatus]  = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kycApi.getStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentTier = user?.tier ?? 'TIER_0';

  function stepState(stepTier: string): 'complete' | 'active' | 'locked' {
    const tiers = ['TIER_0', 'TIER_1', 'TIER_2', 'TIER_3'];
    const current = tiers.indexOf(currentTier);
    const step    = tiers.indexOf(stepTier);
    if (current > step) return 'complete';
    if (current === step) return 'active';
    return 'locked';
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Upgrade Account</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.brand.primary} style={{ marginTop: spacing[10] }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current tier banner */}
          <View style={[styles.currentTier, { backgroundColor: theme.brand.primary }]}>
            <Text style={[textStyles.labelSm, { color: 'rgba(94, 84, 84, 0.7)', letterSpacing: 0.8 }]}>
              CURRENT TIER
            </Text>
            <Text style={[textStyles.h2, { color: '#000', marginTop: spacing[1] }]}>
              {currentTier.replace('_', ' ')}
            </Text>
            {currentTier === 'TIER_3' && (
              <Text style={[textStyles.body, { color: 'rgba(255,255,255,0.8)', marginTop: spacing[1] }]}>
                Maximum limits unlocked ✓
              </Text>
            )}
          </View>

          {/* Step cards */}
          {STEPS.map((step, i) => {
            const state = stepState(step.tier);
            return (
              <TouchableOpacity
                key={step.tier}
                onPress={() => state === 'active' && router.push(step.route as any)}
                style={[
                  styles.stepCard,
                  { backgroundColor: theme.bg.secondary },
                  state === 'active' && { borderColor: step.color, borderWidth: 1.5 },
                  state === 'locked' && { opacity: 0.5 },
                ]}
                activeOpacity={state === 'active' ? 0.7 : 1}
              >
                {/* Step number + icon */}
                <View style={[styles.stepIcon, { backgroundColor: step.color + '20' }]}>
                  {state === 'complete'
                    ? <Ionicons name="checkmark-circle" size={28} color={theme.status.success} />
                    : <Ionicons name={step.icon as any} size={28} color={step.color} />
                  }
                </View>

                {/* Step info */}
                <View style={styles.stepInfo}>
                  <View style={styles.stepTitleRow}>
                    <Text style={[textStyles.label, {
                      color: state === 'complete' ? theme.status.success : theme.text.primary,
                    }]}>
                      {step.label}
                    </Text>
                    {state === 'complete' && (
                      <View style={[styles.badge, { backgroundColor: theme.status.success + '20' }]}>
                        <Text style={[textStyles.labelSm, { color: theme.status.success }]}>Done</Text>
                      </View>
                    )}
                    {state === 'active' && (
                      <View style={[styles.badge, { backgroundColor: step.color + '20' }]}>
                        <Text style={[textStyles.labelSm, { color: step.color }]}>Next</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[textStyles.bodySm, { color: theme.text.secondary, marginTop: 2 }]}>
                    {step.desc}
                  </Text>
                  <Text style={[textStyles.caption, { color: step.color, marginTop: spacing[1] }]}>
                    Unlocks: {step.unlocks}
                  </Text>
                </View>

                {state === 'active' && (
                  <Ionicons name="chevron-forward" size={20} color={theme.text.muted} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* CBN note */}
          <View style={[styles.cbnNote, { backgroundColor: theme.bg.secondary }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.text.muted} />
            <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1 }]}>
              KYC requirements are mandated by the Central Bank of Nigeria (CBN). Your data is encrypted and stored securely.
            </Text>
          </View>

          <View style={{ height: spacing[8] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[4],
  },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content:   { padding: spacing[4], gap: spacing[3] },
  currentTier: {
    borderRadius:  radius['2xl'],
    padding:       spacing[5],
    marginBottom:  spacing[2],
  },
  stepCard: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[3],
    borderRadius:   radius.xl,
    padding:        spacing[4],
  },
  stepIcon: {
    width:          52,
    height:         52,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  stepInfo:     { flex: 1 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical:   2,
    borderRadius:      radius.full,
  },
  cbnNote: {
    flexDirection: 'row',
    gap:           spacing[2],
    borderRadius:  radius.xl,
    padding:       spacing[4],
    marginTop:     spacing[2],
  },
});