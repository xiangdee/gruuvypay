// src/config/bills.config.ts

export interface BillProvider {
  id:        string;   // VTpass serviceID
  name:      string;
  logo:      string;   // emoji placeholder — replace with actual assets
  color:     string;
}

// ─── Airtime ──────────────────────────────────────────────────────────────
export const AIRTIME_PROVIDERS: BillProvider[] = [
  { id: 'mtn',     name: 'MTN',     logo: '📱', color: '#FFCC00' },
  { id: 'airtel',  name: 'Airtel',  logo: '📡', color: '#E40000' },
  { id: 'glo',     name: 'Glo',     logo: '🟢', color: '#007A00' },
  { id: 'etisalat',name: '9mobile', logo: '💚', color: '#00A651' },
];

// ─── Data ─────────────────────────────────────────────────────────────────
export const DATA_PROVIDERS: BillProvider[] = [
  { id: 'mtn-data',     name: 'MTN Data',     logo: '📱', color: '#FFCC00' },
  { id: 'airtel-data',  name: 'Airtel Data',  logo: '📡', color: '#E40000' },
  { id: 'glo-data',     name: 'Glo Data',     logo: '🟢', color: '#007A00' },
  { id: 'etisalat-data',name: '9mobile Data', logo: '💚', color: '#00A651' },
];

// ─── Electricity (DISCOs) ─────────────────────────────────────────────────
export const ELECTRICITY_PROVIDERS: BillProvider[] = [
  { id: 'ikeja-electric',     name: 'Ikeja Electric',      logo: '⚡', color: '#003399' },
  { id: 'eko-electric',       name: 'Eko Electric',        logo: '⚡', color: '#006600' },
  { id: 'abuja-electric',     name: 'Abuja Electric',      logo: '⚡', color: '#CC0000' },
  { id: 'phed',               name: 'PHED (Port Harcourt)',logo: '⚡', color: '#FF6600' },
  { id: 'kano-electric',      name: 'Kano Electric',       logo: '⚡', color: '#009900' },
  { id: 'enugu-electric',     name: 'Enugu Electric',      logo: '⚡', color: '#333333' },
  { id: 'jos-electric',       name: 'JED (Jos)',            logo: '⚡', color: '#660066' },
  { id: 'benin-electric',     name: 'BEDC (Benin)',        logo: '⚡', color: '#006633' },
  { id: 'kaduna-electric',    name: 'KAEDCO (Kaduna)',     logo: '⚡', color: '#003366' },
];

// Meter types for electricity
export const METER_TYPES = [
  { code: 'prepaid',  label: 'Prepaid' },
  { code: 'postpaid', label: 'Postpaid' },
];

// ─── Cable TV ─────────────────────────────────────────────────────────────
export const CABLE_PROVIDERS: BillProvider[] = [
  { id: 'dstv',       name: 'DStv',       logo: '📺', color: '#003087' },
  { id: 'gotv',       name: 'GOtv',       logo: '📺', color: '#E31837' },
  { id: 'startimes',  name: 'Startimes',  logo: '📺', color: '#1A478B' },
];

// ─── Betting (top-up) ─────────────────────────────────────────────────────
export const BETTING_PROVIDERS: BillProvider[] = [
  { id: 'bet9ja',       name: 'Bet9ja',      logo: '🎰', color: '#00AA00' },
  { id: 'betway',       name: 'Betway',      logo: '🎯', color: '#009900' },
  { id: 'sportybet',    name: 'SportyBet',   logo: '⚽', color: '#FF0000' },
  { id: '1xbet',        name: '1xBet',       logo: '🎲', color: '#1C3F6E' },
  { id: 'nairabet',     name: 'NairaBet',    logo: '🏆', color: '#003399' },
  { id: 'betking',      name: 'BetKing',     logo: '👑', color: '#004B87' },
];