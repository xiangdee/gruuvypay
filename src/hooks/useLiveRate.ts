// Fetches rate on mount then auto-refreshes every REFRESH_INTERVAL_MS
// while the screen is open — so the displayed rate never goes stale.
//
// If the rate changes by more than WARN_THRESHOLD (1%) since the user
// started typing, a warning is shown before they can confirm.
//
// Usage:
//   const { rate, formatTo, formatFrom, rateChanged, convert, convertReverse }
//     = useLiveRate('BTC', 'NGN', '₦');

import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '@/api/client';

const REFRESH_INTERVAL_MS = 15_000;  // re-fetch every 15 seconds
const WARN_THRESHOLD      = 0.01;    // warn if rate moves > 1% since last confirm

export interface LiveRateResult {
  rate:           number | null;   // 1 BTC = X NGN (current)
  previousRate:   number | null;   // rate when user started entering amount
  rateChanged:    boolean;         // true if rate moved > WARN_THRESHOLD
  changePct:      number;          // % change since previousRate
  loading:        boolean;
  error:          string | null;
  fetchedAt:      Date | null;
  convert:        (amount: number) => number;       // fromSymbol → toCode
  convertReverse: (amount: number) => number;       // toCode → fromSymbol
  formatTo:       (amount: number) => string;       // e.g. "₦158,544.90"
  formatFrom:     (amount: number) => string;       // e.g. "0.00031535 BTC"
  acceptNewRate:  () => void;      // user acknowledges the rate change
  refresh:        () => void;      // manual refresh
}

export function useLiveRate(
  fromSymbol: string,
  toCode:     string,
  toSymbol?:  string,
): LiveRateResult {
  const [rate,         setRate]         = useState<number | null>(null);
  const [previousRate, setPreviousRate] = useState<number | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [fetchedAt,    setFetchedAt]    = useState<Date | null>(null);

  // Track whether this fetch was triggered by interval (silent) or manual
  const isSilentRefresh = useRef(false);
  const fetchCount      = useRef(0);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Core fetch ──────────────────────────────────────────────────────
  const fetchRate = useCallback(async (silent = false) => {
    const id = ++fetchCount.current;
    isSilentRefresh.current = silent;

    if (!silent) setLoading(true);
    setError(null);

    try {
      // Both calls hit Redis cache — sub-millisecond on backend
      const [priceRes, rateRes] = await Promise.all([
        apiClient.get(`/crypto/price/${fromSymbol}`),
        apiClient.get(`/currency/rate/${toCode}`),
      ]);

      if (id !== fetchCount.current) return; // stale — discard

      const usdPrice:  number = priceRes.data.priceUSD;
      const usdToFiat: number = rateRes.data.rate;
      const newRate            = usdPrice * usdToFiat;

      setRate((prev) => {
        // On first fetch — set both rate and previousRate
        if (prev === null) {
          setPreviousRate(newRate);
        }
        // On silent refresh — keep previousRate as the "agreed" rate
        // so we can show the user how much it moved
        return newRate;
      });

      setFetchedAt(new Date());
    } catch (err: any) {
      if (id !== fetchCount.current) return;
      // On silent refresh failure — keep last known rate, don't show error
      if (!silent) setError(err?.message ?? 'Failed to fetch rate');
    } finally {
      if (id === fetchCount.current && !silent) setLoading(false);
    }
  }, [fromSymbol, toCode]);

  // ─── Mount: initial fetch + start interval ────────────────────────────
  useEffect(() => {
    fetchRate(false);

    // Refresh silently every 15 seconds while screen is open
    intervalRef.current = setInterval(() => {
      fetchRate(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      // Clean up on unmount — stop refreshing when screen closes
      if (intervalRef.current) clearInterval(intervalRef.current);
      fetchCount.current++; // invalidate any in-flight fetches
    };
  }, [fetchRate]);

  // ─── Rate change detection ────────────────────────────────────────────
  const changePct = rate !== null && previousRate !== null && previousRate !== 0
    ? Math.abs((rate - previousRate) / previousRate)
    : 0;

  const rateChanged = changePct > WARN_THRESHOLD;

  // User taps "Accept new rate" — resets the baseline
  function acceptNewRate() {
    setPreviousRate(rate);
  }

  // ─── Manual refresh ───────────────────────────────────────────────────
  function refresh() {
    fetchRate(false);
    setPreviousRate(null); // will be reset to new rate on next fetch
  }

  // ─── Conversions — always use CURRENT rate (not previousRate) ─────────
  // This is intentional: the displayed conversion updates live.
  // rateChanged flag tells the UI to show a warning before confirming.

  function convert(amount: number): number {
    if (!rate || amount <= 0) return 0;
    return amount * rate;
  }

  function convertReverse(amount: number): number {
    if (!rate || amount <= 0) return 0;
    return amount / rate;
  }

  function formatTo(amount: number): string {
    const sym   = toSymbol ?? '';
    const value = convert(amount);
    if (value === 0) return `${sym}0.00`;
    return `${sym}${value.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatFrom(amount: number): string {
    const value    = convertReverse(amount);
    if (value === 0) return `0 ${fromSymbol}`;
    const decimals = ['BTC', 'ETH'].includes(fromSymbol) ? 8 : 4;
    return `${value.toFixed(decimals)} ${fromSymbol}`;
  }

  return {
    rate,
    previousRate,
    rateChanged,
    changePct,
    loading,
    error,
    fetchedAt,
    convert,
    convertReverse,
    formatTo,
    formatFrom,
    acceptNewRate,
    refresh,
  };
}