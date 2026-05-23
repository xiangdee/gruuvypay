// "Quick Actions" section from screenshots
// Airtime, Data, Betting, Airtime To Cash — horizontal scrollable

import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface BillAction {
  id:      string;
  label:   string;
  icon:    keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface BillsRowProps {
  onAirtime:       () => void;
  onData:          () => void;
  onElectricity:   () => void;
  onCable:         () => void;
  onBetting:       () => void;
  onAirtimeToCash: () => void;
  onViewAll:       () => void;
}

export function BillsRow({
  onAirtime, onData, onElectricity, onCable, onBetting, onAirtimeToCash, onViewAll,
}: BillsRowProps) {
  const { theme } = useTheme();

  const actions: BillAction[] = [
    { id: 'airtime',      label: 'Airtime',         icon: 'call-outline',            onPress: onAirtime       },
    { id: 'data',         label: 'Data',             icon: 'wifi-outline',            onPress: onData          },
    { id: 'electricity',  label: 'Electricity',      icon: 'flash-outline',           onPress: onElectricity   },
    { id: 'cable',        label: 'Cable TV',         icon: 'tv-outline',              onPress: onCable         },
    { id: 'betting',      label: 'Betting',          icon: 'game-controller-outline', onPress: onBetting       },
    { id: 'airtime-cash', label: 'Airtime\nTo Cash', icon: 'refresh-outline',        onPress: onAirtimeToCash },
  ];

  return (
    <View style={[styles.section, { backgroundColor: theme.bg.secondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[textStyles.label, { color: theme.text.primary }]}>
          Quick Actions
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[textStyles.label, { color: theme.text.link }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Actions row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={action.onPress}
            style={styles.actionItem}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconCircle,
              { backgroundColor: theme.bg.card },
            ]}>
              <Ionicons name={action.icon} size={22} color={theme.text.primary} />
            </View>
            <Text style={[
              textStyles.caption,
              {
                color: theme.text.secondary,
                textAlign: 'center',
                marginTop: spacing[1.5],
              },
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: radius.xl,
    padding:      spacing[4],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing[4],
  },
  actionsRow: {
    gap: spacing[4],
    paddingRight: spacing[2],
  },
  actionItem: {
    alignItems: 'center',
    width:      72,
  },
  iconCircle: {
    width:          56,
    height:         56,
    borderRadius:   radius.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
});