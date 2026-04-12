import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Animated, StyleSheet, TextInputProps, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius, layout } from '@/theme';
import { useInputLogic } from './Input.logic';

interface InputProps extends TextInputProps {
  label?:       string;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  secureEntry?: boolean;   // shows eye toggle
  containerStyle?: ViewStyle;
}

export function Input({
  label, error, hint, leftIcon, secureEntry,
  containerStyle, ...props
}: InputProps) {
  const { theme } = useTheme();
  const { isFocused, showValue, borderAnim, onFocus, onBlur, toggleShowValue } = useInputLogic();

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      error ? theme.border.error : theme.border.DEFAULT,
      error ? theme.border.error : theme.border.focus,
    ],
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[textStyles.label, { color: theme.text.secondary, marginBottom: spacing[2] }]}>
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg.input,
            borderColor,
            borderWidth: 1.5,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}

        <TextInput
          {...props}
          onFocus={(e) => { onFocus(); props.onFocus?.(e); }}
          onBlur={(e)  => { onBlur();  props.onBlur?.(e);  }}
          secureTextEntry={secureEntry && !showValue}
          style={[
            styles.input,
            textStyles.body,
            { color: theme.text.primary, flex: 1 },
            leftIcon ? { paddingLeft: 0 } : undefined,,
          ]}
          placeholderTextColor={theme.text.muted}
          selectionColor={theme.brand.primary}
        />

        {secureEntry && (
          <TouchableOpacity onPress={toggleShowValue} style={styles.rightIcon}>
            <Ionicons
              name={showValue ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.text.muted}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {error && (
        <Text style={[textStyles.caption, { color: theme.status.error, marginTop: spacing[1] }]}>
          {error}
        </Text>
      )}

      {hint && !error && (
        <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[1] }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { width: '100%' },
  container: {
    height: layout.inputHeight,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    overflow: 'hidden',
  },
  input:     { fontSize: 15, paddingVertical: 0 },
  leftIcon:  { marginRight: spacing[3] },
  rightIcon: { padding: spacing[1], marginLeft: spacing[2] },
});