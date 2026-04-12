import { useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppDispatch } from '@/store/hooks';
import { authApi } from '@/api/auth.api';
import { setOnboardingStep } from '@/store/slices/auth.slice';
import { useToast } from '@/hooks/useToast';
import { useOtpTimer } from '@/hooks/useOtpTimer';

export function useVerifyPhoneLogic() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const toast    = useToast();

  // Phone and pinId passed from add-phone screen
  const { phone, pinId } = useLocalSearchParams<{ phone: string; pinId: string }>();

  const otpRef = useRef<{ reset: () => void } | null>(null);
  const timer  = useOtpTimer({ id: 'verify-phone', cooldownSeconds: 60 });

  async function onOtpComplete(otp: string) {
    try {
      await authApi.verifyPhone({ phone, otp, pinId });
      dispatch(setOnboardingStep('PIN'));
      toast.success('Phone verified!', 'Now set your PIN');
      // Route guard handles navigation to set-pin
    } catch (err: any) {
      toast.error('Invalid code', err?.message ?? 'Please try again');
      otpRef.current?.reset();
    }
  }

  async function resend() {
    try {
      const res = await authApi.sendPhoneOtp(phone);
      timer.startTimer();
      toast.success('Code resent', `Check ${phone}`);
      // Note: pinId changes on resend — need to update params
      // In a real app, navigate back to add-phone or update pinId in state
    } catch (err: any) {
      toast.error('Failed to resend', err?.message);
    }
  }

  return {
    phone,
    timer,
    otpRef,
    onOtpComplete,
    resend,
  };
}