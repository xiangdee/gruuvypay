import React, { useState, Component } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/auth.slice';
import { authApi } from '@/api/auth.api';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useToast } from '@/hooks/useToast';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { TwoFaType } from '@/types/two-fa.types';

type Method = 'email' | 'authy';
type Step   = 'method' | 'setup' | 'confirm' | 'success';

interface SetupResult {
  type:         string;
  message:      string;
  qrcode?:      string;
  secret?:      string;
  backupCodes?: string[];
  token?:       string;
}

class QRErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() { return this.state.crashed ? this.props.fallback : this.props.children; }
}

function SafeQRCode({ value, size }: { value: string; size: number }) {
  const { theme } = useTheme();
  const isValid = typeof value === 'string' && value.length > 10;
  if (!isValid) return null;
  return (
    <QRErrorBoundary
      fallback={
        <View style={[styles.qrFallback, { backgroundColor: theme.bg.secondary }]}>
          <Ionicons name="qr-code-outline" size={40} color={theme.text.muted} />
          <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: 8 }]}>
            QR unavailable — use the manual key below
          </Text>
        </View>
      }
    >
      <QRCode value={value} size={size} color="#000" backgroundColor="#fff" ecLevel="M" />
    </QRErrorBoundary>
  );
}

export default function Setup2faScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const toast     = useToast();
  const user      = useAppSelector((s) => s.auth.user);

  const [step,       setStep]      = useState<Step>('method');
  const [method,     setMethod]    = useState<Method>('email');
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState('');
  const [result,     setResult]    = useState<SetupResult | null>(null);
  const [otpError,   setOtpError]  = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const otpRef = React.useRef<{ reset: () => void } | null>(null);

  async function initiateSetup(chosen: Method) {
    setMethod(chosen);
    setLoading(true);
    setError('');
    try {
      const res = await authApi.setup2fa(chosen);
      setResult(res);
      setStep('setup');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not start 2FA setup. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onCodeComplete(code: string) {
    setOtpError(false);
    setLoading(true);
    try {
      await authApi.confirm2fa({ code, token: result?.token });
      const enabledType = method === 'authy' ? TwoFaType.authy : TwoFaType.email;
      if (user) {
        dispatch(setUser({ ...user, isTwofaActive: true, twoFaType: enabledType }));
      }
      setStep('success');
    } catch (err: any) {
      setOtpError(true);
      otpRef.current?.reset();
      setError(err?.response?.data?.message ?? 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function copySecret() {
    if (!result?.secret) return;
    await Clipboard.setStringAsync(result.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 3000);
  }

  // ── Step: method selection ────────────────────────────────────────
  if (step === 'method') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: theme.brand.primary + '15' }]}>
            <Ionicons name="shield-checkmark-outline" size={36} color={theme.brand.primary} />
          </View>
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>
            Enable 2FA
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Add an extra layer of security to your account. Choose how you want to receive verification codes.
          </Text>

          {error ? <ErrorCard message={error} /> : null}

          <View style={styles.methodList}>
            <MethodCard
              icon="mail-outline"
              title="Email OTP"
              desc="Receive a one-time code to your registered email address each time you log in."
              onPress={() => initiateSetup('email')}
              loading={loading && method === 'email'}
              theme={theme}
            />
            <MethodCard
              icon="phone-portrait-outline"
              title="Authenticator App"
              desc="Use Google Authenticator or any TOTP app to generate codes offline."
              onPress={() => initiateSetup('authy')}
              loading={loading && method === 'authy'}
              theme={theme}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step: setup info (QR or "code sent") ─────────────────────────
  if (step === 'setup') {
    const isTotp = result?.type === 'totp';

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[textStyles.h2, { color: theme.text.primary }]}>
            {isTotp ? 'Scan QR Code' : 'Check Your Email'}
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            {result?.message}
          </Text>

          {isTotp && result?.qrcode ? (
            <>
              <View style={[styles.qrCard, { backgroundColor: '#fff' }]}>
                <SafeQRCode value={result.qrcode} size={200} />
              </View>

              {result.secret && (
                <View style={[styles.secretBox, { backgroundColor: theme.bg.secondary }]}>
                  <Text style={[textStyles.labelSm, { color: theme.text.muted, letterSpacing: 0.8 }]}>
                    MANUAL ENTRY KEY
                  </Text>
                  <Text style={[textStyles.body, { color: theme.text.primary, fontFamily: 'monospace', marginTop: spacing[1] }]} selectable>
                    {result.secret}
                  </Text>
                  <TouchableOpacity onPress={copySecret} style={styles.copyRow}>
                    <Ionicons
                      name={secretCopied ? 'checkmark-circle-outline' : 'copy-outline'}
                      size={16}
                      color={secretCopied ? theme.status.success : theme.brand.primary}
                    />
                    <Text style={[textStyles.caption, { color: secretCopied ? theme.status.success : theme.brand.primary }]}>
                      {secretCopied ? 'Copied!' : 'Copy key'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {result.backupCodes && result.backupCodes.length > 0 && (
                <View style={[styles.backupBox, { backgroundColor: theme.status.warning + '10', borderColor: theme.status.warning + '40' }]}>
                  <View style={styles.backupHeader}>
                    <Ionicons name="warning-outline" size={16} color={theme.status.warning} />
                    <Text style={[textStyles.label, { color: theme.status.warning }]}>
                      Save your backup codes
                    </Text>
                  </View>
                  <Text style={[textStyles.caption, { color: theme.text.secondary, marginBottom: spacing[2] }]}>
                    Store these somewhere safe. Each code can only be used once.
                  </Text>
                  <View style={styles.codesGrid}>
                    {result.backupCodes.map((c) => (
                      <Text key={c} style={[textStyles.body, { color: theme.text.primary, fontFamily: 'monospace' }]} selectable>
                        {c}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[4] }]}>
                After scanning, enter the 6-digit code from your app to confirm.
              </Text>
            </>
          ) : (
            <View style={[styles.emailSentBox, { backgroundColor: theme.bg.secondary }]}>
              <Ionicons name="mail" size={48} color={theme.brand.primary} />
              <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[3] }]}>
                A 6-digit code has been sent to{'\n'}
                <Text style={{ color: theme.text.primary, fontWeight: '600' }}>{user?.email}</Text>
              </Text>
            </View>
          )}

          <Button
            label="Enter Code"
            onPress={() => setStep('confirm')}
            style={{ marginTop: spacing[4] }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step: confirm code ────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.confirmContent}>
          <Text style={[textStyles.h2, { color: theme.text.primary }]}>Enter Code</Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            {method === 'authy'
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Enter the 6-digit code sent to your email.'}
          </Text>

          {error ? <ErrorCard message={error} style={{ marginTop: spacing[4] }} /> : null}

          {loading ? (
            <ActivityIndicator color={theme.brand.primary} style={{ marginTop: spacing[8] }} />
          ) : (
            <OtpInput
              onComplete={onCodeComplete}
              error={otpError}
              style={{ marginTop: spacing[8] }}
              onRef={(api) => { otpRef.current = api; }}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Step: success ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <View style={styles.successContent}>
        <Ionicons name="shield-checkmark" size={72} color={theme.status.success} />
        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5], textAlign: 'center' }]}>
          2FA Enabled!
        </Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
          Your account is now protected with two-factor authentication.
        </Text>
        <Button
          label="Done"
          onPress={() => router.back()}
          style={{ marginTop: spacing[10], width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

function MethodCard({ icon, title, desc, onPress, loading, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.methodCard, { backgroundColor: theme.bg.secondary }]}
    >
      <View style={[styles.methodIcon, { backgroundColor: theme.brand.primary + '15' }]}>
        {loading
          ? <ActivityIndicator size="small" color={theme.brand.primary} />
          : <Ionicons name={icon} size={24} color={theme.brand.primary} />
        }
      </View>
      <View style={styles.methodText}>
        <Text style={[textStyles.label, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[0.5] }]}>{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.text.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1 },
  content:        { padding: spacing[5], alignItems: 'center', gap: spacing[4], paddingBottom: spacing[10] },
  iconWrap:       { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginTop: spacing[6] },
  methodList:     { width: '100%', gap: spacing[3], marginTop: spacing[4] },
  methodCard:     { flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderRadius: radius.xl, padding: spacing[4] },
  methodIcon:     { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  methodText:     { flex: 1 },
  qrCard:         { borderRadius: radius['2xl'], padding: spacing[6], alignItems: 'center' },
  secretBox:      { width: '100%', borderRadius: radius.xl, padding: spacing[4], gap: spacing[1] },
  copyRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[2] },
  backupBox:      { width: '100%', borderRadius: radius.xl, borderWidth: 1, padding: spacing[4] },
  backupHeader:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  codesGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  emailSentBox:   { width: '100%', borderRadius: radius.xl, padding: spacing[6], alignItems: 'center', gap: spacing[2] },
  confirmContent: { flex: 1, alignItems: 'center', paddingHorizontal: spacing[5], paddingTop: spacing[10] },
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[6] },
  qrFallback:     { width: 200, height: 200, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
});
