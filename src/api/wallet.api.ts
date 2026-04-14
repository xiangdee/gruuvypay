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


  lookupTag: async (tag: string): Promise<{ username: string; name: string } | null> => {
    try {
      const { data } = await apiClient.get(`/wallet/lookup/${tag}`);
      return data;
    } catch {
      return null;
    }
  },

  sendToTag: async (payload: {
    tag:            string;
    amountNaira:    string;
    narration?:      string;
    pin:            string;
    idempotencyKey: string;  // caller generates once, reuses on retry
  }): Promise<{
    amountNaira: string; reference: string; newBalance: string 
}> => {
    const { idempotencyKey, ...body } = payload;
    const { data } = await apiClient.post('/wallet/send', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data;
  },
};