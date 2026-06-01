import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendToTag } from '@/store/slices/wallet.slice';
import { walletApi }        from '@/api/wallet.api';
import { validateSendAmount, getTierLimits, koboToNgn } from '@/config/tier-limits';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/theme';

export type SendStep = 'tag' | 'amount' | 'pin' | 'success';

export interface RecipientInfo {
  username: string;  // '@xiangdee'
  name:     string;  // 'Francis Micah'
}

export function useSendMoney() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const toast    = useToast();

  const wallet = useAppSelector((s) => s.wallet);
  const user   = useAppSelector((s) => s.auth.user);

  const [step,       setStep]       = useState<SendStep>('tag');
  const [tag,        setTag]        = useState('');
  const [tagError,   setTagError]   = useState('');
  const [recipient,  setRecipient]  = useState<RecipientInfo | null>(null);
  const [amount,     setAmount]     = useState('');
  const [amountError, setAmountError] = useState('');
  const [narration,  setNarration]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const [pinError,   setPinError]   = useState(false);
  const [txRef,      setTxRef]      = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  // ─── Step 1: lookup GruuvyTag ─────────────────────────────────────────
  const lookupTag = useCallback(async () => {
    const clean = tag.trim().replace('@', '').toLowerCase();
    if (!clean) { setTagError('Enter a GruuvyTag'); return; }

    setLoading(true);
    setTagError('');

    try {
      const result = await walletApi.lookupTag(clean);
      if (!result) {
        setTagError(`@${clean} not found`);
        return;
      }
      setRecipient(result);
      setStep('amount');
    } catch (err: any) {
      setTagError(err?.message ?? 'User not found');
    } finally {
      setLoading(false);
    }
  }, [tag]);

  // ─── Step 2: validate amount (tier-aware) ────────────────────────────
  function proceedToPin() {
    const num = parseFloat(amount);

    if (!amount || isNaN(num) || num <= 0) {
      setAmountError('Enter a valid amount');
      return;
    }

    const balanceNaira   = parseInt(wallet.balanceRaw ?? '0') / 100;
    // dailySpent would come from wallet state — 0 for now until backend returns it
    const dailySpentNaira = wallet.dailySpentNaira ?? 0;

    const error = validateSendAmount(num, balanceNaira, user?.tier, dailySpentNaira);
    if (error) {
      setAmountError(error);
      return;
    }

    setAmountError('');
    setIdempotencyKey(uuidv4()); // generate once — survives retries
    setStep('pin');
  }

  // Returns tier limit info for display in the UI
  function getTierInfo() {
    const limits = getTierLimits(user?.tier);
    return {
      maxSend:   limits.maxSendKobo    ? `₦${koboToNgn(limits.maxSendKobo)}`    : 'Unlimited',
      dailyLimit: limits.dailyLimitKobo ? `₦${koboToNgn(limits.dailyLimitKobo)}` : 'Unlimited',
      tierLabel: limits.label,
    };
  }

  // ─── Step 3: PIN confirmed → execute transfer ─────────────────────────
  async function onPinComplete(pin: string) {
    setPinError(false);
    setLoading(true);

    const result = await dispatch(sendToTag({
      tag:           recipient!.username,
      amountNaira:   amount,
      narration:     narration || `Transfer to ${recipient!.username}`,
      pin,
      idempotencyKey, // same key on retry = no double-send
    }));
    console.log(reset)

    setLoading(false);

    if (sendToTag.fulfilled.match(result)) {
      setTxRef(result.payload.reference);
      setStep('success');
    } else {
      const errorMsg = (result.payload as string) ?? '';
      setIdempotencyKey(uuidv4());
      setPinError(true);
      pinRef.current?.shake();
      toast.error('Transfer failed', errorMsg);
    }
  }

  function goBack() {
    if (step === 'amount') { setStep('tag'); return; }
    if (step === 'pin')    { setStep('amount'); return; }
    router.back();
  }

  function reset() {
    setStep('tag');
    setTag('');
    setTagError('');
    setRecipient(null);
    setAmount('');
    setAmountError('');
    setNarration('');
    setPinError(false);
    setTxRef('');
    setIdempotencyKey('');
  }

  function sendAnother() {
    reset();
  }

  function goHome() {
    router.replace('/(app)');
  }

  // Quick amount buttons
  const QUICK_AMOUNTS = ['1,000', '2,000', '5,000', '10,000', '20,000', '50,000'];

  function setQuickAmount(val: string) {
    setAmount(val.replace(',', ''));
    setAmountError('');
  }

  return {
    step,
    tag, setTag,
    tagError,
    recipient,
    amount, setAmount,
    amountError,
    narration, setNarration,
    loading,
    pinError, pinRef,
    txRef,
    wallet,
    QUICK_AMOUNTS,
    lookupTag,
    proceedToPin,
    onPinComplete,
    setQuickAmount,
    goBack,
    sendAnother,
    goHome,
    getTierInfo,
  };
}