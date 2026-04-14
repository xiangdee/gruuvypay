import { useState, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { authApi } from '@/api/auth.api';
import { setOnboardingStep } from '@/store/slices/auth.slice';
import { useToast } from '@/hooks/useToast';

type Step = 'set' | 'confirm';

export function useSetPinLogic() {
  const dispatch = useAppDispatch();
  const toast    = useToast();

  const [step,    setStep]    = useState<Step>('set');
  const [firstPin, setFirstPin] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Refs to shake PIN input on mismatch
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  function onFirstPinComplete(pin: string) {
    setFirstPin(pin);
    setStep('confirm');
  }

  async function onConfirmPinComplete(pin: string) {
    if (pin !== firstPin) {
      toast.error('PINs do not match', 'Please try again');
      pinRef.current?.shake();
      setStep('set');
      setFirstPin('');
      return;
    }

    setLoading(true);
    try {
      await authApi.setPin({ pin, confirmPin: pin });
      dispatch(setOnboardingStep('BIOMETRICS'));
      toast.success('PIN set!', 'Almost done');
    } catch (err: any) {
      toast.error('Failed to set PIN', err?.message ?? 'Please try again');
      pinRef.current?.shake();
      setStep('set');
      setFirstPin('');
    } finally {
      setLoading(false);
    }
  }

  function onPinComplete(pin: string) {
    if (step === 'set') onFirstPinComplete(pin);
    else onConfirmPinComplete(pin);
  }

  return {
    step,
    loading,
    pinRef,
    onPinComplete,
  };
}