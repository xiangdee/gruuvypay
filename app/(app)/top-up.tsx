// app/(app)/top-up.tsx

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useTopUp } from '@/screens/app/useTopUp';

export default function TopUpScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const [showQR, setShowQR] = useState(false);

  const {
    va,
    copied, refreshing, qrValue,
    copyAccountNumber, shareAccountDetails,
    onRefresh, loading,
  } = useTopUp();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h4, { color: theme.text.primary }]}>Top Up</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand.primary}
          />
        }
      >
        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: theme.brand.primary + '15', borderColor: theme.brand.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.brand.primary} />
          <Text style={[textStyles.caption, { color: theme.brand.primary, flex: 1 }]}>
            Transfer any amount to this account. Your wallet is credited instantly.
          </Text>
        </View>

        {/* Loading state */}
        {loading && !va && (
          <View style={styles.loadingWrap}>
            <Text style={[textStyles.body, { color: theme.text.muted }]}>
              Loading account details...
            </Text>
          </View>
        )}

        {/* No virtual account — prompt BVN verification */}
        {!loading && !va && (
          <View style={styles.noVaWrap}>
            <View style={[styles.noVaIcon, { backgroundColor: theme.bg.secondary }]}>
              <Ionicons name="card-outline" size={40} color={theme.text.muted} />
            </View>
            <Text style={[textStyles.h4, { color: theme.text.primary, marginTop: spacing[3], textAlign: 'center' }]}>
              No Virtual Account Yet
            </Text>
            <Text style={[textStyles.bodySm, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[1] }]}>
              Complete BVN verification to get a dedicated bank account for instant wallet top-ups.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/kyc' as any)}
              style={[styles.kycBtn, { backgroundColor: theme.brand.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[textStyles.label, { color: '#000' }]}>Verify BVN to Continue</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {va && (
          <>
            {/* ── One-Time Account Card ──────────────────────────────────── */}
            <TouchableOpacity
              onPress={() => router.push('/(app)/one-time-account' as any)}
              style={[styles.oneTimeCard, { backgroundColor: theme.bg.secondary, borderColor: theme.brand.primary + '40' }]}
              activeOpacity={0.75}
            >
              <View style={[styles.oneTimeIconWrap, { backgroundColor: theme.brand.primary + '18' }]}>
                <Ionicons name="timer-outline" size={20} color={theme.brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.label, { color: theme.text.primary }]}>Generate One-Time Account</Text>
                <Text style={[textStyles.caption, { color: theme.text.muted }]}>For a specific deposit amount</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text.muted} />
            </TouchableOpacity>

            {/* ── Section Divider ────────────────────────────────────────── */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border.DEFAULT }]} />
              <Text style={[textStyles.caption, { color: theme.text.muted, paddingHorizontal: spacing[2] }]}>
                DEDICATED ACCOUNT
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border.DEFAULT }]} />
            </View>

            {/* ── Permanent Virtual Account Card ────────────────────────── */}
            <View style={[styles.accountCard, { backgroundColor: theme.brand.primary }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[textStyles.caption, { color: 'rgba(15, 8, 8, 0.6)', letterSpacing: 0.8 }]}>
                    BANK NAME
                  </Text>
                  <Text style={[textStyles.label, { color: '#000', marginTop: 2 }]}>
                    {va.bankName}
                  </Text>
                </View>
                <View style={[styles.cardChip, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[textStyles.labelSm, { color: '#000' }]}>NGN</Text>
                </View>
              </View>

              <View style={styles.accountNumberWrap}>
                <Text style={[textStyles.caption, { color: 'rgba(15, 8, 8, 0.6)', letterSpacing: 0.8 }]}>
                  ACCOUNT NUMBER
                </Text>
                <Text style={[styles.accountNumber, { color: '#000' }]}>
                  {va.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
                </Text>
              </View>

              <View>
                <Text style={[textStyles.caption, { color: 'rgba(15, 8, 8, 0.6)', letterSpacing: 0.8 }]}>
                  ACCOUNT NAME
                </Text>
                <Text style={[textStyles.label, { color: '#000', marginTop: 2 }]}>
                  {va.accountName}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={copyAccountNumber}
                style={[
                  styles.actionBtn,
                  { backgroundColor: copied ? theme.status.success + '20' : theme.bg.secondary },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle-outline' : 'copy-outline'}
                  size={20}
                  color={copied ? theme.status.success : theme.text.primary}
                />
                <Text style={[textStyles.labelSm, { color: copied ? theme.status.success : theme.text.primary }]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={shareAccountDetails}
                style={[styles.actionBtn, { backgroundColor: theme.bg.secondary }]}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={20} color={theme.text.primary} />
                <Text style={[textStyles.labelSm, { color: theme.text.primary }]}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowQR(!showQR)}
                style={[
                  styles.actionBtn,
                  { backgroundColor: showQR ? theme.brand.primary + '15' : theme.bg.secondary },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={20}
                  color={showQR ? theme.brand.primary : theme.text.primary}
                />
                <Text style={[textStyles.labelSm, { color: showQR ? theme.brand.primary : theme.text.primary }]}>
                  QR Code
                </Text>
              </TouchableOpacity>
            </View>

            {showQR && (
              <View style={[styles.qrCard, { backgroundColor: '#fff' }]}>
                <QRCode value={qrValue} size={160} color="#000" backgroundColor="#fff" />
                <Text style={[textStyles.caption, { color: '#666', marginTop: spacing[2], textAlign: 'center' }]}>
                  Scan to get account details
                </Text>
              </View>
            )}

            {/* How it works */}
            <View style={[styles.howItWorks, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
                How to fund your wallet
              </Text>
              {[
                { icon: 'phone-portrait-outline', text: 'Open your bank app or USSD' },
                { icon: 'arrow-forward-outline',  text: `Transfer to ${va.bankName}` },
                { icon: 'keypad-outline',          text: `Account: ${va.accountNumber}` },
                { icon: 'flash-outline',           text: 'Wallet credited instantly' },
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: theme.brand.primary + '20' }]}>
                    <Text style={[textStyles.labelSm, { color: theme.brand.primary }]}>{i + 1}</Text>
                  </View>
                  <Ionicons name={step.icon as any} size={14} color={theme.text.muted} />
                  <Text style={[textStyles.bodySm, { color: theme.text.secondary, flex: 1 }]}>
                    {step.text}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center', marginTop: spacing[3] }]}>
              No limit on incoming transfers. Verify your BVN to increase outgoing limits.
            </Text>
          </>
        )}

        <View style={{ height: spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  header:  {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[2],
  },
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4] },

  infoBanner: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing[2], borderRadius: radius.lg, borderWidth: 1,
    padding: spacing[2.5], marginBottom: spacing[3],
  },

  loadingWrap: { alignItems: 'center', paddingTop: spacing[12] },
  noVaWrap:   { alignItems: 'center', paddingTop: spacing[8], paddingHorizontal: spacing[4] },
  noVaIcon:   { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  kycBtn:     {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    borderRadius: radius.xl, paddingVertical: spacing[3], paddingHorizontal: spacing[5],
    marginTop: spacing[4],
  },

  // ─── One-time card ───────────────────────────────────────────────────
  oneTimeCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: radius.xl,
    paddingVertical: spacing[3], paddingHorizontal: spacing[3],
    gap: spacing[3], marginBottom: spacing[3],
  },
  oneTimeIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // ─── Divider ─────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing[3],
  },
  dividerLine: { flex: 1, height: 1 },

  // ─── Permanent VA card ───────────────────────────────────────────────
  accountCard: { borderRadius: radius['2xl'], padding: spacing[4], gap: spacing[3], marginBottom: spacing[3] },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardChip:    { paddingHorizontal: spacing[2.5], paddingVertical: spacing[0.5], borderRadius: radius.full },
  accountNumberWrap: { gap: spacing[1] },
  accountNumber: { fontSize: 26, fontWeight: '800', letterSpacing: 5, marginTop: spacing[0.5] },

  actions: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[3] },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing[1], borderRadius: radius.xl, paddingVertical: spacing[2.5],
  },

  qrCard: { alignItems: 'center', borderRadius: radius['2xl'], padding: spacing[4], marginBottom: spacing[3] },

  howItWorks: { borderRadius: radius.xl, padding: spacing[3], marginBottom: spacing[2] },
  stepRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  stepNum:    { width: 20, height: 20, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
