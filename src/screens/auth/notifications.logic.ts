// This screen appears after biometrics — optional push notification opt-in
// Uses Expo Notifications

import { useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export function useNotificationsLogic() {
  const router    = useRouter();
  const [loading, setLoading] = useState(false);

  async function requestPermission() {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        // Get push token and send to backend
        const token = await Notifications.getExpoPushTokenAsync();
        // TODO: POST token to /users/push-token
      }
    } finally {
      setLoading(false);
      // Always proceed to app regardless of permission choice
      router.replace('/(app)');
    }
  }

  function skip() {
    router.replace('/(app)');
  }

  return { loading, requestPermission, skip };
}