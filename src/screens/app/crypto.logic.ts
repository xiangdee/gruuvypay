import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';

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
      // TODO: call CoinGecko or Tatum price API
      // Placeholder prices for now
      const mockPrices: Record<string, CoinPrice> = {
        BTC:  { symbol: 'BTC',  priceNGN: '₦158,400,000', priceUSD: '$98,200',  change24h: 2.4,  loading: false },
        ETH:  { symbol: 'ETH',  priceNGN: '₦5,490,000',   priceUSD: '$3,405',   change24h: 1.8,  loading: false },
        USDT: { symbol: 'USDT', priceNGN: '₦1,614',        priceUSD: '$1.00',    change24h: 0.01, loading: false },
        SOL:  { symbol: 'SOL',  priceNGN: '₦243,000',      priceUSD: '$150.60',  change24h: -1.2, loading: false },
        LTC:  { symbol: 'LTC',  priceNGN: '₦138,000',      priceUSD: '$85.50',   change24h: 0.7,  loading: false },
        XRP:  { symbol: 'XRP',  priceNGN: '₦3,390',        priceUSD: '$2.10',    change24h: 3.1,  loading: false },
      };
      setPrices(mockPrices);
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