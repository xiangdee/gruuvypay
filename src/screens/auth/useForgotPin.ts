// Forgot PIN recovery flow:
//   Step 1: enter registered phone number → OTP sent via Termii
//   Step 2: verify OTP
//   Step 3: set new PIN (reuses SetPin UI)
// No email recovery — phone is the source of truth for PIN reset

import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/store/hooks';
import { authApi } from '@/api/auth.api';
import { useToast } from '@/hooks/useToast';
import { useOtpTimer } from '@/hooks/useOtpTimer';

export type ForgotPinStep = 'phone' | 'otp' | 'new-pin';

export function useForgotPin() {
  const router   = useRouter();
  const toast    = useToast();
  const timer    = useOtpTimer({ id: 'forgot-pin', cooldownSeconds: 60 });

  const [step,    setStep]    = useState<ForgotPinStep>('phone');
  const [phone,   setPhone]   = useState('');
  const [pinId,   setPinId]   = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // PIN step refs
  const [firstPin,  setFirstPin]  = useState('');
  const [pinStage,  setPinStage]  = useState<'set' | 'confirm'>('set');
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  // ── Step 1: send OTP to phone ────────────────────────────────────────
  async function sendOtp() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setPhoneError('Enter a valid phone number');
      return;
    }
    setPhoneError('');
    setLoading(true);

    try {
      // Normalize to international format
      const normalized = digits.startsWith('0')
        ? `+234${digits.slice(1)}`
        : `+${digits}`;

      // Reuse the phone OTP endpoint — server checks phone exists on an account
      const res = await authApi.sendForgotPinOtp(normalized);
      setPinId(res.pinId);
      setPhone(normalized);
      setStep('otp');
      timer.startTimer();
      toast.success('Code sent', `Check ${normalized}`);
    } catch (err: any) {
      toast.error('Failed', err?.message ?? 'Phone number not found on any account');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setLoading(true);
    try {
      const res = await authApi.sendForgotPinOtp(phone);
      setPinId(res.pinId);
      timer.startTimer();
      toast.success('Code resent', `Check ${phone}`);
    } catch (err: any) {
      toast.error('Failed to resend', err?.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: verify OTP ───────────────────────────────────────────────
  async function verifyOtp(otp: string) {
    setLoading(true);
    try {
      await authApi.verifyForgotPinOtp({ phone, otp, pinId });
      setStep('new-pin');
    } catch (err: any) {
      toast.error('Invalid code', err?.message ?? 'Please try again');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: set new PIN ──────────────────────────────────────────────
  async function onNewPinComplete(pin: string) {
    if (pinStage === 'set') {
      setFirstPin(pin);
      setPinStage('confirm');
      return;
    }

    // Confirm stage
    if (pin !== firstPin) {
      toast.error('PINs do not match', 'Please try again');
      pinRef.current?.shake();
      setPinStage('set');
      setFirstPin('');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPin({ phone, pin, confirmPin: pin });
      toast.success('PIN reset!', 'You can now log in with your new PIN');
      router.replace('/(auth)/login');
    } catch (err: any) {
      toast.error('Failed', err?.message ?? 'Please try again');
      pinRef.current?.shake();
      setPinStage('set');
      setFirstPin('');
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (step === 'otp') { setStep('phone'); return; }
    if (step === 'new-pin') { setStep('otp'); return; }
    router.back();
  }

  return {
    step,
    phone, setPhone,
    phoneError,
    loading,
    timer,
    pinStage,
    pinRef,
    sendOtp,
    resendOtp,
    verifyOtp,
    onNewPinComplete,
    goBack,
  };
}