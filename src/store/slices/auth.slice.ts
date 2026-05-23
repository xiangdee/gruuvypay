import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/api/auth.api';
import { secureStorage } from '@/utils/secure-storage';
import type {
  RegisterPayload, LoginPayload,
  AuthUser, OnboardingStep,
} from '@/types/auth.types';

// ─── State ────────────────────────────────────────────────────────────

interface AuthState {
  user:             AuthUser | null;
  accessToken:      string | null;
  isAuthenticated:  boolean;
  onboardingStep:   OnboardingStep | null;
  loading:          boolean;
  error:            string | null;
  
}

const initialState: AuthState = {
  user:             null,
  accessToken:      null,
  isAuthenticated:  false,
  onboardingStep:   null,
  loading:          false,
  error:            null,
};

// ─── Thunks ───────────────────────────────────────────────────────────

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.register(payload);
      // Refresh token lives in secure storage only — never in Redux
      await secureStorage.setRefreshToken(res.refreshToken);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Registration failed');
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.login(payload);
      if ('type' in res && res.type === 'twoFa') return res; // handled by component, no token
      await secureStorage.setRefreshToken((res as any).refreshToken);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Login failed');
    }
  },
);

export const silentRefresh = createAsyncThunk(
  'auth/silentRefresh',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No session');
      const res = await authApi.silentRefresh(refreshToken);
      await secureStorage.setRefreshToken(res.refreshToken);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Session expired');
    }
  },
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {

      return await authApi.getMe();
    } catch (err: any) {
      return rejectWithValue(err.message ?? 'Failed to fetch user');
    }
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      const state = getState() as any;
      await authApi.logout({
        refreshToken: refreshToken ?? '',
        accessTokenJti: state.auth.accessToken
          ? parseJti(state.auth.accessToken)
          : undefined,
      });
    } catch {
      // Always clear local state even if server call fails
    } finally {
      await secureStorage.clearAll();
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.onboardingStep = action.payload.onboardingStep ?? null;
    },
    setOnboardingStep(state, action: PayloadAction<OnboardingStep>) {
      state.onboardingStep = action.payload;
      if (state.user) state.user.onboardingStep = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.onboardingStep = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.onboardingStep = action.payload.user.onboardingStep;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload as any;
        if (payload.type === 'twoFa') return; // handled by component, no token yet
        // 'incomplete' and normal success both have accessToken + user — store them the same way.
        // useRootLayout route guard reads onboardingStep and navigates to the right screen.
        state.accessToken     = payload.accessToken;
        state.user            = payload.user;
        state.onboardingStep  = payload.user?.onboardingStep ?? null;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Silent refresh
    builder
      .addCase(silentRefresh.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(silentRefresh.rejected, (state) => {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.user = null;
      });

      //fetch user
      builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
       
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      return initialState;
    });
  },
});

export const {
  setAccessToken, setUser, setOnboardingStep,
  clearError, clearAuth,
} = authSlice.actions;

export default authSlice.reducer;

// ─── Helpers ──────────────────────────────────────────────────────────
function parseJti(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.jti;
  } catch {
    return undefined;
  }
}