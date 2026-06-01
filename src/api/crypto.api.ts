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

export interface SwapQuote {
  quotationId:   string;
  side:          'buy' | 'sell';
  symbol:        string;
  fromCurrency:  string;
  toCurrency:    string;
  fromAmount:    string;        // NGN for buy, crypto for sell
  toAmount:      string;        // crypto for buy, NGN for sell (after spread)
  expiresIn:     number;        // seconds (15)
  spreadPercent: string | null; // e.g. "2.00%" — null when spread is 0
  spreadAmount:  string | null; // e.g. "196.00" NGN — null when spread is 0
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

  setupCryptoAccount: async (): Promise<{ quidaxUserId: string }> => {
    const { data } = await apiClient.post('/crypto/setup');
    return data;
  },

  swapQuote: async (
    symbol: string,
    side: 'buy' | 'sell',
    amount: { amountNgn: number } | { cryptoAmount: string },
  ): Promise<SwapQuote> => {
    const { data } = await apiClient.post('/crypto/swap/quote', { symbol, side, ...amount });
    return data;
  },

  swapConfirm: async (params: {
    quotationId: string;
    pin:         string;
  }) => {
    const key = uuidv4();
    const { data } = await apiClient.post('/crypto/swap/confirm', params, {
      headers: { 'Idempotency-Key': key },
    });
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

  getTransactions: async (symbol?: string) => {
    const url = symbol
      ? `/crypto/transactions/${symbol.toLowerCase()}`
      : '/crypto/transactions';
    const { data } = await apiClient.get(url);
    return data;
  },

  withdraw: async (params: {
    symbol:           string;
    amount:           string;
    toAddress:        string;
    pin:              string;
    destinationTag?:  string;
    network?:         string;
    beneficiaryName?: string;
  }) => {
    const { data } = await apiClient.post('/crypto/withdraw', params);
    return data;
  },

  setup: async () => {
    const { data } = await apiClient.post('/crypto/setup', {});
    return data;
  },
};