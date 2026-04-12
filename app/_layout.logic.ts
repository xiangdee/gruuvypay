// All state, effects and boot logic for the root layout
// Kept separate so _layout.tsx is purely structural

import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { silentRefresh } from '@/store/slices/auth.slice';
import { initDeviceUA } from '@/utils/device';

SplashScreen.preventAutoHideAsync();

export function useRootLayout() {
  const dispatch    = useAppDispatch();
  const router      = useRouter();
  const segments    = useSegments();
  const [appReady, setAppReady] = useState(false);

  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Boot sequence — runs once on app start
  useEffect(() => {
    async function boot() {
      try {
        await initDeviceUA();           // cache device UA before any API call
        await dispatch(silentRefresh()); // try to restore session from secure storage
      } catch {
        // No session — user will land on auth screens
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    boot();
  }, []);

  // Route guard — runs when auth state or segment changes
  useEffect(() => {
    if (!appReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup  = segments[0] === '(app)';

    if (!isAuthenticated) {
      // Not logged in → auth screens
      if (!inAuthGroup) router.replace('/(auth)');
      return;
    }

    // Logged in but onboarding incomplete → route to correct step
    if (onboardingStep && onboardingStep !== 'COMPLETE') {
      const stepRoutes: Record<string, string> = {
        PHONE:      '/(auth)/add-phone',
        PIN:        '/(auth)/set-pin',
        BIOMETRICS: '/(auth)/biometrics',
      };
      const target = stepRoutes[onboardingStep];
      if (target && segments.join('/') !== target.replace('/(auth)/', '')) {
        router.replace(target as any);
      }
      return;
    }

    // Fully onboarded → main app
    if (onboardingStep === 'COMPLETE' && !inAppGroup) {
      router.replace('/(app)');
    }
  }, [appReady, isAuthenticated, onboardingStep, segments]);

  return { appReady, fontsLoaded };
}