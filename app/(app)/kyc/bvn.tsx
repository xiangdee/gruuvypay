// app/(app)/kyc/bvn.tsx
// TIER_0 → TIER_1: BVN verification via Flutterwave + NIBSS consent
//
// Flow:
//   1. User enters BVN → POST /kyc/bvn/initiate → get consentUrl
//   2. Open NIBSS consent page in WebView (or browser)
//   3. User approves → redirected back to app
//   4. Poll /kyc/bvn/status until verified

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Linking,
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

type Step = 'entry' | 'consent' | 'polling' | 'success';

export default function BvnScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const {user} = useAppSelector(state => state.auth);

  const [bvn,     setBvn]     = useState('');
  const [step,    setStep]    = useState<Step>('entry');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [ref,     setRef]     = useState('');

  // Poll BVN status while on 'polling' step
  useEffect(() => {
    if (step !== 'polling') return;

    const interval = setInterval(async () => {
      try {
        const result = await kycApi.checkBvnStatus();
        if (result.status === 'verified' && user) {
          clearInterval(interval);
          setStep('success');
          dispatch(setUser({ ...user, tier: 'TIER_1' }));
          setTimeout(() => router.replace('/(app)/kyc' as any), 2000);
        }

      } catch { /* keep polling */ }
    }, 3000);  // poll every 3 seconds

    return () => clearInterval(interval);
  }, [step]);

  async function initiateBvn() {
    if (!/^\d{11}$/.test(bvn)) {
      setError('BVN must be exactly 11 digits');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await kycApi.initiateBvn(bvn);

      if (!result.consentUrl) {
        // Consent already given before — just poll for the data
        setStep('polling');
        return;
      }

      setRef(result.reference);
      setStep('consent');

      // Open NIBSS consent page in browser
      await Linking.openURL(result.consentUrl);

      // Start polling after opening URL
      setTimeout(() => setStep('polling'), 2000);

    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'BVN initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="card-outline" size={40} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[3] }]}>
            BVN Verification
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
            Verify your Bank Verification Number to unlock higher transfer limits.
          </Text>
        </View>

        {/* Step: entry */}
        {step === 'entry' && (
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
                You will be redirected to the NIBSS portal to confirm consent. This is required by CBN regulations.
              </Text>
            </View>

            <Button
              label={loading ? 'Please wait...' : 'Continue'}
              onPress={initiateBvn}
              loading={loading}
              disabled={loading || bvn.length !== 11}
            />
          </View>
        )}

        {/* Step: consent opened */}
        {step === 'consent' && (
          <View style={styles.center}>
            <Ionicons name="globe-outline" size={48} color={theme.brand.primary} />
            <Text style={[textStyles.h3, { color: theme.text.primary, marginTop: spacing[4], textAlign: 'center' }]}>
              Complete Consent
            </Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              A browser window has opened. Please approve the BVN consent request on the NIBSS portal, then return to this app.
            </Text>
            <Button
              label="I have completed consent"
              onPress={() => setStep('polling')}
              style={{ marginTop: spacing[6] }}
            />
          </View>
        )}

        {/* Step: polling */}
        {step === 'polling' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
            <Text style={[textStyles.h3, { color: theme.text.primary, marginTop: spacing[4], textAlign: 'center' }]}>
              Verifying your BVN...
            </Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              This usually takes a few seconds.
            </Text>
          </View>
        )}

        {/* Step: success */}
        {step === 'success' && (
          <View style={styles.center}>
            <Ionicons name="checkmark-circle" size={64} color={theme.status.success} />
            <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4], textAlign: 'center' }]}>
              BVN Verified!
            </Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              Your account has been upgraded to Tier 1.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  content: { padding: spacing[4], flexGrow: 1 },
  header:  { alignItems: 'center', marginBottom: spacing[6], marginTop: spacing[4] },
  form:    { gap: spacing[4] },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[8] },
  infoBox: { flexDirection: 'row', gap: spacing[2], borderRadius: radius.xl, padding: spacing[3] },
});