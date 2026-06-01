// src/store/slices/crypto.slice.ts
// Persisted — last known wallets + prices show instantly on app open,
// fresh data loads in background (stale-while-revalidate).

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cryptoApi, CryptoWallet }       from '@/api/crypto.api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CryptoPrice {
  priceUSD:  number;
  priceNGN:  number;
  change24h: number;
}

interface CryptoState {
  wallets:        CryptoWallet[];
  prices:         Record<string, CryptoPrice>;
  walletsLoading: boolean;
  pricesLoading:  boolean;
  error:          string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: CryptoState = {
  wallets:        [],
  prices:         {},
  walletsLoading: false,
  pricesLoading:  false,
  error:          null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCryptoWallets = createAsyncThunk(
  'crypto/fetchWallets',
  async (_, { rejectWithValue }) => {
    try {
      return await cryptoApi.getWallets();
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? err.message);
    }
  },
);

export const fetchCryptoPrices = createAsyncThunk(
  'crypto/fetchPrices',
  async (_, { rejectWithValue }) => {
    try {
      return await cryptoApi.getAllPrices() as Record<string, { priceUSD: number; change24h: number }>;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? err.message);
    }
  },
);

// Convenience thunk — fetch both together
export const fetchCryptoData = createAsyncThunk(
  'crypto/fetchAll',
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchCryptoWallets()),
      dispatch(fetchCryptoPrices()),
    ]);
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const NGN_PER_USD = 1615; // fallback rate — real rate comes from prices API

const cryptoSlice = createSlice({
  name: 'crypto',
  initialState,
  reducers: {
    clearCryptoError(state) {
      state.error = null;
    },
    // Optimistically update a single wallet balance after a sell/buy
    updateWalletBalance(state, action: { payload: { symbol: string; balance: string } }) {
      const w = state.wallets.find((w) => w.symbol === action.payload.symbol);
      if (w) w.balance = action.payload.balance;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCryptoWallets.pending, (state) => {
        state.walletsLoading = true;
      })
      .addCase(fetchCryptoWallets.fulfilled, (state, action) => {
        state.walletsLoading = false;
        state.wallets        = action.payload;
        state.error          = null;
      })
      .addCase(fetchCryptoWallets.rejected, (state, action) => {
        state.walletsLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchCryptoPrices.pending, (state) => {
        state.pricesLoading = true;
      })
      .addCase(fetchCryptoPrices.fulfilled, (state, action) => {
        state.pricesLoading = false;
        const formatted: Record<string, CryptoPrice> = {};
        for (const [symbol, raw] of Object.entries(action.payload)) {
          formatted[symbol] = {
            priceUSD:  raw.priceUSD,
            priceNGN:  raw.priceUSD * NGN_PER_USD,
            change24h: raw.change24h ?? 0,
          };
        }
        state.prices = formatted;
        state.error  = null;
      })
      .addCase(fetchCryptoPrices.rejected, (state, action) => {
        state.pricesLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCryptoError, updateWalletBalance } = cryptoSlice.actions;
export default cryptoSlice.reducer;
