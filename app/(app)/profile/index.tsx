import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useProfile } from '@/screens/app/useProfile';

export default function ProfileScreen() {
  const { theme }  = useTheme();
  const insets     = useSafeAreaInsets();
  const { user, tierInfo, navItems, navigate, handleLogout } = useProfile();

  const initials = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '');

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.bg.primary }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[textStyles.h2, { color: theme.text.primary, marginBottom: spacing[6] }]}>
        Profile
      </Text>

      {/* User card */}
      <View style={[styles.userCard, { backgroundColor: theme.bg.secondary }]}>
        <View style={[styles.avatar, { backgroundColor: theme.brand.primary }]}>
          <Text style={[textStyles.h2, { color: '#fff' }]}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[textStyles.h3, { color: theme.text.primary }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary }]}>
            {user?.username}
          </Text>
          <Text style={[textStyles.bodySm, { color: theme.text.muted }]}>
            {user?.email}
          </Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: tierInfo.color + '20' }]}>
          <View style={[styles.tierDot, { backgroundColor: tierInfo.color }]} />
          <Text style={[textStyles.labelSm, { color: tierInfo.color }]}>
            {tierInfo.label}
          </Text>
        </View>
      </View>

      {/* Nav sections */}
      {navItems.map((section) => (
        <View key={section.section} style={styles.section}>
          <Text style={[textStyles.labelSm, { color: theme.text.muted, marginBottom: spacing[2], letterSpacing: 0.8 }]}>
            {section.section.toUpperCase()}
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.bg.secondary }]}>
            {section.items.map((item, idx) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity onPress={() => navigate(item.route)} style={styles.navRow} activeOpacity={0.7}>
                  <View style={[styles.navIcon, { backgroundColor: theme.bg.card }]}>
                    <Ionicons name={item.icon as any} size={18} color={theme.text.secondary} />
                  </View>
                  <Text style={[textStyles.body, { color: theme.text.primary, flex: 1 }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
                </TouchableOpacity>
                {idx < section.items.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      {/* Log out */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.logoutBtn, { backgroundColor: theme.status.error + '15', borderColor: theme.status.error + '30', borderWidth: 1 }]}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.status.error} />
        <Text style={[textStyles.label, { color: theme.status.error }]}>Log Out</Text>
      </TouchableOpacity>

      <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center', marginTop: spacing[4] }]}>
        GruuvyPay v1.0.0
      </Text>
      <View style={{ height: insets.bottom + spacing[8] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:      { flex: 1 },
  content:     { paddingHorizontal: spacing[4] },
  userCard:    { borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[6], gap: spacing[3] },
  avatar:      { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  userInfo:    { gap: spacing[0.5] },
  tierBadge:   { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing[1.5], paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full },
  tierDot:     { width: 6, height: 6, borderRadius: 3 },
  section:     { marginBottom: spacing[4] },
  sectionCard: { borderRadius: radius.xl, overflow: 'hidden' },
  navRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3.5], paddingHorizontal: spacing[4] },
  navIcon:     { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  divider:     { height: 0.5, marginLeft: spacing[4] + 36 + spacing[3] },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4], borderRadius: radius.xl, marginTop: spacing[2] },
});