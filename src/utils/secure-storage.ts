// Wraps expo-secure-store — tokens NEVER go in AsyncStorage

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  REFRESH_TOKEN: 'gruuvy_rt',
  BIOMETRIC_ENABLED: 'gruuvy_bio',
  PIN: 'gruuvy_pin',
} as const;

export const secureStorage = {
  // Refresh token
  setRefreshToken: (token: string) =>
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token),

  getRefreshToken: () =>
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),

  deleteRefreshToken: () =>
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),

  // Biometrics preference (stored securely so it can't be spoofed)
  setBiometricEnabled: (enabled: boolean) =>
    SecureStore.setItemAsync(KEYS.BIOMETRIC_ENABLED, enabled ? '1' : '0'),

  getBiometricEnabled: async () => {
    const val = await SecureStore.getItemAsync(KEYS.BIOMETRIC_ENABLED);
    return val === '1';
  },

  // PIN (stored so biometrics can retrieve and submit it)
  setPin: (pin: string) => SecureStore.setItemAsync(KEYS.PIN, pin),
  getPin: () => SecureStore.getItemAsync(KEYS.PIN),
  deletePin: () => SecureStore.deleteItemAsync(KEYS.PIN),

  // Clear everything on logout
  clearAll: async () => {
    await Promise.all(
      Object.values(KEYS).map((key) =>
        SecureStore.deleteItemAsync(key).catch(() => {}),
      ),
    );
  },
};