import { useRef, useState, useEffect } from 'react';
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

  const { phone, pinId: initialPinId } = useLocalSearchParams<{ phone: string; pinId: string }>();
  const [currentPinId, setCurrentPinId] = useState(initialPinId);

  const otpRef = useRef<{ reset: () => void } | null>(null);
  const timer  = useOtpTimer({ id: 'verify-phone', cooldownSeconds: 60 });

  useEffect(() => {
    timer.startTimer();
  }, []);

  async function onOtpComplete(otp: string) {
    try {
      await authApi.verifyPhone({ phone, otp, pinId: currentPinId });
      dispatch(setOnboardingStep('PIN'));
      toast.success('Phone verified!', 'Now set your PIN');
      router.replace('/(auth)/set-pin' as any);
    } catch (err: any) {
      toast.error('Invalid code', err?.message ?? 'Please try again');
      otpRef.current?.reset();
    }
  }

  async function resend() {
    try {
      const res = await authApi.sendPhoneOtp(phone);
      setCurrentPinId(res.pinId);
      timer.startTimer();
      toast.success('Code resent', `Check ${phone}`);
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
