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

  // ── NIN — MetaMap WebView flow (TIER_1 → TIER_2) ─────────────────────────
  // Returns a verificationUrl; app opens it in an in-app browser.
  // MetaMap handles NIN capture + NIMC lookup internally.
  // Tier upgrade happens server-side when MetaMap fires the webhook.
  startNin: async (): Promise<{
    success:         boolean;
    verificationUrl: string;
    verificationId:  string;
    message:         string;
  }> => {
    const { data } = await apiClient.post('/kyc/nin/start');
    return data;
  },

  // ── Address — Manual submission (TIER_2 → TIER_3, admin approves) ───────
  submitAddressManually: async (params: {
    address: string;
    city:    string;
    state:   string;
  }): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post('/kyc/address/submit', params);
    return data;
  },
};