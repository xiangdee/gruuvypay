// Shown when the app comes to foreground after being backgrounded.
// User must authenticate (biometrics or PIN) to continue.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { silentRefresh, login } from '@/store/slices/auth.slice';
import { secureStorage } from '@/utils/secure-storage';
import { PinInput } from '@/components/ui/PinInput';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useTheme, textStyles, spacing } from '@/theme';

interface LockScreenProps {
  onUnlocked: () => void;
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const { theme }  = useTheme();
  const dispatch   = useAppDispatch();
  const user       = useAppSelector((s) => s.auth.user);

  const [loading,    setLoading]    = useState(false);
  const [pinError,   setPinError]   = useState(false);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled,   setBioEnabled]   = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  useEffect(() => {
    (async () => {
      const supported = await LocalAuthentication.hasHardwareAsync();
      const enrolled  = await LocalAuthentication.isEnrolledAsync();
      const enabled   = await secureStorage.getBiometricEnabled();
      setBioSupported(supported && enrolled);
      setBioEnabled(enabled);
      if (supported && enrolled && enabled) {
        tryBiometrics();
      }
    })();
  }, []);

  async function tryBiometrics() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock GruuvyPay',
      fallbackLabel: 'Use PIN',
    });
    if (result.success) {
      setLoading(true);
      const res = await dispatch(silentRefresh());
      setLoading(false);
      if (silentRefresh.fulfilled.match(res)) {
        onUnlocked();
      }
    }
  }

  async function onPinComplete(pin: string) {
    if (!user?.username) return;
    setPinError(false);
    setLoading(true);
    const result = await dispatch(login({
      identifier: user.username.replace('@', ''),
      pin,
    }));
    setLoading(false);
    if (login.fulfilled.match(result)) {
      onUnlocked();
    } else {
      setPinError(true);
      pinRef.current?.shake();
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      <LoadingOverlay visible={loading} />

      <View style={styles.body}>
        <View style={[styles.avatar, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
          <Text style={[styles.avatarText, { color: theme.brand.accent }]}>
            {user?.username?.replace('@', '').slice(0, 1).toUpperCase() ?? 'G'}
          </Text>
        </View>

        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4], textAlign: 'center' }]}>
          Welcome back
        </Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[1] }]}>
          @{user?.username?.replace('@', '')}
        </Text>

        <View style={{ marginTop: spacing[8], width: '100%' }}>
          <PinInput
            onComplete={onPinComplete}
            error={pinError}
            onRef={(api) => { pinRef.current = api; }}
            showBiometrics={bioSupported && bioEnabled}
            onBiometrics={tryBiometrics}
          />
        </View>

        {pinError && (
          <Text style={[textStyles.bodySm, { color: theme.status.error, marginTop: spacing[3], textAlign: 'center' }]}>
            Incorrect PIN. Please try again.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 999 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[16],
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  avatarText: { fontSize: 28, fontWeight: '800' },
});
