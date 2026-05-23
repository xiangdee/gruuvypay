import { TwoFaType } from './two-fa.types';
// src/types/auth.types.ts

export type OnboardingStep = 'PHONE' | 'PIN' | 'BIOMETRICS' | 'COMPLETE';
export type Tier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';

export interface AuthUser {
  id:                string;
  username:          string;   
  email:             string;
  firstName:         string;
  lastName:          string;
  tier:              Tier;
  onboardingStep:    OnboardingStep;
  isPhoneVerified:   boolean;
  isBiometricEnabled: boolean;
  twoFaType?: TwoFaType | null;
  isTwofaActive?: boolean;
  phone:string;
}

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
  user:         AuthUser;
  deviceSession?: any;
  virtualAccount?: any;
}

export interface TwoFaResponse {
  type:      'twoFa';
  message:   string;
  twoFaType: TwoFaType;
  token:     string;
}

export interface RegisterPayload {
  email:         string;
  username:      string;
  firstName:     string;
  lastName:      string;
  referralCode?: string;
  captchaToken?: string;
}

export interface LoginPayload {
  identifier:    string;   // username or email
  pin:           string;
  deviceId?:     string;
  captchaToken?: string;
}

export interface PhoneOtpResponse {
  message: string;
  pinId:   string;
}

export interface VerifyPhonePayload {
  phone: string;
  otp:   string;
  pinId: string;
}

export interface SetPinPayload {
  pin:        string;
  confirmPin: string;
}

export interface BiometricsPayload {
  enabled: boolean;
}