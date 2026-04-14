// The 4-icon row from screenshots: Transfer, Top Up, Convert, Analytics

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { palette } from '@/theme/colors';

interface Action {
  id:      string;
  label:   string;
  icon:    keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface QuickActionBarProps {
  onTransfer:  () => void;
  onTopUp:     () => void;
  onConvert:   () => void;
  onAnalytics: () => void;
}

export function QuickActionBar({
  onTransfer, onTopUp, onConvert, onAnalytics,
}: QuickActionBarProps) {
  const { theme } = useTheme();

  const actions: Action[] = [
    { id: 'transfer',  label: 'Transfer',  icon: 'arrow-up-outline',      onPress: onTransfer  },
    { id: 'topup',     label: 'Top Up',    icon: 'add-outline',           onPress: onTopUp     },
    { id: 'convert',   label: 'Convert',   icon: 'swap-horizontal-outline', onPress: onConvert },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart-outline',     onPress: onAnalytics },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          onPress={action.onPress}
          style={styles.item}
          activeOpacity={0.7}
        >
          {/* Icon circle — matches screenshot blue tinted circles */}
          <View style={[
            styles.iconCircle,
            { backgroundColor: 'rgba(255,255,255,0.15)' },
          ]}>
            <Ionicons name={action.icon} size={22} color={palette.white} />
          </View>
          <Text style={[textStyles.caption, { color: palette.white, marginTop: spacing[1.5] }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[2],
    paddingVertical:   spacing[4],
  },
  item: {
    alignItems: 'center',
    gap:        spacing[1],
  },
  iconCircle: {
    width:          52,
    height:         52,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
});