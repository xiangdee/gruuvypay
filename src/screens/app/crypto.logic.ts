import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { cryptoApi } from '@/api/crypto.api';

const NGN_PER_USD = 1615;

// Supported coins on GruuvyPay
export const SUPPORTED_COINS = [
  { id: 'bitcoin',  symbol: 'BTC',  name: 'Bitcoin',  icon: '₿',  color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETH',  name: 'Ethereum', icon: 'Ξ',  color: '#627EEA' },
  { id: 'tether',   symbol: 'USDT', name: 'Tether',   icon: '₮',  color: '#26A17B' },
  { id: 'solana',   symbol: 'SOL',  name: 'Solana',   icon: '◎',  color: '#9945FF' },
  { id: 'litecoin', symbol: 'LTC',  name: 'Litecoin', icon: 'Ł',  color: '#BFBBBB' },
  { id: 'ripple',   symbol: 'XRP',  name: 'XRP',      icon: 'X',  color: '#00AAE4' },
] as const;

export type CoinSymbol = typeof SUPPORTED_COINS[number]['symbol'];

export interface CoinPrice {
  symbol:    CoinSymbol;
  priceNGN:  string;
  priceUSD:  string;
  change24h: number;   // percentage e.g. 2.4 or -1.3
  loading:   boolean;
}

export interface CoinHolding {
  symbol:   CoinSymbol;
  balance:  string;    // crypto amount e.g. "0.00423"
  valueNGN: string;    // formatted NGN value
}

export function useCryptoLogic() {
  const router = useRouter();
  const toast  = useToast();

  const [prices,    setPrices]    = useState<Record<string, CoinPrice>>({});
  const [holdings,  setHoldings]  = useState<CoinHolding[]>([]);
  const [portfolio, setPortfolio] = useState({ totalNGN: '₦0.00', totalUSD: '$0.00' });
  const [refreshing, setRefreshing] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(true);

  useEffect(() => {
    loadPrices();
    loadHoldings();
  }, []);

  async function loadPrices() {
    setPricesLoading(true);
    try {
      const raw = await cryptoApi.getAllPrices();
      const formatted: Record<string, CoinPrice> = {};
      for (const [symbol, p] of Object.entries(raw) as [string, any][]) {
        const usd = p.priceUSD as number;
        const ngn = usd * NGN_PER_USD;
        formatted[symbol] = {
          symbol:    symbol as any,
          priceUSD:  `$${usd.toLocaleString('en-US', { maximumFractionDigits: usd < 1 ? 4 : 2 })}`,
          priceNGN:  `₦${ngn.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`,
          change24h: p.change24h ?? 0,
          loading:   false,
        };
      }
      setPrices(formatted);
    } catch (err: any) {
      toast.error('Prices unavailable', 'Could not load crypto prices');
    } finally {
      setPricesLoading(false);
    }
  }

  async function loadHoldings() {
    // TODO: load from Tatum wallet API
    // Empty for new users
    setHoldings([]);
    setPortfolio({ totalNGN: '₦0.00', totalUSD: '$0.00' });
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPrices(), loadHoldings()]);
    setRefreshing(false);
  }, []);

  function handleBuy(symbol: CoinSymbol) {
    router.push({ pathname: '/(app)/crypto/buy', params: { symbol } });
  }

  function handleSell(symbol: CoinSymbol) {
    router.push({ pathname: '/(app)/crypto/sell', params: { symbol } });
  }

  function handleCoinDetail(symbol: CoinSymbol) {
    router.push({ pathname: '/(app)/crypto/[symbol]', params: { symbol } });
  }

  function handleSend(symbol: CoinSymbol) {
    router.push({ pathname: '/(app)/crypto/send', params: { symbol } });
  }

  function handleReceive(symbol: CoinSymbol) {
    router.push({ pathname: '/(app)/crypto/receive', params: { symbol } });
  }

  const hasHoldings = holdings.length > 0;

  return {
    prices,
    holdings,
    portfolio,
    refreshing,
    pricesLoading,
    hasHoldings,
    onRefresh,
    handleBuy,
    handleSell,
    handleCoinDetail,
    handleSend,
    handleReceive,
  };
}