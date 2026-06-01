// TIER_1 → TIER_2: MetaMap NIN verification via in-app WebView
// Flow:
//   1. Call /kyc/nin/start → get verificationUrl
//   2. Show WebView modal with MetaMap URL
//   3. User completes NIN verification inside WebView
//   4. User taps Done → poll /kyc/status until tier == TIER_2 or timeout

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { WebView }           from 'react-native-webview';
import { Ionicons }          from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter }         from 'expo-router';
import { useAppDispatch }    from '@/store/hooks';
import { setUser }           from '@/store/slices/auth.slice';
import { kycApi }            from '@/api/kyc.api';
import { Button }            from '@/components/ui/Button';
import { ErrorCard }         from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing, radius } from '@/theme';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 3 * 60 * 1000; // 3 minutes

type Step = 'idle' | 'starting' | 'browser' | 'polling' | 'success' | 'review';

export default function NinScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const dispatch   = useAppDispatch();

  const [step,           setStep]           = useState<Step>('idle');
  const [error,          setError]          = useState('');
  const [webViewUrl,     setWebViewUrl]     = useState('');
  const [webViewVisible, setWebViewVisible] = useState(false);

  const pollTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current)  clearInterval(pollTimer.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollTimer.current)  { clearInterval(pollTimer.current);  pollTimer.current  = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current);  timeoutRef.current = null; }
  }

  function startPolling() {
    setStep('polling');

    pollTimer.current = setInterval(async () => {
      try {
        const status = await kycApi.getStatus();
        if (status.tier === 'TIER_2' || status.ninVerified) {
          stopPolling();
          dispatch(setUser({ tier: 'TIER_2' } as any));
          setStep('success');
        } else if (status.rejectionReason?.includes('review')) {
          stopPolling();
          setStep('review');
        }
      } catch {
        // transient error — keep polling
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setStep('review');
    }, POLL_TIMEOUT_MS);
  }

  function handleWebViewClose() {
    setWebViewVisible(false);
    startPolling();
  }

  async function startVerification() {
    setError('');
    setStep('starting');
    try {
      const { verificationUrl } = await kycApi.startNin();
      setWebViewUrl(verificationUrl);
      setWebViewVisible(true);
      setStep('browser');
    } catch (err: any) {
      setError(err?.message ?? 'Could not start verification. Try again.');
      setStep('idle');
    }
  }

  // ── Success ───────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={72} color={theme.status.success} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
            NIN Verified!
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your NIN has been verified and your account has been upgraded to Tier 2.
          </Text>
          <Button
            label="Continue"
            onPress={() => router.replace('/(app)/kyc')}
            style={styles.btn}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Under review / polling timeout ────────────────────────────────────
  if (step === 'review') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.center}>
          <Ionicons name="time-outline" size={64} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
            Verification Submitted
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your NIN verification is being reviewed. This usually takes a few minutes.
            You'll be notified once your account is upgraded.
          </Text>
          <Button
            label="Check Again"
            onPress={() => startPolling()}
            style={styles.btn}
          />
          <TouchableOpacity onPress={() => router.replace('/(app)/kyc')} style={{ marginTop: spacing[3] }}>
            <Text style={[textStyles.label, { color: theme.text.muted }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Polling ───────────────────────────────────────────────────────────
  if (step === 'polling') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[textStyles.h3, { color: theme.text.primary, marginTop: spacing[5] }]}>
            Processing Verification…
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            We're confirming your NIN with NIMC. This usually takes under a minute.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Idle / starting / browser ─────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>

      {/* ── MetaMap WebView Modal ── */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        onRequestClose={handleWebViewClose}
      >
        <SafeAreaProvider>
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
          <View style={[styles.webViewHeader, { backgroundColor: theme.bg.card, borderBottomColor: theme.border.DEFAULT }]}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>NIN Verification</Text>
            <TouchableOpacity onPress={handleWebViewClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[textStyles.label, { color: theme.brand.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: webViewUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={theme.brand.primary} />
              </View>
            )}
          />
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Ionicons name="finger-print" size={48} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[3] }]}>
            NIN Verification
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your National Identification Number (NIN) will be verified directly with NIMC to upgrade your account to Tier 2.
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.bg.secondary }]}>
          {[
            { icon: 'shield-checkmark-outline', text: 'Secure verification powered by MetaMap' },
            { icon: 'time-outline',             text: 'Takes about 1–2 minutes to complete' },
            { icon: 'phone-portrait-outline',   text: 'Your NIN will be captured and verified in-app' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Ionicons name={item.icon as any} size={20} color={theme.brand.primary} />
              <Text style={[textStyles.body, { color: theme.text.secondary, flex: 1 }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tipsCard, { backgroundColor: theme.bg.secondary, borderColor: theme.brand.primary + '30', borderWidth: 1 }]}>
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
            Before you start:
          </Text>
          <Text style={[textStyles.caption, { color: theme.text.muted }]}>
            • Have your NIN slip or NIMC card ready{'\n'}
            • Dial *346# to get your NIN if you don't know it{'\n'}
            • Make sure you're in good lighting for liveness check{'\n'}
            • Allow camera access when prompted
          </Text>
        </View>

        {error ? <ErrorCard message={error} /> : null}

        <Button
          label={step === 'starting' ? 'Preparing…' : 'Start NIN Verification'}
          onPress={startVerification}
          loading={step === 'starting'}
          disabled={step === 'starting'}
          style={styles.btn}
        />

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  content: { padding: spacing[4], gap: spacing[4] },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  header:  { alignItems: 'center', marginBottom: spacing[2] },
  infoCard:{ borderRadius: radius.xl, padding: spacing[4], gap: spacing[3] },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  tipsCard:{ borderRadius: radius.xl, padding: spacing[4] },
  btn:     { marginTop: spacing[2] },

  webViewHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[4],
    borderBottomWidth: 1,
  },
  webViewLoading: {
    position:       'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
