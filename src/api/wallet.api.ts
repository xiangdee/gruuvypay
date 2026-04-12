// src/api/wallet.api.ts

import apiClient from './client';

export const walletApi = {
  getBalance: async () => {
    const { data } = await apiClient.get('/wallet/balance');
    return data;
  },

  getVirtualAccount: async () => {
    const { data } = await apiClient.get('/wallet/virtual-account');
    return data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get('/wallet/transactions', {
      params: { page, limit },
    });
    return data;
  },

  lookupTag: async (tag: string) => {
    const { data } = await apiClient.get('/wallet/lookup', { params: { tag } });
    return data;
  },

  sendToTag: async (payload: {
    tag: string; amountNaira: string;
    narration?: string; pin: string;
  }) => {
    const { data } = await apiClient.post('/wallet/send', payload);
    return data;
  },
};