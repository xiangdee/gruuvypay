// Requests push notification permission from the OS,
// gets the Expo push token, and registers it with the backend.
// Called from useRootLayout once onboarding is complete.

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device        from 'expo-device';
import { Platform }       from 'react-native';
import Constants          from 'expo-constants';
import apiClient          from '@/api/client';
import { useAppSelector } from '@/store/hooks';

const PROJECT_ID: string =
  Constants.expoConfig?.extra?.eas?.projectId ??
  process.env.EXPO_PUBLIC_PROJECT_ID ??
  '';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated || onboardingStep !== 'COMPLETE') return;
    if (!Device.isDevice) return; // push tokens don't work in simulators

    registerForPushNotifications();
  }, [isAuthenticated, onboardingStep]);
}

async function registerForPushNotifications() {
  try {
    // Android: ensure notification channel exists
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name:             'GruuvyPay',
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       '#D7FF64',
      });
    }

    // Request / check permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    const token     = tokenData.data;
    const deviceOs  = Platform.OS;

    // Register with backend
    await apiClient.post('/push-tokens', { token, deviceOs });

  } catch (err: any) {
    // Non-fatal
    console.warn('Push token registration failed:', err?.message);
  }
}

// Call on logout to remove token from backend
export async function unregisterPushToken() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    await apiClient.delete('/push-tokens', { data: { token: tokenData.data } });
  } catch {
    // Non-fatal
  }
}
