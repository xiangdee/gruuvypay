// app/(auth)/two-fa.tsx
// Receives: userId, token, twoFaType as route params
// Lets the user complete their 2FA challenge before getting full access

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { OtpInput } from '@/components/ui/OtpInput';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing } from '@/theme';
import { authApi } from '@/api/auth.api';
import { useAppDispatch } from '@/store/hooks';
import { setAccessToken, setUser, setOnboardingStep } from '@/store/slices/auth.slice';
import { secureStorage } from '@/utils/secure-storage';
import { TwoFaType } from '@/types/two-fa.types';
import { initDeviceUA } from '@/utils/device';

function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.overlayBg}>
        <View style={styles.overlayCard}>
          <ActivityIndicator size="large" color="#D7FF64" />
          <Text style={styles.overlayText}>Verifying...</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function TwoFaScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const dispatch   = useAppDispatch();
  const { userId, token, twoFaType } = useLocalSearchParams<{
    userId:    string;
    token:     string;
    twoFaType: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const otpRef = useRef<{ reset: () => void } | null>(null);

  const isTotp  = twoFaType === TwoFaType.authy;

  async function verify(code: string) {
    setError(false);
    setErrorMsg('');
    setLoading(true);
    try {
      await initDeviceUA();
      const res = await authApi.completeTwoFa({
        userId, token, code,
        twoFaType: twoFaType as TwoFaType,
        deviceName: 'GruuvyPay App',
      });
      await secureStorage.setRefreshToken(res.refreshToken);
      dispatch(setAccessToken(res.accessToken));
      dispatch(setUser(res.user));
      dispatch(setOnboardingStep(res.user.onboardingStep));
      // Route guard in useRootLayout handles navigation
    } catch (err: any) {
      setError(true);
      setErrorMsg(err?.response?.data?.message ?? 'Invalid code. Please try again.');
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen padded>
      <LoadingOverlay visible={loading} />

      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: theme.brand.primary + '20' }]}>
          <Ionicons
            name={isTotp ? 'shield-checkmark-outline' : 'mail-outline'}
            size={36}
            color={theme.brand.primary}
          />
        </View>

        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4], textAlign: 'center' }]}>
          Two-Factor Authentication
        </Text>

        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
          {isTotp
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter the 6-digit code sent to your registered email or phone.'}
        </Text>

        <View style={styles.otpWrap}>
          <OtpInput
            onComplete={verify}
            error={error}
            onRef={(api) => { otpRef.current = api; }}
          />
        </View>

        {errorMsg ? <ErrorCard message={errorMsg} style={{ marginBottom: spacing[4] }} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', marginBottom: spacing[4] },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing[16] },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  otpWrap: { marginVertical: spacing[8], width: '100%' },
  overlayBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  overlayCard: {
    backgroundColor: '#1A1F2E', borderRadius: 20,
    paddingVertical: 32, paddingHorizontal: 48,
    alignItems: 'center', gap: 12,
  },
  overlayText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
