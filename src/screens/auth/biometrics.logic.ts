import { useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppDispatch } from '@/store/hooks';
import { authApi } from '@/api/auth.api';
import { setOnboardingStep } from '@/store/slices/auth.slice';
import { secureStorage } from '@/utils/secure-storage';
import { useToast } from '@/hooks/useToast';
import { Platform } from 'react-native';

export function useBiometricsLogic() {
  const dispatch  = useAppDispatch();
  const toast     = useToast();
  const [loading, setLoading] = useState(false);

  // Detect which biometric type is available (Face ID vs fingerprint)
  async function getBiometricType(): Promise<'faceid' | 'fingerprint' | null> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'faceid';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    return null;
  }

  async function enableBiometrics() {
    setLoading(true);
    try {
      // Trigger the actual biometric prompt
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:    'Authenticate to enable biometrics',
        fallbackLabel:    'Use PIN instead',
        cancelLabel:      'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        toast.warning('Biometrics not set up', 'You can enable this later in settings');
        await completeOnboarding(false);
        return;
      }

      // Store flag in secure storage + notify server
      await secureStorage.setBiometricEnabled(true);
      await completeOnboarding(true);
      toast.success('Biometrics enabled!', 'Your wallet is ready');
    } catch {
      toast.error('Something went wrong', 'You can enable biometrics later');
      await completeOnboarding(false);
    } finally {
      setLoading(false);
    }
  }

  async function skipBiometrics() {
    setLoading(true);
    try {
      await secureStorage.setBiometricEnabled(false);
      await completeOnboarding(false);
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding(biometricsEnabled: boolean) {
    await authApi.setBiometrics({ enabled: biometricsEnabled });
    dispatch(setOnboardingStep('COMPLETE'));
    // Route guard navigates to /(app) automatically
  }

  return { loading, enableBiometrics, skipBiometrics, getBiometricType };
}