// Single source of truth for all tier limits.
// Amounts in KOBO (multiply NGN by 100) — avoids float arithmetic.
// Frontend uses this for instant validation feedback.
// Backend enforces the same limits independently.

export const KOBO = 100; // 1 NGN = 100 kobo

export interface TierLimit {
  label:          string;
  minSendKobo:    number;         // minimum per transaction
  maxSendKobo:    number | null;  // null = unlimited
  dailyLimitKobo: number | null;  // null = unlimited
  balanceCapKobo: number | null;  // null = unlimited
}

export const TIER_LIMITS: Record<string, TierLimit> = {
  TIER_0: {
    label:          'Unverified',
    minSendKobo:    100   * KOBO,         // ₦100
    maxSendKobo:    5_000 * KOBO,         // ₦5,000
    dailyLimitKobo: 20_000 * KOBO,        // ₦20,000
    balanceCapKobo: 50_000 * KOBO,        // ₦50,000
  },
  TIER_1: {
    label:          'Phone Verified',
    minSendKobo:    100    * KOBO,        // ₦100
    maxSendKobo:    50_000 * KOBO,        // ₦50,000
    dailyLimitKobo: 200_000 * KOBO,       // ₦200,000
    balanceCapKobo: 500_000 * KOBO,       // ₦500,000
  },
  TIER_2: {
    label:          'BVN Verified',
    minSendKobo:    100       * KOBO,     // ₦100
    maxSendKobo:    1_000_000 * KOBO,     // ₦1,000,000
    dailyLimitKobo: 5_000_000 * KOBO,     // ₦5,000,000
    balanceCapKobo: 10_000_000 * KOBO,    // ₦10,000,000
  },
  TIER_3: {
    label:          'Full KYC',
    minSendKobo:    100 * KOBO,           // ₦100
    maxSendKobo:    null,                  // unlimited
    dailyLimitKobo: null,                  // unlimited
    balanceCapKobo: null,                  // unlimited
  },
};

// Helper: get limits for a tier (falls back to TIER_0)
export function getTierLimits(tier: string | null | undefined): TierLimit {
  return TIER_LIMITS[tier ?? 'TIER_0'] ?? TIER_LIMITS['TIER_0'];
}

// Helper: format kobo as NGN string for display
export function koboToNgn(kobo: number): string {
  return (kobo / KOBO).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Helper: validate a send amount — returns error string or null
export function validateSendAmount(
  amountNaira: number,
  balanceNaira: number,
  tier: string | null | undefined,
  dailySpentNaira: number = 0,
): string | null {
  const limits        = getTierLimits(tier);
  const amountKobo    = Math.round(amountNaira * KOBO);
  const balanceKobo   = Math.round(balanceNaira * KOBO);
  const dailySpentKobo = Math.round(dailySpentNaira * KOBO);

  if (amountKobo < limits.minSendKobo) {
    return `Minimum transfer is ₦${koboToNgn(limits.minSendKobo)}`;
  }

  if (limits.maxSendKobo !== null && amountKobo > limits.maxSendKobo) {
    return `Your tier limit is ₦${koboToNgn(limits.maxSendKobo)} per transaction. Upgrade your account to send more.`;
  }

  if (amountKobo > balanceKobo) {
    return 'Insufficient balance';
  }

  if (limits.dailyLimitKobo !== null) {
    const remainingDailyKobo = limits.dailyLimitKobo - dailySpentKobo;
    if (amountKobo > remainingDailyKobo) {
      return `Daily limit reached. You can send ₦${koboToNgn(remainingDailyKobo)} more today.`;
    }
  }

  return null; // valid
}