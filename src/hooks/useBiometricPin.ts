import { useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from '@/utils/secure-storage';

export function useBiometricPin(onPinRetrieved: (pin: string) => void) {
  const [showBiometrics, setShowBiometrics] = useState(false);

  useEffect(() => {
    (async () => {
      const [enabled, hasHardware, enrolled] = await Promise.all([
        secureStorage.getBiometricEnabled(),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setShowBiometrics(enabled && hasHardware && enrolled);
    })();
  }, []);

  async function onBiometrics() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm with biometrics',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });
    if (!result.success) return;
    const pin = await secureStorage.getPin();
    if (pin) onPinRetrieved(pin);
  }

  return { showBiometrics, onBiometrics };
}
