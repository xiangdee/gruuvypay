import apiClient from './client';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

export interface BillPaymentPayload {
  serviceID:      string;
  billersCode:    string;
  variationCode?: string;
  amount:         number;
  phone:          string;
  pin:            string;
}

export interface BillPaymentResult {
  success:    boolean;
  reference:  string;
  vtpassRef:  string;
  product:    string;
  token:      string | null;   // electricity prepaid token
  message:    string;
}

export const billsApi = {
  // Get data bundles / cable plans for a service
  getVariations: async (serviceID: string) => {
    const { data } = await apiClient.get(`/bills/variations/${serviceID}`);
    return data;
  },

  // Verify meter number / smartcard before payment
  verifyCustomer: async (serviceID: string, billersCode: string) => {
    const { data } = await apiClient.post('/bills/verify', { serviceID, billersCode });
    return data;
  },

  // Pay a bill — generates idempotency key once per payment attempt
  pay: async (
    payload:        BillPaymentPayload,
    idempotencyKey: string,
  ): Promise<BillPaymentResult> => {
    const { data } = await apiClient.post('/bills/pay', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return data;
  },
};