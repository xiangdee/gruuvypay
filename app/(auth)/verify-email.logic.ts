import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { authApi } from '@/api/auth.api';
import { useToast } from '@/hooks/useToast';
import { useOtpTimer } from '@/hooks/useOtpTimer';
import { setOnboardingStep } from '@/store/slices/auth.slice';

export function useVerifyEmailLogic() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const toast    = useToast();
  const user     = useAppSelector((s) => s.auth.user);

  const otpRef = useRef<{ reset: () => void } | null>(null);
  const timer  = useOtpTimer({ id: 'verify-email', cooldownSeconds: 60 });

  async function onOtpComplete(otp: string) {
    try {
      await authApi.verifyEmail(otp);
      // Move to next onboarding step
      dispatch(setOnboardingStep('PHONE'));
      // Route guard in _layout.logic.ts handles navigation
    } catch (err: any) {
      toast.error('Invalid code', err?.message ?? 'Please try again');
      otpRef.current?.reset();
    }
  }

  async function resend() {
    if (!user?.email) return;
    try {
      await authApi.resendVerificationEmail(user.email);
      timer.startTimer();
      toast.success('Code sent', `Check ${user.email}`);
    } catch (err: any) {
      toast.error('Failed to resend', err?.message ?? 'Please try again');
    }
  }

  // Start timer immediately on mount (email was sent at registration)
  function onMount() {
    timer.startTimer();
  }

  return {
    email: user?.email ?? '',
    timer,
    otpRef,
    onOtpComplete,
    resend,
    onMount,
  };
}