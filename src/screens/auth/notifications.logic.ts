// Onboarding notifications screen — requests permission and registers push token

import { useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from '@/api/client';

const PROJECT_ID: string =
  Constants.expoConfig?.extra?.eas?.projectId ??
  process.env.EXPO_PUBLIC_PROJECT_ID ??
  '';

export function useNotificationsLogic() {
  const router    = useRouter();
  const [loading, setLoading] = useState(false);

  async function requestPermission() {
    setLoading(true);
    try {
      // Physical device required for push tokens
      if (Device.isDevice) {
        // Android: create notification channel first
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name:             'GruuvyPay',
            importance:       Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor:       '#D7FF64',
          });
        }

        // Request OS permission
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          // Get Expo push token
          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
          const token     = tokenData.data;
          const deviceOs  = Platform.OS;

          // Save token to backend (non-blocking — don't fail onboarding if this errors)
          await apiClient.post('/push-tokens', { token, deviceOs }).catch(() => {});
        }
      }
    } catch {
      // Non-fatal — proceed to app regardless
    } finally {
      setLoading(false);
      router.replace('/(app)');
    }
  }

  function skip() {
    router.replace('/(app)');
  }

  return { loading, requestPermission, skip };
}
