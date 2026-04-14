import { TwoFaType } from '@/types/two-fa.types';
// app/(auth)/login.logic.ts

import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/auth.slice';
import { useToast } from '@/hooks/useToast';
import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from '@/utils/secure-storage';
import { silentRefresh } from '@/store/slices/auth.slice';

type LoginStep = 'identifier' | 'pin';

export function useLoginLogic() {
  const dispatch  = useAppDispatch();
  const router    = useRouter();
  const toast     = useToast();
  const loading   = useAppSelector((s) => s.auth.loading);

  const [step,            setStep]           = useState<LoginStep>('identifier');
  const [identifier,      setIdentifier]      = useState('');
  const [identifierError, setIdentifierError] = useState('');

  function handleIdentifierChange(val: string) {
    setIdentifier(val);
    if (identifierError) setIdentifierError('');
  }
  const [pinError,   setPinError]   = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  function validateIdentifier(): string | null {
    const val = identifier.trim();
    if (!val) return 'Please enter your username or email';
    // Email pattern
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    // Username pattern (3-20 chars, letters/numbers/underscore)
    const isUsername = /^[a-zA-Z0-9_]{3,20}$/.test(val.replace('@', ''));
    if (!isEmail && !isUsername) return 'Enter a valid username or email address';
    return null;
  }

  function goToPin() {
    const error = validateIdentifier();
    if (error) {
      setIdentifierError(error);
      return;
    }
    setIdentifierError('');
    setStep('pin');
  }

  async function onPinComplete(pin: string) {
    setPinError(false);

    const result = await dispatch(login({
      identifier: identifier.trim().toLowerCase(),
      pin,
      deviceName: 'Mobile',
    }));

    if (login.fulfilled.match(result)) {
      // 2FA check
      const payload = result.payload as any;
      if (payload?.type === 'twoFa') {
        router.push({
          pathname: '/(auth)/two-fa',
          params: {
            userId:    payload.userId ?? '',
            token:     payload.token,
            twoFaType: payload.twoFaType as TwoFaType,
          },
        });
        return;
      }
      // Success — route guard handles navigation
    } else {
      setPinError(true);
      pinRef.current?.shake();
      toast.error('Login failed', result.payload as string);
    }
  }

  async function tryBiometricLogin() {
    const bioEnabled = await secureStorage.getBiometricEnabled();
    if (!bioEnabled) return;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Log in to GruuvyPay',
      fallbackLabel: 'Use PIN',
    });

    if (result.success) {
      await dispatch(silentRefresh());
    }
  }

  function goToSignUp() {
    router.push('/(auth)/sign-up');
  }

  function goBack() {
    if (step === 'pin') setStep('identifier');
    else router.back();
  }

  return {
    step, identifier,
    setIdentifier: handleIdentifierChange,
    identifierError,
    loading, pinError, pinRef,
    goToPin, goBack, goToSignUp,
    onPinComplete, tryBiometricLogin,
  };
}