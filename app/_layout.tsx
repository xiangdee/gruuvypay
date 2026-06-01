
// Root layout — providers only, zero logic.
// Logic lives in src/screens/useRootLayout.ts (outside Expo Router scan path)

import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor }   from '@/store';
import { ThemeProvider, useTheme } from '@/theme';
import { ToastRenderer }      from '@/components/ui/Toast';
import { useRootLayout }      from '@/screens/useRootLayout';
import { LockScreen }         from '@/components/layout/LockScreen';

function RootLayoutInner() {
  const { theme } = useTheme();
  const { fontsLoaded, appReady, isLocked, onUnlocked } = useRootLayout();

  if (!fontsLoaded || !appReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.primary }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <ToastRenderer />
      {isLocked && <LockScreen onUnlocked={onUnlocked} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <RootLayoutInner />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}