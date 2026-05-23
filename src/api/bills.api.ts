// src/api/bills.api.ts

import apiClient from './client';

export const billsApi = {

  // ─── Catalogue ────────────────────────────────────────────────────────────

  getDataPlans: async (network: string) => {
    const { data } = await apiClient.get(`/bill-payments/data-plans/${network}`);
    return data;
  },

  getElectricityProviders: async () => {
    const { data } = await apiClient.get('/bill-payments/electricity-providers');
    return data;
  },

  getCableProviders: async () => {
    const { data } = await apiClient.get('/bill-payments/cable-providers');
    return data;
  },

  getCablePlans: async (billerCode: string) => {
    const { data } = await apiClient.get(`/bill-payments/cable-plans/${billerCode}`);
    return data;
  },

  getBettingProviders: async () => {
    const { data } = await apiClient.get('/bill-payments/betting-providers');
    return data;
  },

  getInternetProviders: async () => {
    const { data } = await apiClient.get('/bill-payments/internet-providers');
    return data;
  },

  getInternetPlans: async (billerCode: string) => {
    const { data } = await apiClient.get(`/bill-payments/internet-plans/${billerCode}`);
    return data;
  },

  // ─── Validate ─────────────────────────────────────────────────────────────

  verifyMeter: async (params: { provider: string; meter_number: string }) => {
    const { data } = await apiClient.post('/bill-payments/verify-meter', params);
    return data;
  },

  validateCustomer: async (params: {
    item_code:   string;
    biller_code: string;
    customer_id: string;
  }) => {
    const { data } = await apiClient.post('/bill-payments/flw-validate', params);
    return data;
  },

  // ─── Purchases ────────────────────────────────────────────────────────────

  buyAirtime: async (params: {
    network:  string;
    phone:    string;
    amount:   number;
    pin:      string;
    idempotency_key?: string;
  }) => {
    const { data } = await apiClient.post('/bill-payments/airtime', params);
    return data;
  },

  buyData: async (params: {
    network:  string;
    phone:    string;
    plan_id:  string;
    pin:      string;
    idempotency_key?: string;
  }) => {
    const { data } = await apiClient.post('/bill-payments/data', params);
    return data;
  },

  buyElectricity: async (params: {
    provider:     string;
    meter_number: string;
    meter_type:   string;
    amount:       number;
    phone:        string;
    pin:          string;
    idempotency_key?: string;
  }) => {
    const { data } = await apiClient.post('/bill-payments/electricity', params);
    return data;
  },

  buyCableTV: async (params: {
    provider:          string;
    smartcard_number:  string;
    plan_id:           string;
    phone:             string;
    subscription_type: string;
    pin:               string;
    idempotency_key?:  string;
  }) => {
    const { data } = await apiClient.post('/bill-payments/cable', params);
    return data;
  },

  buyBetting: async (params: {
    provider:   string;
    account_id: string;
    amount:     number;
    phone:      string;
    pin:        string;
    idempotency_key?: string;
  }) => {
    const { data } = await apiClient.post('/bill-payments/betting', params);
    return data;
  },

  buyInternet: async (params: {
    provider:   string;
    account_id: string;
    plan_id:    string;
    phone:      string;
    pin:        string;
    idempotency_key?: string;
  }) => {
    const { data } = await apiClient.post('/bill-payments/internet', params);
    return data;
  },

  // ─── History ──────────────────────────────────────────────────────────────

  getHistory: async (page = 1, pageSize = 20, type?: string) => {
    const { data } = await apiClient.get('/bill-payments/history', {
      params: { page, pageSize, type },
    });
    return data;
  },

  getTransaction: async (id: number) => {
    const { data } = await apiClient.get(`/bill-payments/${id}`);
    return data;
  },
};