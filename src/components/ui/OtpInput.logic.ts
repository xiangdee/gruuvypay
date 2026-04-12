import { useRef, useState } from 'react';
import { TextInput } from 'react-native';

const OTP_LENGTH = 6;

export function useOtpInputLogic(onComplete?: (otp: string) => void) {
  const [otp, setOtp]               = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  function handleChange(text: string, index: number) {
    const digit = text.slice(-1); // take last char in case of paste
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }

    if (newOtp.every((d) => d !== '')) {
      onComplete?.(newOtp.join(''));
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  }

  // Handle paste — fills all boxes at once
  function handlePaste(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    if (digits.length === 0) return;
    const newOtp = [...Array(OTP_LENGTH).fill('')];
    digits.forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    const lastFilled = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
    setActiveIndex(lastFilled);
    if (digits.length === OTP_LENGTH) onComplete?.(newOtp.join(''));
  }

  function reset() {
    setOtp(Array(OTP_LENGTH).fill(''));
    setActiveIndex(0);
    inputRefs.current[0]?.focus();
  }

  function setRef(el: TextInput | null, index: number) {
    inputRefs.current[index] = el;
  }

  return { otp, activeIndex, handleChange, handleKeyPress, handlePaste, reset, setRef };
}