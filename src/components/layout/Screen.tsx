// Safe area aware screen wrapper — use on every screen

import React from 'react';
import { View, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, layout, spacing } from '@/theme';

interface ScreenProps {
  children:     React.ReactNode;
  scrollable?:  boolean;
  style?:       ViewStyle;
  contentStyle?: ViewStyle;
  padded?:      boolean;   // applies horizontal screen padding
}

export function Screen({ children, scrollable, style, contentStyle, padded = true }: ScreenProps) {
  const { theme } = useTheme();

  const inner = (
    <View
      style={[
        styles.inner,
        padded && styles.padded,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.bg.primary }, style]}
      edges={['top', 'left', 'right']}
    >
      {scrollable
        ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {inner}
          </ScrollView>
        )
        : inner
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  inner:  { flex: 1 },
  padded: { paddingHorizontal: layout.screenPaddingH },
  scroll: { flexGrow: 1 },
});