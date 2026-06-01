import { useCallback }         from 'react';
import { useRouter }           from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast }            from '@/hooks/useToast';
import {
  fetchCryptoWallets,
  fetchCryptoPrices,
} from '@/store/slices/crypto.slice';

const NGN_PER_USD = 1615;

// Supported coins on GruuvyPay
export const SUPPORTED_COINS = [
  { id: 'bitcoin',  symbol: 'BTC',  name: 'Bitcoin',  abbr: 'BTC',  color: '#F7931A', logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETH',  name: 'Ethereum', abbr: 'ETH',  color: '#627EEA', logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'tether',   symbol: 'USDT', name: 'Tether',   abbr: 'USDT', color: '#26A17B', logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  { id: 'solana',   symbol: 'SOL',  name: 'Solana',   abbr: 'SOL',  color: '#9945FF', logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'litecoin', symbol: 'LTC',  name: 'Litecoin', abbr: 'LTC',  color: '#BFBBBB', logoUrl: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { id: 'ripple',   symbol: 'XRP',  name: 'XRP',      abbr: 'XRP',  color: '#00AAE4', logoUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
] as const;

export type CoinSymbol = typeof SUPPORTED_COINS[number]['symbol'];

export interface CoinPrice {
  symbol:    CoinSymbol;
  priceNGN:  string;
  priceUSD:  string;
  change24h: number;
  loading:   boolean;
}

export interface CoinHolding {
  symbol:   CoinSymbol;
  balance:  string;
  valueNGN: string;
}

export function useCryptoLogic() {
  const router    = useRouter();
  const toast     = useToast();
  const dispatch  = useAppDispatch();

  const rawWallets      = useAppSelector((s) => s.crypto.wallets);
  const rawPrices       = useAppSelector((s) => s.crypto.prices);
  const walletsLoading  = useAppSelector((s) => s.crypto.walletsLoading);
  const pricesLoading   = useAppSelector((s) => s.crypto.pricesLoading);

  // ── Derived: formatted prices ──────────────────────────────────────────
  const prices: Record<string, CoinPrice> = Object.fromEntries(
    Object.entries(rawPrices).map(([symbol, p]) => [
      symbol,
      {
        symbol:    symbol as CoinSymbol,
        priceUSD:  `$${p.priceUSD.toLocaleString('en-US', { maximumFractionDigits: p.priceUSD < 1 ? 4 : 2 })}`,
        priceNGN:  `₦${p.priceNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`,
        change24h: p.change24h,
        loading:   false,
      },
    ]),
  );

  // ── Derived: holdings (non-zero balances) ──────────────────────────────
  const holdings: CoinHolding[] = rawWallets
    .filter((w) => parseFloat(w.balance ?? '0') > 0)
    .map((w) => {
      const priceUSD = rawPrices[w.symbol.toUpperCase()]?.priceUSD ?? 0;
      const bal      = parseFloat(w.balance ?? '0');
      const usdVal   = bal * priceUSD;
      return {
        symbol:   w.symbol as CoinSymbol,
        balance:  bal.toFixed(bal < 0.01 ? 6 : 4),
        valueNGN: `₦${(usdVal * NGN_PER_USD).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`,
      };
    });

  // ── Derived: portfolio totals ──────────────────────────────────────────
  const totalUSD = rawWallets.reduce((sum, w) => {
    const priceUSD = rawPrices[w.symbol.toUpperCase()]?.priceUSD ?? 0;
    return sum + parseFloat(w.balance ?? '0') * priceUSD;
  }, 0);

  const portfolio = {
    totalNGN: `₦${(totalUSD * NGN_PER_USD).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`,
    totalUSD: `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };

  // ── Refresh ────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    await Promise.all([
      dispatch(fetchCryptoWallets()).unwrap().catch(() => toast.error('Could not refresh balances')),
      dispatch(fetchCryptoPrices()).unwrap().catch(() => toast.error('Could not refresh prices')),
    ]);
  }, [dispatch]);

  // ── Load on first mount ────────────────────────────────────────────────
  // Components call this once. Persisted data renders immediately;
  // these fetches run in background and update when done.
  function loadAll() {
    dispatch(fetchCryptoWallets()).unwrap().catch(() => {});
    dispatch(fetchCryptoPrices()).unwrap().catch(() => {});
  }

  // ── Navigation helpers ─────────────────────────────────────────────────
  // With symbol → go straight to personalized screen (from coin row)
  // Without symbol → go to coin picker first (from portfolio card buttons)
  function handleBuy(symbol?: CoinSymbol) {
    if (symbol) router.push({ pathname: '/(app)/crypto/buy'    as any, params: { symbol } });
    else        router.push({ pathname: '/(app)/crypto/select' as any, params: { mode: 'buy' } });
  }
  function handleSell(symbol?: CoinSymbol) {
    if (symbol) router.push({ pathname: '/(app)/crypto/sell'   as any, params: { symbol } });
    else        router.push({ pathname: '/(app)/crypto/select' as any, params: { mode: 'sell' } });
  }
  function handleSend(symbol?: CoinSymbol) {
    if (symbol) router.push({ pathname: '/(app)/crypto/send'   as any, params: { symbol } });
    else        router.push({ pathname: '/(app)/crypto/select' as any, params: { mode: 'send' } });
  }
  function handleReceive(symbol?: CoinSymbol) {
    if (symbol) router.push({ pathname: '/(app)/crypto/receive' as any, params: { symbol } });
    else        router.push({ pathname: '/(app)/crypto/select'  as any, params: { mode: 'receive' } });
  }
  function handleCoinDetail(symbol: CoinSymbol) {
    router.push({ pathname: '/(app)/crypto/[symbol]' as any, params: { symbol } });
  }

  return {
    prices,
    holdings,
    portfolio,
    refreshing:    walletsLoading || pricesLoading,
    pricesLoading,
    hasHoldings:   holdings.length > 0,
    onRefresh,
    loadAll,
    handleBuy,
    handleSell,
    handleCoinDetail,
    handleSend,
    handleReceive,
  };
}
