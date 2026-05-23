// 6 individual boxes — matches the verify email screenshot exactly

import React from 'react';
import {
  View, TextInput, StyleSheet, ViewStyle,
} from 'react-native';
import { useTheme, spacing, radius } from '@/theme';
import { useOtpInputLogic } from './OtpInput.logic';

interface OtpInputProps {
  onComplete:   (otp: string) => void;
  error?:       boolean;
  style?:       ViewStyle;
  onRef?:       (api: { reset: () => void }) => void;
}

export function OtpInput({ onComplete, error, style, onRef }: OtpInputProps) {
  const { theme } = useTheme();
  const { otp, activeIndex, handleChange, handleKeyPress, handlePaste, reset, setRef } =
    useOtpInputLogic(onComplete);

  React.useEffect(() => {
    onRef?.({ reset });
  }, []);

  return (
    <View style={[styles.row, style]}>
      {otp.map((digit, i) => {
        const isActive = i === activeIndex;
        const hasValue = digit !== '';
        return (
          <TextInput
            key={i}
            ref={(el) => setRef(el, i)}
            value={digit}
            onChangeText={(text) => {
              // Handle paste into first box
              if (text.length > 1 && i === 0) {
                handlePaste(text);
                return;
              }
              handleChange(text, i);
            }}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={i === 0 ? 6 : 1} // allow paste on first box
            textAlign="center"
            selectionColor={theme.brand.primary}
            autoFocus={i === 0}
            style={[
              styles.box,
              {
                color:           theme.text.primary,
                backgroundColor: theme.bg.input,
                borderColor:     isActive
                  ? theme.border.focus
                  : error
                  ? theme.border.error
                  : hasValue
                  ? theme.border.focus
                  : theme.border.DEFAULT,
                borderWidth: isActive || hasValue ? 2 : 1.5,
                fontSize:    22,
                fontWeight:  '600',
              },
            ]}
            returnKeyType={'done'}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'center',
  },
  box: {
    width:        52,
    height:       56,
    borderRadius: radius.lg,
  },
});