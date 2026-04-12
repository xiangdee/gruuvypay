// Rendered once in _layout.tsx — sits above everything

import React from 'react';
import {
  Animated, View, Text, TouchableOpacity,
  StyleSheet, Platform, ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import type { ToastType } from '@/store/slices/ui.slice';
import { useToastLogic } from './Toast.logic';

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; iconColor: string }> = {
  success: { icon: 'checkmark-circle',  bg: '#0D2D1F', iconColor: '#10B981' },
  error:   { icon: 'alert-circle',      bg: '#2D0D0D', iconColor: '#EF4444' },
  warning: { icon: 'warning',           bg: '#2D1F0D', iconColor: '#F59E0B' },
  info:    { icon: 'information-circle', bg: '#0D1A2D', iconColor: '#3B82F6' },
};

export function ToastRenderer() {
  const { toast, slideY, opacity, dismiss } = useToastLogic();
  const { theme } = useTheme();
  const insets  = useSafeAreaInsets();

  if (!toast) return null;

  const config = TOAST_CONFIG[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top:             insets.top + spacing[3],
          transform:       [{ translateY: slideY }],
          opacity,
          backgroundColor: config.bg,
          borderColor:     config.iconColor + '40',
        },
      ]}
    >
      <Ionicons
        name={config.icon as any}
        size={22}
        color={config.iconColor}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={[textStyles.label, { color: theme.text.primary }]}>
          {toast.title}
        </Text>
        {toast.message && (
          <Text style={[textStyles.bodySm, { color: theme.text.secondary, marginTop: 2 }]}>
            {toast.message}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.close}>
        <Ionicons name="close" size={18} color={theme.text.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:      'absolute',
    left:          spacing[4],
    right:         spacing[4],
    zIndex:        9999,
    borderRadius:  radius.xl,
    borderWidth:   1,
    flexDirection: 'row',
    alignItems:    'center',
    padding:       spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  icon:          { marginRight: spacing[3] },
  textContainer: { flex: 1 },
  close:         { padding: spacing[1], marginLeft: spacing[2] },
});