import { TwoFaType } from '@/types/two-fa.types';
// src/api/auth.api.ts

import apiClient from './client';
import type {
  RegisterPayload, LoginPayload,
  AuthResponse, TwoFaResponse,
  PhoneOtpResponse, VerifyPhonePayload,
  SetPinPayload, BiometricsPayload,
} from '@/types/auth.types';

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse | TwoFaResponse> => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },

  completeTwoFa: async (payload: {
    userId: string; token: string; code: string;
    twoFaType: TwoFaType; deviceName: string;
  }): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login/2fa', payload);
    return data;
  },

  silentRefresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> => {
    const { data } = await apiClient.post('/auth/silent-refresh', { refreshToken });
    return data;
  },

  logout: async (payload: { refreshToken: string; accessTokenJti?: string }): Promise<void> => {
    await apiClient.post('/auth/logout', payload);
  },

  // Phone
  sendPhoneOtp: async (phone: string): Promise<PhoneOtpResponse> => {
    const { data } = await apiClient.post('/auth/phone/send-otp', { phone });
    return data;
  },

  verifyPhone: async (payload: VerifyPhonePayload): Promise<{ message: string; onboardingStep: string }> => {
    const { data } = await apiClient.post('/auth/phone/verify', payload);
    return data;
  },

  // PIN
  setPin: async (payload: SetPinPayload): Promise<{ message: string; onboardingStep: string; tier: string; virtualAccount: any }> => {
    const { data } = await apiClient.post('/auth/pin/set', payload);
    return data;
  },

  changePin: async (payload: { currentPin: string; newPin: string; confirmPin: string }): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/pin/change', payload);
    return data;
  },

  // Biometrics
  setBiometrics: async (payload: BiometricsPayload): Promise<{ message: string; onboardingStep: string }> => {
    const { data } = await apiClient.post('/auth/biometrics', payload);
    return data;
  },

  // Me
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  //sessions
  getSessions: async () => {
    const { data } = await apiClient.get('/auth/sessions');
    return data;
  },
  // delete
  revokeSession: async (sessionId: string) => {
    const { data } = await apiClient.post('/auth/sessions/revoke', { sessionId });
    return data;
  },

  // ── 2FA Management ────────────────────────────────────────────────
  setup2fa: async (type: 'email' | 'authy'): Promise<{
    type: string; message: string;
    qrcode?: string; secret?: string; backupCodes?: string[]; token?: string;
  }> => {
    const { data } = await apiClient.post('/auth/2fa/setup', { type });
    return data;
  },

  confirm2fa: async (payload: { code: string; token?: string }): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/2fa/confirm', payload);
    return data;
  },

  disable2fa: async (pin: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/2fa/disable', { pin });
    return data;
  },

  // CSRF
  getCsrfToken: async (): Promise<string> => {
    const { data } = await apiClient.get('/auth/csrf');
    return data.csrfToken;
  },

  // Email verification
  verifyEmail: async (token: string): Promise<{ verified: boolean }> => {
    const { data } = await apiClient.post('/auth/email/verify', { token });
    return data;
  },

  resendVerificationEmail: async (email: string): Promise<void> => {
    await apiClient.post('/auth/email/resend', { email });
  },

  // ── Forgot PIN ─────────────────────────────────────────────────────
  // Step 1: send OTP to phone (server verifies phone exists on an account)
  sendForgotPinOtp: async (phone: string): Promise<{ message: string; pinId: string }> => {
    const { data } = await apiClient.post('/auth/pin/forgot/send-otp', { phone });
    return data;
  },

  // Step 2: verify OTP — server issues a short-lived reset token
  verifyForgotPinOtp: async (payload: {
    phone: string; otp: string; pinId: string;
  }): Promise<{ resetToken: string }> => {
    const { data } = await apiClient.post('/auth/pin/forgot/verify-otp', payload);
    return data;
  },

  // Step 3: set new PIN using the reset token
  resetPin: async (payload: {
    phone: string; pin: string; confirmPin: string;
  }): Promise<{ message: string }> => {
    const { data } = await apiClient.post('/auth/pin/reset', payload);
    return data;
  },
};