// src/api/client.ts
//
// Production-grade axios instance for GruuvyPay:
//   - 10s request timeout
//   - Automatic silent refresh on 401
//   - Max 3 retries for network errors (not auth errors)
//   - X-Device-UA header on every request
//   - Request queue during token refresh (no double refresh)

import { ApiLink } from '@/constants/links';
import { getDeviceUA } from '@/utils/device';
import { secureStorage } from '@/utils/secure-storage';
import axios, {
  AxiosInstance, AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
// ── Lazy store import to break require cycle ──────────────────────────────
// client.ts → store → auth.slice → auth.api → client.ts (cycle!)
// Solution: import store lazily inside interceptors, not at module level
let _store: any;
let _setAccessToken: any;
let _clearAuth: any;

function getStore() {
  if (!_store) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const storeModule     = require('@/store');
    const authSliceModule = require('@/store/slices/auth.slice');
    _store           = storeModule.store;
    _setAccessToken  = authSliceModule.setAccessToken;
    _clearAuth       = authSliceModule.clearAuth;
  }
  return { store: _store, setAccessToken: _setAccessToken, clearAuth: _clearAuth };
}


const BASE_URL = ApiLink
const TIMEOUT_MS = 10_000;    // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000; // 1 second base delay (doubles each retry)

// ─── Token refresh queue ──────────────────────────────────────────────
// Prevents multiple concurrent refresh calls when many requests 401 at once

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

// ─── Create instance ──────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────────
// Attaches access token + device UA to every request

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { store } = getStore();
    const state = store.getState();
    const token = state.auth.accessToken;
    

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // X-Device-UA — parsed by server for session management
    config.headers['X-Device-UA'] = await getDeviceUA();

    console.log('config', config);

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────
// Handles 401 → silent refresh → retry original request
// Handles network errors → retry with backoff

apiClient.interceptors.response.use(
  (response) => { 
    
    return response},
  async (error: AxiosError) => {

    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // ── 401 Unauthorized → try silent refresh ─────────────────────────
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
          `${BASE_URL}/auth/silent-refresh`,
          { refreshToken },
          {
            timeout: TIMEOUT_MS,
            headers: { 'X-Device-UA': await getDeviceUA() },
          },
        );

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        const { store, setAccessToken } = getStore();
        store.dispatch(setAccessToken(accessToken));
        await secureStorage.setRefreshToken(newRefreshToken);

        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — log out
        const { store: s, clearAuth } = getStore();
        s.dispatch(clearAuth());
        await secureStorage.clearAll();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Network error / 5xx → retry with exponential backoff ──────────
    const isNetworkError = !error.response;
    const isServerError = (error.response?.status ?? 0) >= 500;

    const isAuthRoute = original.url?.includes('/auth/');

    if ((isNetworkError || isServerError) && !original._retry && !isAuthRoute) {
      original._retryCount = (original._retryCount ?? 0) + 1;

      if (original._retryCount <= MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, original._retryCount - 1);
        await sleep(delay);
        return apiClient(original);
      }
    }

    // ── Format error for consumers ────────────────────────────────────
    return Promise.reject(formatError(error));
  },
);

// ─── Error formatter ──────────────────────────────────────────────────
// Produces consistent error objects for Redux thunks + UI

export interface ApiError {
  message:    string;
  statusCode: number | null;
  code:       string | null;   // e.g. 'PHONE_VERIFICATION_REQUIRED'
  field?:     string;          // field-level validation error
}

function formatError(error: AxiosError): ApiError {
  const data = error.response?.data as any;
  return {
    message:    data?.message ?? error.message ?? 'Something went wrong',
    statusCode: error.response?.status ?? null,
    code:       data?.error ?? null,
    field:      data?.field ?? undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default apiClient;