// Requests push notification permission from the OS,
// gets the Expo push token, and registers it with the backend.
// Call this once after onboarding is complete.

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device        from 'expo-device';
import { Platform }       from 'react-native';
import apiClient          from '@/api/client';
import { useAppSelector } from '@/store/hooks';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated || onboardingStep !== 'COMPLETE') return;
    if (!Device.isDevice) return; // won't work in simulator

    registerForPushNotifications();
  }, [isAuthenticated, onboardingStep]);
}

async function registerForPushNotifications() {
  try {
    // Request permission
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return; // user denied

    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name:             'GruuvyPay',
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       '#1B4FD8',
      });
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    const token    = tokenData.data;
    const deviceOs = Platform.OS; // 'ios' | 'android'

    // Register with backend
    await apiClient.post('/push-tokens', { token, deviceOs });

  } catch (err: any) {
    // Non-fatal — app works fine without push notifications
    console.warn('Push token registration failed:', err?.message);
  }
}

// Call on logout to remove token from backend
export async function unregisterPushToken() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    await apiClient.delete('/push-tokens', { data: { token: tokenData.data } });
  } catch {
    // Non-fatal
  }
}