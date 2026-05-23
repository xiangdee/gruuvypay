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
  amountNaira: string
}

interface WalletState {
  balance:         string | null;  // formatted "₦5,000.00"
  balanceRaw:      string | null;  // raw kobo string — used for math/validation
  currency:        string;
  balanceVisible:  boolean;
  virtualAccount:  VirtualAccount | null;
  vaLoading:       boolean;        // separate loading for VA fetch
  transactions:    Transaction[];
  txPage:          number;
  txTotal:         number;
  txLoading:       boolean;
  txHasMore:       boolean; 
  loading:         boolean;
  dailySpentNaira: number;         // total NGN sent today — for tier limit display
  error:           string | null;

}

const initialState: WalletState = {
  balance: null,
  balanceRaw: null,
  currency: 'NGN',
  balanceVisible: true,
  virtualAccount: null,
  vaLoading: false,
  transactions: [],
  txPage: 1,
  txTotal: 0,
  txLoading: false,
  loading: false,
  dailySpentNaira: 0,
  error: null,
  txHasMore: false
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
  async ({ page = 1, limit = 20 ,type}: { page?: number; limit?: number, type?: string }, { rejectWithValue }) => {
    try {
      return await walletApi.getTransactions(page, limit,type);
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  },
);

export const sendToTag = createAsyncThunk(
  'wallet/sendToTag',
  async (
    payload: {
      tag:            string;
      amountNaira:    string;
      narration?:     string;
      pin:            string;
      idempotencyKey: string;
    },
    { rejectWithValue },
  ) => {
    try {
      return await walletApi.sendToTag(payload);
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.message ?? err.message);
    }
  },
);
export const fetchMoreTransactions = createAsyncThunk(
  'wallet/fetchMoreTransactions',
  async (
    { type }: { type?: string },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { wallet: { txPage: number; txHasMore: boolean } };
      if (!state.wallet.txHasMore) return null;
      const nextPage = state.wallet.txPage + 1;
      return await walletApi.getTransactions(nextPage, 20, type);
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
    // Called by webhook push notification to optimistically update balance
    applyCredit(state, action: PayloadAction<{ amountFormatted: string; amountRaw: string }>) {
      state.balance    = action.payload.amountFormatted;
      state.balanceRaw = action.payload.amountRaw;
    },
    // Reset daily spend counter — call this at midnight or on day change
    resetDailySpend(state) {
      state.dailySpentNaira = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => { state.loading = true; })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.balanceRaw = action.payload.balanceRaw;
        state.currency = action.payload.currency;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
 
    builder
      .addCase(fetchVirtualAccount.pending, (state) => {
        state.vaLoading = true;
      })
      .addCase(fetchVirtualAccount.fulfilled, (state, action) => {
        state.vaLoading    = false;
        state.virtualAccount = action.payload;
      })
      .addCase(fetchVirtualAccount.rejected, (state) => {
        state.vaLoading = false;
      });
 
    builder
      .addCase(fetchTransactions.pending, (state) => { state.txLoading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.txLoading = false;
        const { transactions, pagination } = action.payload;
        state.transactions = pagination.page === 1
          ? transactions
          : [...state.transactions, ...transactions];
        state.txPage    = pagination.page;
        state.txTotal   = pagination.total;
        state.txHasMore = transactions.length === (pagination.limit ?? 20) &&
          state.transactions.length < pagination.total;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.txLoading = false;
        state.error = action.payload as string;
      });
 
    builder
      .addCase(fetchMoreTransactions.pending, (state) => { state.txLoading = true; })
      .addCase(fetchMoreTransactions.fulfilled, (state, action) => {
        state.txLoading = false;
        if (!action.payload) return;
        const { transactions, pagination } = action.payload;
        state.transactions = [...state.transactions, ...transactions];
        state.txPage       = pagination.page;
        state.txTotal      = pagination.total;
        state.txHasMore    = transactions.length === (pagination.limit ?? 20) &&
          state.transactions.length < pagination.total;
      })
      .addCase(fetchMoreTransactions.rejected, (state) => { state.txLoading = false; });
 
    builder
      .addCase(sendToTag.fulfilled, (state, action) => {
        state.balance    = action.payload.newBalance;
        // Track daily spend for tier limit display (not authoritative — backend enforces)
        const sent = parseFloat(action.payload.amountNaira ?? '0');
        if (!isNaN(sent)) state.dailySpentNaira += sent;
      });
  },
});
 

export const { toggleBalanceVisibility, clearWalletError, applyCredit, resetDailySpend } = walletSlice.actions;

export default walletSlice.reducer;