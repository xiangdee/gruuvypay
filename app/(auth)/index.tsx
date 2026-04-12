// Entry point for auth group — redirects appropriately

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/store/hooks';

export default function AuthIndex() {
  const router = useRouter();
  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated && onboardingStep && onboardingStep !== 'COMPLETE') {
      // Resume onboarding
      const routes: Record<string, string> = {
        PHONE:      '/(auth)/add-phone',
        PIN:        '/(auth)/set-pin',
        BIOMETRICS: '/(auth)/biometrics',
      };
      router.replace((routes[onboardingStep] ?? '/(auth)/sign-up') as any);
    } else {
      router.replace('/(auth)/sign-up');
    }
  }, []);

  return null;
}