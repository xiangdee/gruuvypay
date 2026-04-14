import { TwoFaType, twoFaTypeLabel, twoFaTypeIsActive } from '@/types/two-fa.types';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileSubScreen, SettingSection, SettingRow } from '@/components/profile/ProfileSubScreen';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { authApi } from '@/api/auth.api';
import { useToast } from '@/hooks/useToast';
import { secureStorage } from '@/utils/secure-storage';
import { setUser } from '@/store/slices/auth.slice';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SecurityScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const toast      = useToast();
  const dispatch   = useAppDispatch();
  const user       = useAppSelector((s) => s.auth.user);

  const [bioEnabled,  setBioEnabled]  = useState(false);
  const [bioSupported, setBioSupported] = useState(false);

  useEffect(() => {
    secureStorage.getBiometricEnabled().then(setBioEnabled);
    LocalAuthentication.hasHardwareAsync().then(setBioSupported);
  }, []);

  async function toggleBiometrics() {
    if (!bioEnabled) {
      // Enable — trigger native prompt
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometrics for GruuvyPay',
        fallbackLabel: 'Cancel',
      });
      if (!result.success) return;
      await secureStorage.setBiometricEnabled(true);
      await authApi.setBiometrics({ enabled: true });
      setBioEnabled(true);
      toast.success('Biometrics enabled');
    } else {
      // Disable — confirm first
      Alert.alert(
        'Disable Biometrics',
        'You will need to enter your PIN to log in.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await secureStorage.setBiometricEnabled(false);
              await authApi.setBiometrics({ enabled: false });
              setBioEnabled(false);
              toast.info('Biometrics disabled');
            },
          },
        ],
      );
    }
  }

  async function disable2FA() {
    Alert.alert(
      'Disable 2FA',
      'This will remove an extra layer of security from your account. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            // PIN modal would appear here in a full implementation
            // For now route to a dedicated disable-2fa screen
            router.push('/(app)/profile/disable-2fa' as any);
          },
        },
      ],
    );
  }

  const twoFaEnabled   = user?.isTwofaActive ?? false;
  const twoFaLabel  = twoFaTypeLabel(user?.twoFaType);
  const twoFaActive = twoFaTypeIsActive(user?.twoFaType);

  return (
    <ProfileSubScreen title="Security">

      {/* PIN */}
      <SettingSection title="PIN">
        <SettingRow
          label="Change PIN"
          icon="keypad-outline"
          onPress={() => router.push('/(app)/profile/change-pin' as any)}
        />
      </SettingSection>

      {/* Biometrics */}
      {bioSupported && (
        <SettingSection title="Biometrics">
          <SettingRow
            label="Face ID / Fingerprint"
            icon="finger-print-outline"
            toggle
            toggleValue={bioEnabled}
            onPress={toggleBiometrics}
          />
          <View style={[styles.hint, { borderTopColor: theme.border.DEFAULT }]}>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>
              Use biometrics to unlock the app and approve transactions quickly.
            </Text>
          </View>
        </SettingSection>
      )}

      {/* Two-Factor Authentication */}
      <SettingSection title="Two-Factor Authentication">
        <SettingRow
          label="2FA Status"
          value={twoFaLabel}
          icon="shield-checkmark-outline"
        />
        {!twoFaEnabled && !twoFaActive ? (
          <SettingRow
            label="Enable 2FA"
            icon="add-circle-outline"
            onPress={() => router.push('/(app)/profile/setup-2fa' as any)}
          />
        ) : (
          <SettingRow
            label="Disable 2FA"
            icon="close-circle-outline"
            danger
            onPress={disable2FA}
          />
        )}
      </SettingSection>

      {/* Sessions */}
      <SettingSection title="Devices">
        <SettingRow
          label="Active Sessions"
          icon="phone-portrait-outline"
          onPress={() => router.push('/(app)/profile/sessions' as any)}
          value="Manage"
        />
      </SettingSection>

    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  hint: {
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    borderTopWidth:    0.5,
  },
});