import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSubScreen, SettingSection, SettingRow } from '@/components/profile/ProfileSubScreen';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { siteLink } from '@/constants/links';

const DOCS = [
  {
    icon: 'document-text-outline' as const,
    label: 'Terms of Service',
    url: `${siteLink}/terms`,
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Privacy Policy',
    url: `${siteLink}/privacy`,
  },
  // {
  //   icon: 'cash-outline' as const,
  //   label: 'Fees & Charges',
  //   url: `${siteLink}/fees`,
  // },
  // {
  //   icon: 'alert-circle-outline' as const,
  //   label: 'Acceptable Use Policy',
  //   url: `${siteLink}/aup`,
  // },
];

export default function LegalScreen() {
  const { theme } = useTheme();

  return (
    <ProfileSubScreen title="Legal">

      <SettingSection title="Documents">
        {DOCS.map((doc, i) => (
          <React.Fragment key={doc.label}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(doc.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.brand.primary + '20' }]}>
                <Ionicons name={doc.icon} size={20} color={theme.brand.primary} />
              </View>
              <Text style={[textStyles.label, { color: theme.text.primary, flex: 1 }]}>
                {doc.label}
              </Text>
              <Ionicons name="open-outline" size={16} color={theme.text.muted} />
            </TouchableOpacity>
            {i < DOCS.length - 1 && (
              <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
            )}
          </React.Fragment>
        ))}
      </SettingSection>

      <View style={[styles.noteBox, { backgroundColor: theme.bg.secondary }]}>
        <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center', lineHeight: 20 }]}>
          GruuvyPay is a financial technology service. All transactions are
          processed in compliance with CBN guidelines. Funds are held with a
          licensed payment institution.
        </Text>
      </View>

    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 0.5, marginHorizontal: spacing[4] },
  noteBox: {
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
});
