// app/(app)/kyc/bvn.tsx
// TIER_0 → TIER_1: BVN verification (admin-approved flow)
//
// Flow:
//   1. User enters BVN → POST /kyc/bvn/initiate
//   2. API saves BVN, returns { status: 'pending' }
//   3. Show submitted screen — admin reviews and approves in the dashboard
//   4. User can tap "Check Status" to see if admin has approved

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useRouter }      from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser }        from '@/store/slices/auth.slice';
import { kycApi }         from '@/api/kyc.api';
import { Input }          from '@/components/ui/Input';
import { Button }         from '@/components/ui/Button';
import { ErrorCard }      from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing, radius } from '@/theme';

type Step = 'entry' | 'submitted' | 'checking' | 'success';

export default function BvnScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const { user }  = useAppSelector(state => state.auth);

  const [bvn,     setBvn]     = useState('');
  const [step,    setStep]    = useState<Step>('entry');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function initiateBvn() {
    if (!/^\d{11}$/.test(bvn)) {
      setError('BVN must be exactly 11 digits');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await kycApi.initiateBvn(bvn);
      setStep('submitted');
    } catch (err: any) {
      setError(err?.message ?? 'BVN submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    setStep('checking');
    try {
      const result = await kycApi.checkBvnStatus();
      if ((result.status === 'verified' || result.tier === 'TIER_1') && user) {
        dispatch(setUser({ ...user, tier: 'TIER_1' }));
        setStep('success');
        setTimeout(() => router.replace('/(app)/kyc' as any), 2000);
      } else {
        setStep('submitted');
      }
    } catch {
      setStep('submitted');
    }
  }

  // ── Success ───────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={theme.status.success} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4], textAlign: 'center' }]}>
            BVN Verified!
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
            Your account has been upgraded to Tier 1.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Submitted / Checking ──────────────────────────────────────────────
  if (step === 'submitted' || step === 'checking') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.center}>
          <Ionicons name="time-outline" size={64} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4], textAlign: 'center' }]}>
            BVN Submitted
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
            Your BVN is being reviewed. You'll be notified once your account is upgraded to Tier 1.
            This usually takes a few hours.
          </Text>

          <Button
            label="Check Status"
            onPress={checkStatus}
            loading={step === 'checking'}
            disabled={step === 'checking'}
            style={{ marginTop: spacing[6] }}
          />

          <TouchableOpacity onPress={() => router.replace('/(app)/kyc' as any)} style={{ marginTop: spacing[3] }}>
            <Text style={[textStyles.label, { color: theme.text.muted }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Entry ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Ionicons name="card-outline" size={40} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[3] }]}>
            BVN Verification
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
            Verify your Bank Verification Number to unlock higher transfer limits.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="BVN (11 digits)"
            value={bvn}
            onChangeText={setBvn}
            keyboardType="numeric"
            maxLength={11}
            placeholder="Enter your BVN"
            secureTextEntry
          />

          {error ? <ErrorCard message={error} /> : null}

          <View style={[styles.infoBox, { backgroundColor: theme.bg.secondary }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme.text.muted} />
            <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1 }]}>
              Your BVN will be verified by our team. You'll receive a notification once your Tier 1 status is confirmed.
            </Text>
          </View>

          <Button
            label={loading ? 'Please wait...' : 'Submit BVN'}
            onPress={initiateBvn}
            loading={loading}
            disabled={loading || bvn.length !== 11}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  content: { padding: spacing[4], flexGrow: 1 },
  header:  { alignItems: 'center', marginBottom: spacing[6], marginTop: spacing[4] },
  form:    { gap: spacing[4] },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6] },
  infoBox: { flexDirection: 'row', gap: spacing[2], borderRadius: radius.xl, padding: spacing[3] },
});
