// app/_layout.tsx
// Root layout — providers only, no logic here
// Logic lives in _layout.logic.ts

import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from '@/store';
import { ThemeProvider, useTheme } from '@/theme';
import { ToastRenderer } from '@/components/ui/Toast';
import { useRootLayout } from './_layout.logic';

// Inner component — needs to be inside Provider to access Redux
function RootLayoutInner() {
  const { theme } = useTheme();
  const { fontsLoaded, appReady } = useRootLayout();

  if (!fontsLoaded || !appReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.primary }}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <ToastRenderer />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <RootLayoutInner />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}