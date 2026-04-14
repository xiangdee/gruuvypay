// Shared logic for all bill payment screens.
// Each screen only needs to provide its serviceID and form fields.

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';
import { billsApi, BillPaymentResult } from '@/api/bills.api';
import { useToast } from '@/hooks/useToast';
import { useAppSelector } from '@/store/hooks';

export type BillStep = 'form' | 'confirm' | 'pin' | 'success';

interface UseBillPaymentOptions {
  serviceID:      string;
  defaultAmount?: number;
}

export function useBillPayment({ serviceID, defaultAmount }: UseBillPaymentOptions) {
  const router = useRouter();
  const toast  = useToast();
  const wallet = useAppSelector((s) => s.wallet);
  const user   = useAppSelector((s) => s.auth.user);

  const [step,          setStep]          = useState<BillStep>('form');
  const [billersCode,   setBillersCode]   = useState('');
  const [amount,        setAmount]        = useState(defaultAmount?.toString() ?? '');
  const [variationCode, setVariationCode] = useState('');
  const [variationName, setVariationName] = useState('');
  const [phone,         setPhone]         = useState(user?.phone ?? '');
  const [variations,    setVariations]    = useState<any[]>([]);
  const [customerInfo,  setCustomerInfo]  = useState<any>(null);
  const [loading,       setLoading]       = useState(false);
  const [verifying,     setVerifying]     = useState(false);
  const [pinError,      setPinError]      = useState(false);
  const [result,        setResult]        = useState<BillPaymentResult | null>(null);
  const [formError,     setFormError]     = useState('');

  // Generated once when user taps "Proceed" — survives retries
  const idempotencyKey = useRef(uuidv4());

  // ─── Load variations (data bundles / cable plans) ─────────────────────
  const loadVariations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billsApi.getVariations(serviceID);
      setVariations(data ?? []);
    } catch {
      toast.error('Could not load options', 'Please try again');
    } finally {
      setLoading(false);
    }
  }, [serviceID]);

  // ─── Verify customer (meter / smartcard number) ───────────────────────
  async function verifyCustomer() {
    if (!billersCode.trim()) {
      setFormError('Enter a valid number');
      return false;
    }
    setVerifying(true);
    setFormError('');
    try {
      const data = await billsApi.verifyCustomer(serviceID, billersCode);
      if (data?.content?.Customer_Name) {
        setCustomerInfo(data.content);
        return true;
      }
      setFormError('Could not verify — check the number and try again');
      return false;
    } catch {
      setFormError('Verification failed — check the number');
      return false;
    } finally {
      setVerifying(false);
    }
  }

  // ─── Validate form and proceed to confirm ─────────────────────────────
  function proceedToConfirm() {
    if (!billersCode.trim()) { setFormError('Enter a valid number');        return; }
    if (!amount || parseFloat(amount) <= 0) { setFormError('Enter amount'); return; }
    if (parseFloat(amount) < 50) { setFormError('Minimum is ₦50');         return; }

    const balanceNaira = parseInt(wallet.balanceRaw ?? '0') / 100;
    if (parseFloat(amount) > balanceNaira) {
      setFormError('Insufficient balance');
      return;
    }

    // Regenerate key fresh for each payment attempt
    idempotencyKey.current = uuidv4();
    setFormError('');
    setStep('confirm');
  }

  function proceedToPin() {
    setStep('pin');
  }

  // ─── Execute payment ──────────────────────────────────────────────────
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  async function onPinComplete(pin: string) {
    setPinError(false);
    setLoading(true);

    try {
      const data = await billsApi.pay(
        {
          serviceID,
          billersCode: billersCode.trim(),
          variationCode: variationCode || undefined,
          amount:      parseFloat(amount),
          phone:       phone.trim(),
          pin,
        },
        idempotencyKey.current,
      );

      setResult(data);
      setStep('success');
    } catch (err: any) {
      setPinError(true);
      pinRef.current?.shake();
      toast.error('Payment failed', err?.response?.data?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  }

  function selectVariation(code: string, name: string, variationAmount?: number) {
    setVariationCode(code);
    setVariationName(name);
    if (variationAmount) setAmount(variationAmount.toString());
  }

  function goBack() {
    if (step === 'confirm') { setStep('form');    return; }
    if (step === 'pin')     { setStep('confirm'); return; }
    router.back();
  }

  function payAnother() {
    setBillersCode('');
    setAmount(defaultAmount?.toString() ?? '');
    setVariationCode('');
    setVariationName('');
    setCustomerInfo(null);
    setResult(null);
    setStep('form');
  }

  function goHome() {
    router.replace('/(app)');
  }

  return {
    step,
    billersCode,  setBillersCode,
    amount,       setAmount,
    variationCode, variationName,
    phone,        setPhone,
    variations,
    customerInfo,
    loading,      verifying,
    pinError,     pinRef,
    formError,    setFormError,
    result,
    wallet,       user,
    loadVariations,
    verifyCustomer,
    proceedToConfirm,
    proceedToPin,
    onPinComplete,
    selectVariation,
    goBack,
    payAnother,
    goHome,
  };
}