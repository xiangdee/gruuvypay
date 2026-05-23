import apiClient from './client';

export interface KycStatus {
  tier:            string;
  bvnVerified:     boolean;
  ninVerified:     boolean;
  addressVerified: boolean;
  utilityVerified: boolean;
  rejectionReason: string | null;
  legalName:       string | null;
}

export const kycApi = {

  getStatus: async (): Promise<KycStatus> => {
    const { data } = await apiClient.get('/kyc/status');
    return data;
  },

  // ── BVN — Step 1: Initiate consent (returns NIBSS consent URL) ──────────
  initiateBvn: async (bvn: string): Promise<{
    success:    boolean;
    reference:  string;
    consentUrl: string | null;  // null if consent already given before
    message:    string;
  }> => {
    const { data } = await apiClient.post('/kyc/bvn/initiate', { bvn });
    return data;
  },

  // ── BVN — Step 2: Poll status after user returns from consent page ──────
  checkBvnStatus: async (): Promise<{
    status:  'verified' | 'pending';
    tier?:   string;
    message?: string;
  }> => {
    const { data } = await apiClient.get('/kyc/bvn/status');
    return data;
  },

  // ── NIN + Utility bill ───────────────────────────────────────────────────
  submitNin: async (payload: {
    nin:            string;
    utilityBillUrl: string;
    utilityType:    string;
  }): Promise<{ success: boolean; message: string; tier: string }> => {
    const { data } = await apiClient.post('/kyc/nin', payload);
    return data;
  },

  // ── Address verification ─────────────────────────────────────────────────
  submitAddress: async (payload: {
    address:          string;
    city:             string;
    state:            string;
    proofOfAddressUrl: string;
    addressDocType:   string;
  }): Promise<{ success: boolean; message: string; tier: string }> => {
    const { data } = await apiClient.post('/kyc/address', payload);
    return data;
  },

  // ── Upload document ──────────────────────────────────────────────────────
  uploadDocument: async (uri: string, type: string): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type:  'image/jpeg',
      name:  `kyc-${type}-${Date.now()}.jpg`,
    } as any);
    formData.append('type', type);

    const { data } = await apiClient.post('/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};