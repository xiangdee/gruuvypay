// src/services/recentCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentTransfer {
  id:         string;
  type:       'tag' | 'bank';
  name:       string;
  identifier: string;  // GruuvyTag (without @) or account number
  bankCode?:  string;
  bankName?:  string;
}

export interface RecentBillContact {
  phone:       string;
  networkId:   string;
  networkName: string;
  networkLogo: string;
}

export interface ElectricityBeneficiary {
  meterNumber:  string;
  meterType:    'prepaid' | 'postpaid';
  customerName: string;
  providerId:   string;
  providerName: string;
  providerLogo: string;
}

export interface CableBeneficiary {
  smartcard:    string;
  customerName: string;
  providerId:   string;
  providerName: string;
  providerLogo: string;
}

export interface BettingBeneficiary {
  accountId:    string;
  providerId:   string;
  providerName: string;
}

const TRANSFERS_KEY       = '@gruuvy:recent_transfers_v1';
const BILLS_KEY           = '@gruuvy:recent_bills_v1';
const ELECTRICITY_KEY     = '@gruuvy:recent_electricity_v1';
const CABLE_KEY           = '@gruuvy:recent_cable_v1';
const BETTING_KEY         = '@gruuvy:recent_betting_v1';
const BENEFICIARIES_KEY   = '@gruuvy:beneficiaries_cache_v1';
const MAX                 = 8;

async function read<T>(key: string): Promise<T[]> {
  try {
    const s = await AsyncStorage.getItem(key);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

async function write<T>(key: string, data: T[]) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export const recentCache = {
  // ─── Transfers ─────────────────────────────────────────────────────────
  getTransfers: (): Promise<RecentTransfer[]> => read(TRANSFERS_KEY),

  addTransfer: async (item: RecentTransfer) => {
    const list    = await read<RecentTransfer>(TRANSFERS_KEY);
    const deduped = list.filter((t) => !(t.type === item.type && t.identifier === item.identifier));
    await write(TRANSFERS_KEY, [item, ...deduped].slice(0, MAX));
  },

  clearTransfers: () => AsyncStorage.removeItem(TRANSFERS_KEY).catch(() => {}),

  // ─── Bill contacts (airtime + data share one cache) ────────────────────
  getBillContacts: (): Promise<RecentBillContact[]> => read(BILLS_KEY),

  addBillContact: async (item: RecentBillContact) => {
    const list    = await read<RecentBillContact>(BILLS_KEY);
    const deduped = list.filter((t) => !(t.phone === item.phone && t.networkId === item.networkId));
    await write(BILLS_KEY, [item, ...deduped].slice(0, MAX));
  },

  clearBillContacts: () => AsyncStorage.removeItem(BILLS_KEY).catch(() => {}),

  // ─── Electricity meters ────────────────────────────────────────────────
  getElectricityBeneficiaries: (): Promise<ElectricityBeneficiary[]> => read(ELECTRICITY_KEY),

  addElectricityBeneficiary: async (item: ElectricityBeneficiary) => {
    const list    = await read<ElectricityBeneficiary>(ELECTRICITY_KEY);
    const deduped = list.filter((t) => !(t.meterNumber === item.meterNumber && t.providerId === item.providerId));
    await write(ELECTRICITY_KEY, [item, ...deduped].slice(0, MAX));
  },

  // ─── Cable smartcards ──────────────────────────────────────────────────
  getCableBeneficiaries: (): Promise<CableBeneficiary[]> => read(CABLE_KEY),

  addCableBeneficiary: async (item: CableBeneficiary) => {
    const list    = await read<CableBeneficiary>(CABLE_KEY);
    const deduped = list.filter((t) => !(t.smartcard === item.smartcard && t.providerId === item.providerId));
    await write(CABLE_KEY, [item, ...deduped].slice(0, MAX));
  },

  // ─── Betting accounts ──────────────────────────────────────────────────
  getBettingBeneficiaries: (): Promise<BettingBeneficiary[]> => read(BETTING_KEY),

  addBettingBeneficiary: async (item: BettingBeneficiary) => {
    const list    = await read<BettingBeneficiary>(BETTING_KEY);
    const deduped = list.filter((t) => !(t.accountId === item.accountId && t.providerId === item.providerId));
    await write(BETTING_KEY, [item, ...deduped].slice(0, MAX));
  },

  // ─── Server beneficiaries stale-while-revalidate cache ────────────────
  getCachedBeneficiaries: (type?: string): Promise<any[]> => {
    const key = type ? `${BENEFICIARIES_KEY}:${type}` : BENEFICIARIES_KEY;
    return read<any>(key);
  },

  setCachedBeneficiaries: async (data: any[], type?: string) => {
    const key = type ? `${BENEFICIARIES_KEY}:${type}` : BENEFICIARIES_KEY;
    await write<any>(key, data);
  },

  clearCachedBeneficiaries: async (type?: string) => {
    const key = type ? `${BENEFICIARIES_KEY}:${type}` : BENEFICIARIES_KEY;
    await AsyncStorage.removeItem(key).catch(() => {});
  },
};
