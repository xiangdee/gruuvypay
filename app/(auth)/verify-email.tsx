import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { ResendOtpButton } from '@/components/ui/ResendOtpButton';
import { useTheme, textStyles, spacing } from '@/theme';
import { useVerifyEmailLogic } from '../../src/screens/auth/verify-email.logic';

export default function VerifyEmailScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const {
    email, timer, otpRef,
    onOtpComplete, resend,
  } = useVerifyEmailLogic();

  // timer.startTimer() is called inside the logic hook's useEffect

  return (
    <Screen padded>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
      </TouchableOpacity>

      {/* Heading */}
      <View style={styles.heading}>
        <Text style={[textStyles.h1, { color: theme.text.primary }]}>
          Verify Email
        </Text>
      </View>

      {/* OTP label */}
      <Text style={[textStyles.label, { color: theme.text.secondary, marginBottom: spacing[4] }]}>
        Enter the code
      </Text>

      {/* 6-box OTP input */}
      <OtpInput
        onComplete={onOtpComplete}
        onRef={(api) => { otpRef.current = api; }}
        style={styles.otp}
      />

      {/* Subtitle */}
      <Text style={[
        textStyles.body,
        { color: theme.text.secondary, marginTop: spacing[5], textAlign: 'center' },
      ]}>
        A verification code has been sent to{'\n'}
        <Text style={{ color: theme.text.primary }}>{email}</Text>
      </Text>

      {/* Resend row with timer — matches screenshot */}
      <View style={styles.resendWrap}>
        <ResendOtpButton
          onResend={resend}
          canResend={timer.canResend}
          formattedTime={timer.formattedTime}
          label="Resend Email"
        />
        <Text style={[textStyles.bodySm, { color: theme.text.muted, marginTop: spacing[3] }]}>
          Didn't get the code?
        </Text>
      </View>

      {/* Verify button at bottom */}
      <View style={styles.cta}>
        <Button
          label="Verify Email"
          onPress={() => {/* auto-submits via OtpInput onComplete */}}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back:       { marginBottom: spacing[6], alignSelf: 'flex-start' },
  heading:    { marginBottom: spacing[8] },
  otp:        { alignSelf: 'center' },
  resendWrap: { alignItems: 'center', marginTop: spacing[8], gap: spacing[2] },
  cta:        { position: 'absolute', bottom: spacing[8], left: spacing[5], right: spacing[5] },
});