import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Share, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';

const STEPS = [
  {
    icon: 'share-social-outline' as const,
    title: 'Share your code',
    desc: 'Send your unique referral code or link to friends.',
  },
  {
    icon: 'person-add-outline' as const,
    title: 'Friend signs up',
    desc: 'They create a GruuvyPay account using your code.',
  },
  {
    icon: 'gift-outline' as const,
    title: 'Both earn rewards',
    desc: 'You and your friend each receive a bonus once they complete onboarding.',
  },
];

export default function RewardsScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const toast     = useToast();
  const user      = useAppSelector((s) => s.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralCode = user?.username?.replace('@', '') ?? '';
  const referralLink = `https://gruuvypay.app/join?ref=${referralCode}`;

  async function handleCopy() {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `Join me on GruuvyPay and get rewarded! Use my referral code: ${referralCode}\n\n${referralLink}`,
        title: 'Join GruuvyPay',
      });
    } catch {
      // user cancelled
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Rewards</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand.primary} />
        }
      >
        {/* Hero banner */}
        <View style={[styles.heroBanner, { backgroundColor: theme.brand.primary + '12', borderColor: theme.brand.primary + '25' }]}>
          <View style={[styles.heroIcon, { backgroundColor: theme.brand.primary + '20' }]}>
            <Ionicons name="gift" size={32} color={theme.brand.primary} />
          </View>
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[3] }]}>
            Refer & Earn
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Invite friends to GruuvyPay and earn rewards for every successful referral.
          </Text>
        </View>

        {/* Referral code card */}
        <View style={[styles.card, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8, marginBottom: spacing[3] }]}>
            YOUR REFERRAL CODE
          </Text>

          <View style={[styles.codeRow, { backgroundColor: theme.bg.input, borderColor: theme.border.DEFAULT }]}>
            <Text style={[textStyles.h3, { color: theme.brand.primary, letterSpacing: 2 }]}>
              {referralCode}
            </Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={22}
                color={copied ? theme.status.success : theme.text.muted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.actionBtn, { backgroundColor: theme.bg.card, borderColor: theme.border.DEFAULT }]}
            >
              <Ionicons name="copy-outline" size={18} color={theme.text.primary} />
              <Text style={[textStyles.labelSm, { color: theme.text.primary }]}>Copy Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: theme.brand.primary }]}
            >
              <Ionicons name="share-social-outline" size={18} color="#000" />
              <Text style={[textStyles.labelSm, { color: '#000' }]}>Share Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How it works */}
        <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[3] }]}>
          How it works
        </Text>

        <View style={[styles.card, { backgroundColor: theme.bg.secondary }]}>
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.title}>
              <View style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: theme.brand.primary + '20' }]}>
                  <Text style={[textStyles.label, { color: theme.brand.primary }]}>{idx + 1}</Text>
                </View>
                <View style={[styles.stepIcon, { backgroundColor: theme.bg.card }]}>
                  <Ionicons name={step.icon} size={20} color={theme.text.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.label, { color: theme.text.primary }]}>{step.title}</Text>
                  <Text style={[textStyles.bodySm, { color: theme.text.muted, marginTop: 2 }]}>{step.desc}</Text>
                </View>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Placeholder stats — will be populated once backend endpoint is available */}
        <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[3] }]}>
          Your Stats
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.bg.secondary }]}>
            <Ionicons name="people-outline" size={24} color={theme.brand.primary} />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[2] }]}>—</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[1] }]}>Referrals</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.bg.secondary }]}>
            <Ionicons name="wallet-outline" size={24} color={theme.status.success} />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[2] }]}>—</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[1] }]}>Rewards Earned</Text>
          </View>
        </View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
  },
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },

  content: { paddingHorizontal: spacing[4] },

  heroBanner: {
    alignItems: 'center', borderRadius: radius.xl,
    borderWidth: 1, padding: spacing[5], marginBottom: spacing[5],
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },

  card: { borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[5] },

  codeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.lg, borderWidth: 1,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  copyBtn: { padding: spacing[1] },

  actionRow: { flexDirection: 'row', gap: spacing[3] },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing[2],
    paddingVertical: spacing[3], borderRadius: radius.xl, borderWidth: 1,
  },
  primaryBtn: { borderWidth: 0 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  stepNum: {
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  stepIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 0.5, marginHorizontal: spacing[2] },

  statsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] },
  statCard: {
    flex: 1, borderRadius: radius.xl, padding: spacing[4],
    alignItems: 'center',
  },
});
