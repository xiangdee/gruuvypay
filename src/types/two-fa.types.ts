// src/types/two-fa.types.ts
// Mirrors the backend TwoFaType enum exactly
// Backend: generated/prisma/enums TwoFaType { email, authy, all, none }

export enum TwoFaType {
  email = 'email',
  authy = 'authy',
  all   = 'all',
  none  = 'none',
}

export function twoFaTypeLabel(type: TwoFaType | string | null | undefined): string {
  switch (type) {
    case TwoFaType.authy: return 'Authenticator App';
    case TwoFaType.email: return 'Email OTP';
    case TwoFaType.all:   return 'All Methods';
    case TwoFaType.none:
    default:              return 'Off';
  }
}

export function twoFaTypeIsActive(type: TwoFaType | string | null | undefined): boolean {
  return type === TwoFaType.email || type === TwoFaType.authy || type === TwoFaType.all;
}