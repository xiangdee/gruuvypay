// src/components/ui/Button.tsx

import React from 'react';
import {
  Animated, TouchableOpacity, Text,
  StyleSheet, ViewStyle, TextStyle,
  View,
} from 'react-native';
import { useTheme } from '@/theme';
import { textStyles, layout, radius, spacing } from '@/theme';
import { useButtonLogic } from './Button.logic';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label:      string;
  onPress:    () => void;
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  disabled?:  boolean;
  fullWidth?: boolean;
  style?:     ViewStyle;
  textStyle?: TextStyle;
  leftIcon?:  React.ReactNode;
}

export function Button({
  label, onPress, variant = 'primary', size = 'lg',
  loading, disabled, fullWidth = true, style, textStyle, leftIcon,
}: ButtonProps) {
  const { theme } = useTheme();
  const { scale, handlePressIn, handlePressOut } = useButtonLogic(disabled, loading);

  const isDisabled = disabled || loading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    variantStyles(theme)[variant],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyles: TextStyle[] = [
    textStyles.button,
    { color: labelColor(variant, theme) },
    size === 'sm' && (textStyles.buttonSm as TextStyle),
    textStyle,
  ].filter(Boolean) as TextStyle[];


  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={containerStyles}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {loading ? (
    <Spinner color={labelColor(variant, theme)} size="small" />
  ) : (
    <>
      {leftIcon && (
        <View style={styles.leftIcon}>{leftIcon}</View>
      )}
      <Text style={[...labelStyles, { flex: 1, textAlign: 'center' }]}>{label}</Text>
    </>
  )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function variantStyles(theme: any): Record<ButtonVariant, ViewStyle> {
  return {
    primary: {
      backgroundColor: theme.brand.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.brand.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: theme.status.error,
    },
  };
}

function labelColor(variant: ButtonVariant, theme: any): string {
  switch (variant) {
    case 'secondary': return theme.brand.primary;
    case 'ghost':     return theme.text.primary;
    default:          return '#000';
  }
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: 40, borderRadius: radius.lg, paddingHorizontal: spacing[4] },
  md: { height: 48, borderRadius: radius.xl, paddingHorizontal: spacing[5] },
  lg: { height: layout.buttonHeight, borderRadius: radius['3xl'], paddingHorizontal: spacing[6] },
};

const styles = StyleSheet.create({
   leftIcon: {
    position: 'absolute',
    left: spacing[5],
  },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: spacing[2],
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },
});