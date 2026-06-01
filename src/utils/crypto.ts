// Max decimal places Quidax accepts for crypto amounts
const CRYPTO_MAX_DP = 8;

/**
 * Sanitize a crypto amount string as the user types:
 *  - strips non-numeric characters (except one decimal point)
 *  - caps at 8 decimal places
 */
export function sanitizeCryptoInput(val: string): string {
  const clean = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  const [integer, decimal] = clean.split('.');
  if (decimal === undefined) return clean;
  return `${integer}.${decimal.slice(0, CRYPTO_MAX_DP)}`;
}

/**
 * Truncate a crypto amount to 8 dp before sending to the API.
 * Strips trailing zeros so Quidax doesn't reject e.g. "0.00100000".
 */
export function truncateCryptoAmount(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return '0';
  return n.toFixed(CRYPTO_MAX_DP).replace(/\.?0+$/, '');
}
