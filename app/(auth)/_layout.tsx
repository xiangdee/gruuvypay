// No header, no tab bar — clean stack for onboarding

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // prevent swipe-back during onboarding
      }}
    />
  );
}