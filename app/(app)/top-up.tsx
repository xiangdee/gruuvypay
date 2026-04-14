// app/(app)/top-up.tsx

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator,
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
    va, user, wallet,
    copied, refreshing, qrValue,
    copyAccountNumber, shareAccountDetails,
    onRefresh, loading,
  } = useTopUp();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[textStyles.h3, { color: theme.text.primary }]}>Top Up</Text>
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
          <Ionicons name="information-circle-outline" size={18} color={theme.brand.primary} />
          <Text style={[textStyles.bodySm, { color: theme.brand.primary, flex: 1 }]}>
            Transfer any amount to this account. Your wallet is credited instantly.
          </Text>
        </View>

        {/* Loading state */}
        {loading && !va && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
            <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3] }]}>
              Loading account details...
            </Text>
          </View>
        )}

        {/* Virtual Account Card */}
        {va && (
          <>
            <View style={[styles.accountCard, { backgroundColor: theme.brand.primary }]}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8 }]}>
                    BANK NAME
                  </Text>
                  <Text style={[textStyles.label, { color: '#fff', marginTop: 2 }]}>
                    {va.bankName}
                  </Text>
                </View>
                <View style={[styles.cardChip, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[textStyles.labelSm, { color: '#fff' }]}>NGN</Text>
                </View>
              </View>

              {/* Account number — big and prominent */}
              <View style={styles.accountNumberWrap}>
                <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8 }]}>
                  ACCOUNT NUMBER
                </Text>
                <Text style={[styles.accountNumber, { color: '#fff' }]}>
                  {va.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
                </Text>
              </View>

              {/* Account name */}
              <View>
                <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8 }]}>
                  ACCOUNT NAME
                </Text>
                <Text style={[textStyles.label, { color: '#fff', marginTop: 2 }]}>
                  {va.accountName}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              {/* Copy */}
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
                  size={22}
                  color={copied ? theme.status.success : theme.text.primary}
                />
                <Text style={[
                  textStyles.label,
                  { color: copied ? theme.status.success : theme.text.primary },
                ]}>
                  {copied ? 'Copied!' : 'Copy Number'}
                </Text>
              </TouchableOpacity>

              {/* Share */}
              <TouchableOpacity
                onPress={shareAccountDetails}
                style={[styles.actionBtn, { backgroundColor: theme.bg.secondary }]}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={22} color={theme.text.primary} />
                <Text style={[textStyles.label, { color: theme.text.primary }]}>
                  Share Details
                </Text>
              </TouchableOpacity>

              {/* QR Toggle */}
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
                  size={22}
                  color={showQR ? theme.brand.primary : theme.text.primary}
                />
                <Text style={[
                  textStyles.label,
                  { color: showQR ? theme.brand.primary : theme.text.primary },
                ]}>
                  QR Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* QR Code */}
            {showQR && (
              <View style={[styles.qrCard, { backgroundColor: '#fff' }]}>
                <QRCode
                  value={qrValue}
                  size={200}
                  color="#000"
                  backgroundColor="#fff"
                />
                <Text style={[textStyles.caption, { color: '#666', marginTop: spacing[3], textAlign: 'center' }]}>
                  Scan to get account details
                </Text>
              </View>
            )}

            {/* How it works */}
            <View style={[styles.howItWorks, { backgroundColor: theme.bg.secondary }]}>
              <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[3] }]}>
                How to fund your wallet
              </Text>
              {[
                { icon: 'phone-portrait-outline', text: 'Open your bank app or USSD' },
                { icon: 'arrow-forward-outline',  text: `Transfer to ${va.bankName}` },
                { icon: 'keypad-outline',          text: `Account: ${va.accountNumber}` },
                { icon: 'flash-outline',           text: 'Wallet credited instantly after transfer' },
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: theme.brand.primary + '20' }]}>
                    <Text style={[textStyles.labelSm, { color: theme.brand.primary }]}>{i + 1}</Text>
                  </View>
                  <Ionicons name={step.icon as any} size={16} color={theme.text.muted} />
                  <Text style={[textStyles.body, { color: theme.text.secondary, flex: 1 }]}>
                    {step.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Limits note */}
            <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center', marginTop: spacing[4] }]}>
              No limit on incoming transfers. Verify your BVN to increase outgoing limits.
            </Text>
          </>
        )}

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[4],
  },
  backBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4] },

  infoBanner: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            spacing[2],
    borderRadius:   radius.lg,
    borderWidth:    1,
    padding:        spacing[3],
    marginBottom:   spacing[4],
  },

  loadingWrap: { alignItems: 'center', paddingTop: spacing[16] },

  accountCard: {
    borderRadius:  radius['2xl'],
    padding:       spacing[5],
    gap:           spacing[4],
    marginBottom:  spacing[4],
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  cardChip: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1],
    borderRadius:      radius.full,
  },
  accountNumberWrap: { gap: spacing[1] },
  accountNumber: {
    fontSize:      32,
    fontWeight:    '800',
    letterSpacing:  6,
    marginTop:     spacing[1],
  },

  actions: {
    flexDirection: 'row',
    gap:           spacing[2],
    marginBottom:  spacing[4],
  },
  actionBtn: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[1.5],
    borderRadius:   radius.xl,
    paddingVertical: spacing[3.5],
  },

  qrCard: {
    alignItems:    'center',
    borderRadius:  radius['2xl'],
    padding:       spacing[6],
    marginBottom:  spacing[4],
  },

  howItWorks: {
    borderRadius:  radius.xl,
    padding:       spacing[4],
    marginBottom:  spacing[3],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
    marginBottom:  spacing[3],
  },
  stepNum: {
    width:          24,
    height:         24,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
});