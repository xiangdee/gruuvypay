// src/store/index.ts

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore, persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/auth.slice';
import uiReducer from './slices/ui.slice';
import walletReducer from './slices/wallet.slice';
import currencyReducer from './slices/currency.slice';

// ─── Persist configs ──────────────────────────────────────────────────
// IMPORTANT: Never persist the access token — always re-derive from
// secure storage via silentRefresh on app boot.
// Persist only: UI preferences, user metadata (not tokens)

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'isAuthenticated', 'onboardingStep','currency'],
  // accessToken intentionally excluded — lives in memory only
};

const uiPersistConfig = {
  key: 'ui',
  storage: AsyncStorage,
  whitelist: ['colorScheme'], // persist theme preference
};


// Wallet is NOT persisted — always fresh from API
// Balance shown from cache only during loading state

const rootReducer = combineReducers({
  auth:   persistReducer(authPersistConfig, authReducer),
  ui:     persistReducer(uiPersistConfig, uiReducer),
  wallet: walletReducer,  // no persistence — always refetch
  currency: persistReducer(authPersistConfig,currencyReducer)
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Required by redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;