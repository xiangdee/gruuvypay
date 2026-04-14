// Reusable wrapper for all profile sub-screens
// Provides consistent back button + title header

import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles, spacing } from '@/theme';

interface ProfileSubScreenProps {
  title:       string;
  children:    React.ReactNode;
  scrollable?: boolean;
  style?:      ViewStyle;
}

export function ProfileSubScreen({
  title, children, scrollable = true, style,
}: ProfileSubScreenProps) {
  const { theme } = useTheme();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
      </TouchableOpacity>
      <Text style={[textStyles.h3, { color: theme.text.primary }]}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );

  if (!scrollable) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.primary }, style]}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.primary }]}>
      {header}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, style]}
      >
        {children}
        <View style={{ height: insets.bottom + spacing[8] }} />
      </ScrollView>
    </View>
  );
}

// Reusable row used across all profile sub-screens
export function SettingRow({
  label, value, onPress, icon, danger, toggle, toggleValue,
}: {
  label:        string;
  value?:       string;
  onPress?:     () => void;
  icon?:        string;
  danger?:      boolean;
  toggle?:      boolean;
  toggleValue?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.settingRow}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? theme.status.error : theme.text.secondary}
          style={styles.settingIcon}
        />
      )}
      <Text style={[
        textStyles.body,
        { color: danger ? theme.status.error : theme.text.primary, flex: 1 },
      ]}>
        {label}
      </Text>
      {value && (
        <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>{value}</Text>
      )}
      {toggle !== undefined && (
        <View style={[
          styles.toggle,
          { backgroundColor: toggleValue ? theme.brand.primary : theme.bg.card },
        ]}>
          <View style={[
            styles.toggleThumb,
            { transform: [{ translateX: toggleValue ? 18 : 2 }] },
          ]} />
        </View>
      )}
      {!toggle && onPress && (
        <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
      )}
    </TouchableOpacity>
  );
}

// Section card wrapper used in sub-screens
export function SettingSection({
  title, children,
}: { title?: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionWrap}>
      {title && (
        <Text style={[textStyles.labelSm, { color: theme.text.muted, marginBottom: spacing[2], letterSpacing: 0.8 }]}>
          {title.toUpperCase()}
        </Text>
      )}
      <View style={[styles.sectionCard, { backgroundColor: theme.bg.secondary }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom:  spacing[4],
  },
  back:        { padding: spacing[1] },
  placeholder: { width: 32 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[2] },
  sectionWrap: { marginBottom: spacing[4] },
  sectionCard: { borderRadius: 16, overflow: 'hidden' },
  settingRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:  spacing[4],
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  settingIcon: {},
  toggle: {
    width: 44, height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    position: 'absolute',
  },
});