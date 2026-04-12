// The "Resend Email / Resend OTP" row from the verify screens
// Shows countdown timer when cooling down, active button when ready
// Matches the design in screenshots — timer badge on the right

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface ResendOtpButtonProps {
  onResend:       () => void;
  canResend:      boolean;
  formattedTime:  string;
  label?:         string;   // "Resend Email" | "Resend OTP"
  loading?:       boolean;
}

export function ResendOtpButton({
  onResend, canResend, formattedTime, label = 'Resend OTP', loading,
}: ResendOtpButtonProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={canResend ? onResend : undefined}
      disabled={!canResend || loading}
      style={[
        styles.container,
        { backgroundColor: theme.bg.card },
      ]}
      activeOpacity={canResend ? 0.7 : 1}
    >
      <Text
        style={[
          textStyles.label,
          {
            color: canResend ? theme.text.primary : theme.text.muted,
          },
        ]}
      >
        {label}
      </Text>

      {/* Timer badge — visible during cooldown */}
      {!canResend && (
        <View style={[styles.badge, { backgroundColor: theme.bg.secondary }]}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted }]}>
            {formattedTime}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   radius['3xl'],
    paddingVertical:    spacing[4],
    paddingHorizontal:  spacing[6],
    gap: spacing[3],
  },
  badge: {
    borderRadius:       radius.full,
    paddingVertical:    spacing[1],
    paddingHorizontal:  spacing[3],
  },
});