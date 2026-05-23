import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { OtpInput } from '@/components/ui/OtpInput';
import { useTheme, textStyles, spacing } from '@/theme';
import { useVerifyPhoneLogic } from '../../src/screens/auth/verify-phone.logic';

export default function VerifyPhoneScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { phone, timer, otpRef, onOtpComplete, resend } = useVerifyPhoneLogic();

  return (
    <Screen padded>
      <View style={styles.inner}>

        <View style={styles.heading}>
          <Text style={[textStyles.h1, { color: theme.text.primary, textAlign: 'center' }]}>
            Verify Phone Number
          </Text>
          <Text style={[
            textStyles.body,
            { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[3] },
          ]}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={{ color: theme.text.primary, fontWeight: '600' }}>{phone}</Text>
          </Text>
        </View>

        <OtpInput
          onComplete={onOtpComplete}
          onRef={(api) => { otpRef.current = api; }}
          style={styles.otp}
        />

        <View style={styles.resend}>
          {timer.canResend ? (
            <TouchableOpacity onPress={resend}>
              <Text style={[textStyles.caption, { color: theme.brand.primary }]}>
                Resend code
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[textStyles.caption, { color: theme.text.secondary }]}>
              Resend code in {timer.formattedTime}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.changeNumber} onPress={() => router.back()}>
          <Text style={[textStyles.caption, { color: theme.text.secondary }]}>
            Wrong number?{' '}
            <Text style={{ color: theme.brand.primary }}>Change number</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: spacing[12],
  },
  heading: {
    marginBottom: spacing[10],
  },
  otp: {
    marginBottom: spacing[8],
  },
  resend: {
    alignItems: 'center',
  },
  changeNumber: {
    alignItems: 'center',
    marginTop: spacing[6],
  },
});
