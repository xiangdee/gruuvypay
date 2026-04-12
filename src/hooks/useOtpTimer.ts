// Client-side rate limiting for OTP resend
// Persists remaining time to AsyncStorage so timer survives app backgrounding

import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_COOLDOWN_SECONDS = 60;
const STORAGE_KEY = (id: string) => `otp_resend_ts_${id}`;

interface UseOtpTimerOptions {
  cooldownSeconds?: number;
  // Pass a unique id per screen so timers don't conflict
  // e.g. 'verify-email', 'verify-phone'
  id: string;
}

interface UseOtpTimerResult {
  secondsLeft:    number;
  canResend:      boolean;
  startTimer:     () => void;    // call after sending OTP
  formattedTime:  string;        // "01:00", "00:45"
}

export function useOtpTimer({
  cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
  id,
}: UseOtpTimerOptions): UseOtpTimerResult {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount — check if there's an active timer from a previous session
  useEffect(() => {
    restoreTimer();
    return () => clearInterval(intervalRef.current!);
  }, []);

  async function restoreTimer() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY(id));
      if (!stored) return;

      const expiresAt = parseInt(stored, 10);
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

      if (remaining > 0) {
        setSecondsLeft(remaining);
        beginCountdown();
      } else {
        // Expired — clean up
        await AsyncStorage.removeItem(STORAGE_KEY(id));
      }
    } catch {
      // Storage failure — start fresh
    }
  }

  function beginCountdown() {
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          AsyncStorage.removeItem(STORAGE_KEY(id)).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const startTimer = useCallback(async () => {
    const expiresAt = Date.now() + cooldownSeconds * 1000;
    try {
      await AsyncStorage.setItem(STORAGE_KEY(id), expiresAt.toString());
    } catch {
      // Proceed even if storage fails — timer still works in memory
    }
    setSecondsLeft(cooldownSeconds);
    beginCountdown();
  }, [cooldownSeconds, id]);

  const formattedTime = formatTime(secondsLeft);

  return {
    secondsLeft,
    canResend: secondsLeft === 0,
    startTimer,
    formattedTime,
  };
}

// "01:00", "00:45", "00:09"
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}