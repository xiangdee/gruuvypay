import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/api/client';

export interface FxRates {
  base:      string;
  rates:     Record<string, number>;
  fetchedAt: number;
}

interface CurrencyState {
  rates:      FxRates | null;
  userCode:   string;   // e.g. 'NGN'
  userSymbol: string;   // e.g. '₦'
  loading:    boolean;
  error:      string | null;
}

const initialState: CurrencyState = {
  rates:      null,
  userCode:   'NGN',
  userSymbol: '₦',
  loading:    false,
  error:      null,
};

export const fetchRates = createAsyncThunk(
  'currency/fetchRates',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/currency/rates');
      return data as FxRates;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? err.message);
    }
  },
);

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setUserCurrency(state, action: PayloadAction<{ code: string; symbol: string }>) {
      state.userCode   = action.payload.code;
      state.userSymbol = action.payload.symbol;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRates.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchRates.fulfilled, (state, action) => {
        state.loading = false;
        state.rates   = action.payload;
      })
      .addCase(fetchRates.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });
  },
});

export const { setUserCurrency } = currencySlice.actions;
export default currencySlice.reducer;