import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setColorScheme } from '@/store/slices/ui.slice';
import { darkTheme, lightTheme, type Theme, type ColorScheme } from './colors';

interface ThemeContextValue {
  theme: Theme;
  colorScheme: ColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  colorScheme: 'dark',
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const systemScheme = useColorScheme();

  // User preference from Redux (can override system)
  const userPreference = useAppSelector((s) => s.ui.colorScheme);

  // 'system' means follow OS, otherwise use user's explicit choice
  const resolvedScheme: ColorScheme =
    userPreference === 'system'
      ? (systemScheme as ColorScheme) ?? 'dark'
      : userPreference;

  const isDark = resolvedScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  // Sync system preference into Redux on mount
  useEffect(() => {
    if (systemScheme && userPreference === 'system') {
      dispatch(setColorScheme('system'));
    }
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ theme, colorScheme: resolvedScheme, isDark }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg.primary}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}