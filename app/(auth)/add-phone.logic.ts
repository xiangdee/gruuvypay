import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/store/hooks';
import { authApi } from '@/api/auth.api';
import { useToast } from '@/hooks/useToast';
import { useOtpTimer } from '@/hooks/useOtpTimer';

// Normalize Nigerian phone number for display + API
function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.startsWith('234')) return `+${digits}`;
  return input;
}

export function useAddPhoneLogic() {
  const dispatch  = useAppDispatch();
  const router    = useRouter();
  const toast     = useToast();
  const timer     = useOtpTimer({ id: 'add-phone', cooldownSeconds: 60 });

  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  function validatePhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10) return 'Enter a valid phone number';
    return '';
  }

  async function sendOtp() {
    const err = validatePhone(phone);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      const normalized = normalizePhone(phone);
      const res = await authApi.sendPhoneOtp(normalized);

      // Store pinId for verification step
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { phone: normalized, pinId: res.pinId },
      });

      timer.startTimer();
    } catch (err: any) {
      toast.error('Failed to send OTP', err?.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  }

  return {
    phone, setPhone,
    loading, error,
    timer,
    sendOtp,
  };
}