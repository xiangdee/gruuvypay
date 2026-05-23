// All boot logic and route guard for the root layout.
// Lives in src/screens/ not app/ — Expo Router ignores this folder.

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
import { fetchUser, silentRefresh }   from '@/store/slices/auth.slice';

import { fetchBalance, resetDailySpend } from '@/store/slices/wallet.slice';
import { initDeviceUA }    from '@/utils/device';
import { fetchRates } from '@/store/slices/currency.slice';
import { usePushNotifications } from '@/hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync();

export function useRootLayout() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const segments = useSegments();

  const [appReady,  setAppReady]  = useState(false);
  const [isLocked,  setIsLocked]  = useState(false);
  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  // Register / re-register push token whenever auth state becomes complete
  usePushNotifications();

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
        await dispatch(fetchUser());    // fetch user
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

  // ── Background-aware polling + app lock ──────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const LOCK_GRACE_MS = 300_000; // only lock if backgrounded for > 5 min
    const appStateRef    = { current: AppState.currentState };
    const backgroundedAt = { current: 0 };
    let balanceTimer: ReturnType<typeof setInterval>;
    let ratesTimer:   ReturnType<typeof setInterval>;

    function startPolling() {
      balanceTimer = setInterval(() => dispatch(fetchBalance()),  30_000);
      ratesTimer   = setInterval(() => dispatch(fetchRates()),   300_000);
    }

    function stopPolling() {
      clearInterval(balanceTimer);
      clearInterval(ratesTimer);
    }

    startPolling();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current !== 'active' && next === 'active') {
        // Only lock if the app was in the background long enough
        if (backgroundedAt.current && Date.now() - backgroundedAt.current > LOCK_GRACE_MS) {
          setIsLocked(true);
        }
        backgroundedAt.current = 0;
        dispatch(fetchBalance());
        dispatch(fetchRates());
        startPolling();
      } else if (next === 'background' || next === 'inactive') {
        backgroundedAt.current = Date.now();
        stopPolling();
      }
      appStateRef.current = next;
    });

    return () => { stopPolling(); sub.remove(); };
  }, [isAuthenticated]);

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
      // Don't redirect if already on a screen that's part of this step's flow
      const stepScreens: Record<string, string[]> = {
        PHONE:      ['add-phone', 'verify-phone'],
        PIN:        ['set-pin'],
        BIOMETRICS: ['biometrics'],
      };
      const currentScreen = segments[1] as string | undefined;
      const validScreens  = stepScreens[onboardingStep] ?? [];
      if (!validScreens.includes(currentScreen ?? '')) {
        const target = stepRoutes[onboardingStep];
        if (target) router.replace(target as any);
      }
      return;
    }

    // Fully onboarded → main app
    if (onboardingStep === 'COMPLETE' && !inApp) {
      router.replace('/(app)');
    }
  }, [appReady, isAuthenticated, onboardingStep, segments]);

  function onUnlocked() {
    setIsLocked(false);
  }

  return { appReady, fontsLoaded, isLocked, onUnlocked };
}