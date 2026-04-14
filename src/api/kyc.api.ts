import apiClient from './client';

export interface KycStatus {
  tier:            string;
  bvnVerified:     boolean;
  ninVerified:     boolean;
  addressVerified: boolean;
  utilityVerified: boolean;
  rejectionReason: string | null;
}

export const kycApi = {
  getStatus: async (): Promise<KycStatus> => {
    const { data } = await apiClient.get('/kyc/status');
    return data;
  },

  verifyBvn: async (payload: {
    bvn:         string;
    dateOfBirth: string;  // YYYY-MM-DD
  }): Promise<{ success: boolean; message: string; tier: string; name?: string }> => {
    const { data } = await apiClient.post('/kyc/bvn', payload);
    return data;
  },

  submitNin: async (payload: {
    nin:            string;
    utilityBillUrl: string;
    utilityType:    string;
  }): Promise<{ success: boolean; message: string; tier: string }> => {
    const { data } = await apiClient.post('/kyc/nin', payload);
    return data;
  },

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

  // Upload document to backend (which stores to S3/Cloudinary)
  // Returns the public URL to use in BVN/NIN/address submissions
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