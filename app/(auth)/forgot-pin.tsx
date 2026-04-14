import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { KeyboardView } from '@/components/layout/KeyboardView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { PinInput } from '@/components/ui/PinInput';
import { ResendOtpButton } from '@/components/ui/ResendOtpButton';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing } from '@/theme';
import { useForgotPin } from '@/screens/auth/useForgotPin';

export default function ForgotPinScreen() {
  const { theme } = useTheme();
  const {
    step, phone, setPhone, phoneError,
    loading, timer, pinStage, pinRef,
    sendOtp, resendOtp, verifyOtp,
    onNewPinComplete, goBack,
  } = useForgotPin();

  // ── Step 1: Phone entry ──────────────────────────────────────────────
  if (step === 'phone') {
    return (
      <Screen padded>
        <KeyboardView>
          <TouchableOpacity onPress={goBack} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>

          <View style={styles.heading}>
            <Text style={[textStyles.h1, { color: theme.text.primary }]}>
              Forgot PIN?
            </Text>
            <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2] }]}>
              Enter the phone number linked to your account. We'll send you a verification code.
            </Text>
          </View>

          {phoneError ? (
            <ErrorCard message={phoneError} style={styles.error} />
          ) : null}

          <Input
            label="Phone Number"
            placeholder="e.g. 08012345678"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoComplete="tel"
          />

          <View style={styles.cta}>
            <Button
              label="Send Verification Code"
              onPress={sendOtp}
              loading={loading}
              disabled={phone.length < 10}
            />
          </View>
        </KeyboardView>
      </Screen>
    );
  }

  // ── Step 2: OTP verification ─────────────────────────────────────────
  if (step === 'otp') {
    return (
      <Screen padded>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>

        <View style={styles.heading}>
          <Text style={[textStyles.h1, { color: theme.text.primary }]}>
            Enter Code
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, marginTop: spacing[2] }]}>
            A 6-digit code was sent to{' '}
            <Text style={{ color: theme.text.primary }}>{phone}</Text>
          </Text>
        </View>

        <OtpInput onComplete={verifyOtp} style={styles.otp} />

        <View style={styles.resend}>
          <ResendOtpButton
            onResend={resendOtp}
            canResend={timer.canResend}
            formattedTime={timer.formattedTime}
            label="Resend Code"
            loading={loading}
          />
          <Text style={[textStyles.bodySm, { color: theme.text.muted, marginTop: spacing[3] }]}>
            Didn't get the code?
          </Text>
        </View>
      </Screen>
    );
  }

  // ── Step 3: New PIN ──────────────────────────────────────────────────
  return (
    <Screen padded>
      <View style={styles.heading}>
        <Text style={[textStyles.h1, { color: theme.text.primary, textAlign: 'center' }]}>
          {pinStage === 'set' ? 'Set New PIN' : 'Confirm New PIN'}
        </Text>
        <Text style={[
          textStyles.body,
          { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] },
        ]}>
          {pinStage === 'set'
            ? 'Choose a new 4-digit PIN for your account'
            : 'Re-enter your new PIN to confirm'
          }
        </Text>
      </View>

      <PinInput
        onComplete={onNewPinComplete}
        onRef={(api) => { pinRef.current = api; }}
        style={styles.pin}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:    { marginBottom: spacing[6], alignSelf: 'flex-start' },
  heading: { marginBottom: spacing[8] },
  error:   { marginBottom: spacing[4] },
  otp:     { alignSelf: 'center' },
  resend:  { alignItems: 'center', marginTop: spacing[8] },
  cta:     { marginTop: 'auto', paddingBottom: spacing[4] },
  pin:     { flex: 1 },
});