import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { walletApi } from '@/api/wallet.api';

interface VirtualAccount {
  accountNumber: string;
  bankName:      string;
  accountName:   string;
}

interface Transaction {
  id:        string;
  type:      'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE';
  amount:    string;      // formatted "₦5,000.00"
  amountRaw: string;      // raw kobo string
  status:    'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  reference: string;
  narration: string | null;
  createdAt: string;
  metadata:  any;
}

interface WalletState {
  balance:        string | null;   // formatted "₦0.00"
  balanceRaw:     string | null;   // kobo string — for calculations
  currency:       string;
  balanceVisible: boolean;         // hide/show balance toggle
  virtualAccount: VirtualAccount | null;
  transactions:   Transaction[];
  txPage:         number;
  txTotal:        number;
  txLoading:      boolean;
  loading:        boolean;
  error:          string | null;
}

const initialState: WalletState = {
  balance:        null,
  balanceRaw:     null,
  currency:       'NGN',
  balanceVisible: true,
  virtualAccount: null,
  transactions:   [],
  txPage:         1,
  txTotal:        0,
  txLoading:      false,
  loading:        false,
  error:          null,
};

// ─── Thunks ───────────────────────────────────────────────────────────

export const fetchBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      return await walletApi.getBalance();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchVirtualAccount = createAsyncThunk(
  'wallet/fetchVirtualAccount',
  async (_, { rejectWithValue }) => {
    try {
      return await walletApi.getVirtualAccount();
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      return await walletApi.getTransactions(page, limit);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

export const sendToTag = createAsyncThunk(
  'wallet/sendToTag',
  async (
    payload: { tag: string; amountNaira: string; narration?: string; pin: string },
    { rejectWithValue },
  ) => {
    try {
      return await walletApi.sendToTag(payload);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    toggleBalanceVisibility(state) {
      state.balanceVisible = !state.balanceVisible;
    },
    clearWalletError(state) {
      state.error = null;
    },
    // Called by webhook push notification handler to optimistically update balance
    applyCredit(state, action: PayloadAction<{ amountFormatted: string; amountRaw: string }>) {
      state.balance = action.payload.amountFormatted;
      state.balanceRaw = action.payload.amountRaw;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => { state.loading = true; })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.formatted;
        state.balanceRaw = action.payload.balance;
        state.currency = action.payload.currency;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchVirtualAccount.fulfilled, (state, action) => {
        state.virtualAccount = action.payload;
      });

    builder
      .addCase(fetchTransactions.pending, (state) => { state.txLoading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.txLoading = false;
        const { transactions, pagination } = action.payload;
        state.transactions = pagination.page === 1
          ? transactions
          : [...state.transactions, ...transactions]; // append for pagination
        state.txPage = pagination.page;
        state.txTotal = pagination.total;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.txLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(sendToTag.fulfilled, (state, action) => {
        // Update balance after transfer
        state.balance = action.payload.newBalance;
      });
  },
});

export const { toggleBalanceVisibility, clearWalletError, applyCredit } = walletSlice.actions;
export default walletSlice.reducer;