// src/api/crypto.api.ts

import apiClient from './client';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export interface CryptoWallet {
  symbol:  string;
  address: string;
  network: string;
  memo?:   string | null;
  balance: string;
}

export interface Quote {
  symbol:       string;
  side:         'buy' | 'sell';
  amountNgn:    string;
  cryptoAmount: string;
  rate:         string;
  fee:          string;
  platformFee:  string;
}

export const cryptoApi = {
  getWallets: async (): Promise<CryptoWallet[]> => {
    const { data } = await apiClient.get('/crypto/wallets');
    return data;
  },

  getWallet: async (symbol: string): Promise<CryptoWallet> => {
    const { data } = await apiClient.get(`/crypto/wallet/${symbol}`);
    return data;
  },

  getQuote: async (symbol: string, amountNgn: number, side: 'buy' | 'sell'): Promise<Quote> => {
    const { data } = await apiClient.post('/crypto/quote', { symbol, amountNgn, side });
    return data;
  },

  buy: async (params: {
    symbol:    string;
    amountNgn: number;
    pin:       string;
    idempotencyKey?: string;
  }) => {
    const { idempotencyKey, ...body } = params;
    const key = idempotencyKey ?? `buy-${params.symbol}-${Date.now()}`;
    const { data } = await apiClient.post('/crypto/buy', body, {
      headers: { 'Idempotency-Key': key },
    });
    return data;
  },

  sell: async (params: {
    symbol:       string;
    cryptoAmount: string;
    pin:          string;
  }) => {
    const { data } = await apiClient.post('/crypto/sell', params);
    return data;
  },

  getPortfolio: async () => {
    const { data } = await apiClient.get('/crypto/portfolio');
    return data;
  },

  getAllPrices: async () => {
    const { data } = await apiClient.get('/crypto/prices');
    return data;
  },
};