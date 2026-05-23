import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProfileSubScreen, SettingSection } from '@/components/profile/ProfileSubScreen';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useAppSelector } from '@/store/hooks';

// CBN KYC tier progression
// TIER_0: Phone verified (after onboarding)
// TIER_1: BVN verification
// TIER_2: NIN + Utility Bill
// TIER_3: Address Verification

const TIER_DATA = {
  TIER_0: {
    label:      'Phone Verified',
    color:      '#F59E0B',
    balance:    '₦300,000',
    singleTx:  '₦5,000',
    dailyLimit: '₦50,000',
    nextTier:   'TIER_1',
    nextLabel:  'Verify BVN',
    nextDesc:   'Link your BVN to unlock ₦200,000 per transaction',
    nextRoute:  '/(app)/kyc/bvn',
  },
  TIER_1: {
    label:      'BVN Verified',
    color:      '#10B981',
    balance:    '₦2,000,000',
    singleTx:  '₦200,000',
    dailyLimit: '₦500,000',
    nextTier:   'TIER_2',
    nextLabel:  'Submit NIN + Utility Bill',
    nextDesc:   'Upload your NIN and a utility bill to unlock ₦1,000,000 per transaction',
    nextRoute:  '/(app)/kyc/nin',
  },
  TIER_2: {
    label:      'NIN + Utility Bill',
    color:      '#6366F1',
    balance:    '₦10,000,000',
    singleTx:  '₦1,000,000',
    dailyLimit: '₦5,000,000',
    nextTier:   'TIER_3',
    nextLabel:  'Verify Address',
    nextDesc:   'Submit proof of address to unlock unlimited transfers',
    nextRoute:  '/(app)/kyc/address',
  },
  TIER_3: {
    label:      'Address Verified',
    color:      '#1B4FD8',
    balance:    'Unlimited',
    singleTx:  'Unlimited',
    dailyLimit: 'Unlimited',
    nextTier:   null,
    nextLabel:  null,
    nextDesc:   null,
    nextRoute:  null,
  },
} as const;

function LimitRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.limitRow}>
      <Ionicons name={icon as any} size={16} color={theme.text.muted} />
      <Text style={[textStyles.body, { color: theme.text.secondary, flex: 1 }]}>{label}</Text>
      <Text style={[textStyles.label, { color: theme.text.primary }]}>{value}</Text>
    </View>
  );
}

export default function LimitsScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const user      = useAppSelector((s) => s.auth.user);
  const tier      = (user?.tier ?? 'TIER_0') as keyof typeof TIER_DATA;
  const data      = TIER_DATA[tier];

  return (
    <ProfileSubScreen title="Account Limits">

      {/* Current tier badge */}
      <View style={[styles.tierCard, { backgroundColor: data.color + '15', borderColor: data.color + '40', borderWidth: 1 }]}>
        <View style={styles.tierRow}>
          <View style={[styles.tierDot, { backgroundColor: data.color }]} />
          <Text style={[textStyles.h3, { color: data.color }]}>{data.label}</Text>
        </View>
        <Text style={[textStyles.bodySm, { color: theme.text.muted, marginTop: spacing[1] }]}>
          Your current account tier
        </Text>
      </View>

      {/* Current limits */}
      <SettingSection title="Your Current Limits">
        <LimitRow label="Max Wallet Balance" value={data.balance}    icon="wallet-outline"         />
        <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
        <LimitRow label="Per Transaction"    value={data.singleTx}  icon="arrow-up-outline"        />
        <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
        <LimitRow label="Daily Transfer"     value={data.dailyLimit} icon="calendar-outline"        />
      </SettingSection>

      {/* Upgrade prompt */}
      {data.nextLabel && (
        <TouchableOpacity
          style={[styles.upgradeCard, { backgroundColor: theme.brand.primary }]}
          onPress={() => router.push(data.nextRoute as any)}
          activeOpacity={0.85}
        >
          <View style={styles.upgradeContent}>
            <Ionicons name="arrow-up-circle-outline" size={28} color="#000" />
            <View style={styles.upgradeText}>
              <Text style={[textStyles.label, { color: '#000' }]}>{data.nextLabel}</Text>
              <Text style={[textStyles.bodySm, { color: 'rgba(0, 0, 0, 0.7)' }]}>
                {data.nextDesc}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(0, 0, 0, 0.7)" />
        </TouchableOpacity>
      )}

      {/* All tiers overview */}
      <SettingSection title="All Tiers">
        {Object.entries(TIER_DATA).map(([key, t]) => {
          const isCurrent = key === tier;
          return (
            <View
              key={key}
              style={[
                styles.tierOverviewRow,
                isCurrent && { backgroundColor: t.color + '10' },
              ]}
            >
              <View style={[styles.tierOverviewDot, { backgroundColor: t.color }]} />
              <View style={styles.tierOverviewInfo}>
                <Text style={[textStyles.label, { color: isCurrent ? t.color : theme.text.primary }]}>
                  {t.label} {isCurrent ? '(Current)' : ''}
                </Text>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                  Up to {t.balance} balance · {t.singleTx}/tx
                </Text>
              </View>
            </View>
          );
        })}
      </SettingSection>

    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  tierCard:    { borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[4] },
  tierRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  tierDot:     { width: 10, height: 10, borderRadius: 5 },
  divider:     { height: 0.5, marginHorizontal: spacing[4] },
  limitRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3.5] },
  upgradeCard: { borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[4], flexDirection: 'row', alignItems: 'center' },
  upgradeContent: { flex: 1, flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  upgradeText: { flex: 1, gap: spacing[0.5] },
  tierOverviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  tierOverviewDot: { width: 8, height: 8, borderRadius: 4 },
  tierOverviewInfo: { flex: 1 },
});