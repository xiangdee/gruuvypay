// Used inside screens for prominent error display (e.g. wrong PIN, failed transfer)
// Distinct from Toast — stays visible until dismissed or resolved

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface ErrorCardProps {
  message:    string;
  title?:     string;
  onDismiss?: () => void;
  style?:     ViewStyle;
}

export function ErrorCard({ message, title = 'Something went wrong', onDismiss, style }: ErrorCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#2D0D0D',
          borderColor:     theme.status.error + '60',
        },
        style,
      ]}
    >
      <Ionicons name="alert-circle" size={20} color={theme.status.error} style={styles.icon} />
      <View style={styles.textWrap}>
        <Text style={[textStyles.label, { color: theme.status.error }]}>{title}</Text>
        <Text style={[textStyles.bodySm, { color: theme.text.secondary, marginTop: 2 }]}>
          {message}
        </Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.close}>
          <Ionicons name="close" size={16} color={theme.text.muted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    borderRadius:  radius.lg,
    borderWidth:   1,
    padding:       spacing[4],
    width:         '100%',
  },
  icon:     { marginRight: spacing[3], marginTop: 1 },
  textWrap: { flex: 1 },
  close:    { padding: spacing[1], marginLeft: spacing[2] },
});