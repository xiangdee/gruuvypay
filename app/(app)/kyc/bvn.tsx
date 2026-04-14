// TIER_0 → TIER_1: BVN verification via Fincra

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/auth.slice';
import { kycApi } from '@/api/kyc.api';
import { Input }     from '@/components/ui/Input';
import { Button }    from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BvnScreen() {
  const { theme }   = useTheme();
  const router      = useRouter();
  const dispatch    = useAppDispatch();

  const [bvn,         setBvn]         = useState('');
  const [dob,         setDob]         = useState<Date | null>(null);
  const [showPicker,  setShowPicker]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState<{ name?: string } | null>(null);

  function formatDob(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  function dobDisplay(date: Date): string {
    return date.toLocaleDateString('en-NG', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  async function handleSubmit() {
    if (!/^\d{11}$/.test(bvn)) { setError('Enter a valid 11-digit BVN'); return; }
    if (!dob)                   { setError('Select your date of birth');  return; }

    setError('');
    setLoading(true);

    try {
      const result = await kycApi.verifyBvn({
        bvn,
        dateOfBirth: formatDob(dob),
      });

      // Update user tier in Redux
      dispatch(setUser({ tier: 'TIER_1' } as any));
      setSuccess({ name: result.name });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'BVN verification failed. Check your details.');
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.successScreen}>
          <View style={[styles.successIcon, { backgroundColor: theme.status.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={64} color={theme.status.success} />
          </View>
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
            BVN Verified!
          </Text>
          {success.name && (
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2] }]}>
              Welcome, {success.name}
            </Text>
          )}
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your account has been upgraded to Tier 1. You can now send up to ₦200,000 per transaction.
          </Text>
          <Button
            label="Continue"
            onPress={() => router.replace('/(app)/kyc')}
            style={styles.successBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="card-outline" size={32} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[3] }]}>
            BVN Verification
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your BVN is used to verify your identity. It is securely encrypted and never shared.
          </Text>
        </View>

        {error ? <ErrorCard message={error} style={styles.error} /> : null}

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
            HOW TO GET YOUR BVN
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2] }]}>
            Dial <Text style={{ color: theme.text.primary, fontWeight: '600' }}>*565*0#</Text> on any registered phone line to get your BVN.
          </Text>
        </View>

        {/* BVN input */}
        <Input
          label="BVN (Bank Verification Number)"
          placeholder="Enter your 11-digit BVN"
          keyboardType="numeric"
          value={bvn}
          onChangeText={(t) => { setBvn(t.replace(/\D/g, '').slice(0, 11)); setError(''); }}
          maxLength={11}
          hint={`${bvn.length}/11 digits`}
        />

        {/* Date of birth */}
        <View>
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
            Date of Birth
          </Text>
          <Button
            label={dob ? dobDisplay(dob) : 'Select date of birth'}
            variant="secondary"
            onPress={() => setShowPicker(true)}
            icon={<Ionicons name="calendar-outline" size={18} color={theme.text.secondary} />}
          />
          {showPicker && (
            <DateTimePicker
              value={dob ?? new Date(1990, 0, 1)}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) { setDob(date); setError(''); }
              }}
            />
          )}
        </View>

        {/* Security note */}
        <View style={[styles.securityNote, { backgroundColor: theme.bg.secondary }]}>
          <Ionicons name="lock-closed-outline" size={16} color={theme.text.muted} />
          <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1 }]}>
            Your BVN is encrypted end-to-end and verified directly with NIBSS via Fincra. We do not store your raw BVN.
          </Text>
        </View>

        <Button
          label={loading ? 'Verifying...' : 'Verify BVN'}
          onPress={handleSubmit}
          loading={loading}
          disabled={bvn.length !== 11 || !dob}
          style={styles.submitBtn}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  content:      { padding: spacing[4], gap: spacing[4] },
  header:       { alignItems: 'center', marginBottom: spacing[2] },
  error:        {},
  infoCard:     { borderRadius: radius.xl, padding: spacing[4] },
  securityNote: {
    flexDirection: 'row', gap: spacing[2],
    borderRadius:  radius.xl, padding: spacing[3],
  },
  submitBtn:    { marginTop: spacing[2] },
  successScreen: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: spacing[6],
  },
  successIcon: {
    width: 120, height: 120, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  successBtn: { width: '100%', marginTop: spacing[8] },
});