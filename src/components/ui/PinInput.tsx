// Matches the 4-dot PIN entry UI from screenshots
// Teal dots, custom numpad, shake on error

import React from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  StyleSheet, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius, textStyles } from '@/theme';
import { palette } from '@/theme/colors';
import { usePinInputLogic } from './PinInput.logic';

interface PinInputProps {
  onComplete:     (pin: string) => void;
  error?:         boolean;
  style?:         ViewStyle;
  showBiometrics?: boolean;
  onBiometrics?:  () => void;
  // expose ref functions via callback ref
  onRef?:         (api: { shake: () => void; reset: () => void }) => void;
}

const NUMPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'delete'],
];

export function PinInput({ onComplete, error, style, showBiometrics, onBiometrics, onRef }: PinInputProps) {
  const { theme } = useTheme();
  const { pin, activeIndex, shakeAnim, dotAnims, handleKeyPress, reset, shake } =
    usePinInputLogic(onComplete);

  // Expose shake/reset to parent
  React.useEffect(() => {
    onRef?.({ shake, reset });
  }, []);

  React.useEffect(() => {
    if (error) shake();
  }, [error]);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Dots */}
      <Animated.View
        style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
      >
        {pin.map((val, i) => {
          const filled = val !== '';
          const scale  = dotAnims[i].interpolate({
            inputRange: [0, 1], outputRange: [1, 1.2],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: filled ? palette.teal[500] : 'transparent',
                  borderColor:     filled ? palette.teal[500] : theme.border.DEFAULT,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* Numpad */}
      <View style={styles.numpad}>
        {NUMPAD.map((row, ri) => (
          <View key={ri} style={styles.numpadRow}>
            {row.map((key, ki) => {
              if (key === 'bio') {
                return (
                  <NumpadKey
                    key={ki}
                    value={showBiometrics ? 'bio' : ''}
                    onPress={() => showBiometrics && onBiometrics?.()}
                    theme={theme}
                  />
                );
              }
              return (
                <NumpadKey
                  key={ki}
                  value={key}
                  onPress={() => key && handleKeyPress(key)}
                  theme={theme}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── NumpadKey ────────────────────────────────────────────────────────

function NumpadKey({
  value, onPress, theme,
}: { value: string; onPress: () => void; theme: any }) {
  if (!value) return <View style={styles.numpadKey} />;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.numpadKey}
      activeOpacity={0.6}
    >
      {value === 'delete'
        ? <Ionicons name="backspace-outline" size={24} color={theme.text.primary} />
        : value === 'bio'
        ? <Ionicons name="finger-print-outline" size={28} color={theme.text.primary} />
        : <Text style={[textStyles.h3, { color: theme.text.primary }]}>{value}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper:    { alignItems: 'center', gap: spacing[5] },
  dotsRow:    {
    flexDirection: 'row',
    gap: spacing[5],
    justifyContent: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
  },
  numpad:     { width: '100%', gap: spacing[2] },
  numpadRow:  {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  numpadKey:  {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});