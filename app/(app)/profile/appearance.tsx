// app/(app)/profile/appearance.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSubScreen, SettingSection } from '@/components/profile/ProfileSubScreen';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setColorScheme } from '@/store/slices/ui.slice';

type SchemeOption = 'dark' | 'light' | 'system';

const OPTIONS: { value: SchemeOption; label: string; icon: string; desc: string }[] = [
  { value: 'dark',   label: 'Dark',   icon: 'moon-outline',          desc: 'Always use dark theme' },
  { value: 'light',  label: 'Light',  icon: 'sunny-outline',         desc: 'Always use light theme' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline', desc: 'Follow your device setting' },
];

export default function AppearanceScreen() {
  const { theme, colorScheme } = useTheme();
  const dispatch   = useAppDispatch();
  const preference = useAppSelector((s) => s.ui.colorScheme);

  return (
    <ProfileSubScreen title="Appearance">
      <SettingSection title="Theme">
        {OPTIONS.map((opt, idx) => {
          const selected = preference === opt.value;
          return (
            <React.Fragment key={opt.value}>
              <TouchableOpacity
                onPress={() => dispatch(setColorScheme(opt.value))}
                style={styles.optionRow}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconWrap,
                  { backgroundColor: selected ? theme.brand.primary + '20' : theme.bg.card },
                ]}>
                  <Ionicons
                    name={opt.icon as any}
                    size={20}
                    color={selected ? theme.brand.primary : theme.text.secondary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[textStyles.label, { color: theme.text.primary }]}>{opt.label}</Text>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>{opt.desc}</Text>
                </View>
                <View style={[
                  styles.radio,
                  {
                    borderColor: selected ? theme.brand.primary : theme.border.DEFAULT,
                    backgroundColor: selected ? theme.brand.primary : 'transparent',
                  },
                ]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
              {idx < OPTIONS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
              )}
            </React.Fragment>
          );
        })}
      </SettingSection>
    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[4],
  },
  iconWrap: {
    width:  40, height: 40,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  optionText: { flex: 1, gap: spacing[0.5] },
  radio: {
    width:  22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  divider:    { height: 0.5, marginHorizontal: spacing[4] },
});