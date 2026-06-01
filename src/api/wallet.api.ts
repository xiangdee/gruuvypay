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

  getTransactions: async (page = 1, limit = 20, type?: string) => {
    const { data } = await apiClient.get('/wallet/transactions', {
      params: { page, limit, type },
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
    idempotencyKey: string;
  }): Promise<{
    amountNaira: string; reference: string; newBalance: string;
  }> => {
    const { idempotencyKey, ...body } = payload;
    const { data } = await apiClient.post('/wallet/send', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data;
  },

  getBanks: async (): Promise<Array<{ id: number; code: string; name: string }>> => {
    const { data } = await apiClient.get('/wallet/banks');
    return data;
  },

  verifyBankAccount: async (
    accountNumber: string,
    accountBank: string,
  ): Promise<{ accountNumber: string; accountName: string }> => {
    const { data } = await apiClient.post('/wallet/verify-account', { accountNumber, accountBank });
    return data;
  },

  generateOneTimeAccount: async (amount: number): Promise<{
    accountNumber: string;
    bankName:      string;
    accountName:   string;
    amount:        number;
    expiresAt:     string;
  }> => {
    const { data } = await apiClient.post('/wallet/one-time-account', { amount });
    return data;
  },

  sendToBank: async (payload: {
    accountBank:   string;
    accountNumber: string;
    accountName:   string;
    amountNaira:   string;
    narration?:    string;
    pin:           string;
    idempotencyKey: string;
  }): Promise<{
    reference: string; amount: string; recipient: string; bankName: string; status: string;
  }> => {
    const { idempotencyKey, ...body } = payload;
    const { data } = await apiClient.post('/wallet/send-bank', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data;
  },

  getBeneficiaries: async (type?: string): Promise<Beneficiary[]> => {
    const { data } = await apiClient.get('/wallet/beneficiaries', { params: type ? { type } : {} });
    return data;
  },

  addBeneficiary: async (payload: {
    type:    string;
    label:   string;
    details: Record<string, any>;
  }): Promise<Beneficiary> => {
    const { data } = await apiClient.post('/wallet/beneficiaries', payload);
    return data;
  },

  deleteBeneficiary: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete(`/wallet/beneficiaries/${id}`);
    return data;
  },
};

export interface Beneficiary {
  id:        string;
  userId:    string;
  type:      string;
  label:     string;
  details:   Record<string, any>;
  createdAt: string;
  updatedAt: string;
}