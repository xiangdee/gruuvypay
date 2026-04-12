import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorScheme } from '../../theme';


export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id:       string;
  type:     ToastType;
  title:    string;
  message?: string;
  duration?: number;   // ms — default 4000
}

interface UiState {
  colorScheme:   ColorScheme | 'system';
  toast:         ToastMessage | null;
  globalLoading: boolean;
  loadingLabel:  string | null;
}

const initialState: UiState = {
  colorScheme:   'dark',       // GruuvyPay is dark by default
  toast:         null,
  globalLoading: false,
  loadingLabel:  null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setColorScheme(state, action: PayloadAction<ColorScheme | 'system'>) {
      state.colorScheme = action.payload;
    },

    showToast(state, action: PayloadAction<Omit<ToastMessage, 'id'>>) {
      state.toast = {
        ...action.payload,
        id: Date.now().toString(),
        duration: action.payload.duration ?? 4000,
      };
    },

    hideToast(state) {
      state.toast = null;
    },

    setGlobalLoading(state, action: PayloadAction<{ loading: boolean; label?: string }>) {
      state.globalLoading = action.payload.loading;
      state.loadingLabel = action.payload.label ?? null;
    },
  },
});

export const { setColorScheme, showToast, hideToast, setGlobalLoading } = uiSlice.actions;
export default uiSlice.reducer;