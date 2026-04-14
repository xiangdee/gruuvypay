// All boot logic and route guard for the root layout.
// Lives in src/screens/ not app/ — Expo Router ignores this folder.

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
import { silentRefresh }   from '@/store/slices/auth.slice';

import { resetDailySpend } from '@/store/slices/wallet.slice';
import { initDeviceUA }    from '@/utils/device';
import { fetchRates } from '@/store/slices/currency.slice';

SplashScreen.preventAutoHideAsync();

export function useRootLayout() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const segments = useSegments();

  const [appReady, setAppReady] = useState(false);
  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // ── Boot sequence ─────────────────────────────────────────────────────
  useEffect(() => {
    async function boot() {
      try {
        await initDeviceUA();            // build X-Device-UA header once
        await dispatch(silentRefresh()); // restore session from SecureStore
        dispatch(fetchRates());          // exchange rates — non-blocking
      } catch {
        // No session — falls through to auth screens via route guard
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    boot();
  }, []);

  // ── Midnight reset — clear daily spend counter when day rolls over ────
  useEffect(() => {
    const msUntilMidnight = new Date().setHours(24, 0, 0, 0) - Date.now();
    const timer = setTimeout(() => {
      dispatch(resetDailySpend());
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // ── Route guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!appReady) return;

    const inAuth = segments[0] === '(auth)';
    const inApp  = segments[0] === '(app)';

    // Not logged in → auth screens
    if (!isAuthenticated) {
      if (!inAuth) router.replace('/(auth)');
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
      if (target) router.replace(target as any);
      return;
    }

    // Fully onboarded → main app
    if (onboardingStep === 'COMPLETE' && !inApp) {
      router.replace('/(app)');
    }
  }, [appReady, isAuthenticated, onboardingStep, segments]);

  return { appReady, fontsLoaded };
}