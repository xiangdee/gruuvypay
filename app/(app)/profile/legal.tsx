import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSubScreen, SettingSection } from '@/components/profile/ProfileSubScreen';
import { useTheme, textStyles, spacing, radius } from '@/theme';

const FAQS = [
  {
    q: 'How do I fund my wallet?',
    a: 'Go to Home → Top Up. You will see your unique GruuvyPay bank account number. Transfer any amount to that account and your wallet will be credited instantly.',
  },
  {
    q: 'How long do transfers take?',
    a: 'Transfers between GruuvyPay users (@GruuvyTag) are instant. Bank withdrawals typically settle within minutes via NIP.',
  },
  {
    q: 'What are the transaction limits?',
    a: 'Limits depend on your account tier. Unverified accounts have a ₦5,000 per-transaction limit. Verify your phone and BVN to increase limits. See Account Limits in your Profile.',
  },
  {
    q: 'How do I buy crypto?',
    a: 'Tap the Crypto tab → select any coin → tap Buy. You can buy with your NGN wallet balance. Minimum purchase is ₦1,000.',
  },
  {
    q: 'Is my money safe?',
    a: 'Yes. Your NGN wallet is backed by Flutterwave\'s licensed infrastructure. Crypto assets are held via Tatum with Fireblocks-grade custody.',
  },
  {
    q: 'How do I reset my PIN?',
    a: 'On the login screen, tap "Forgot PIN?" and follow the steps to verify your phone number and set a new PIN.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const { theme }    = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.faqItem, { borderBottomColor: theme.border.DEFAULT }]}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={styles.faqQ} activeOpacity={0.7}>
        <Text style={[textStyles.label, { color: theme.text.primary, flex: 1 }]}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.text.muted}
        />
      </TouchableOpacity>
      {open && (
        <Text style={[textStyles.body, { color: theme.text.secondary, paddingBottom: spacing[4], paddingHorizontal: spacing[4] }]}>
          {a}
        </Text>
      )}
    </View>
  );
}

export default function HelpScreen() {
  const { theme } = useTheme();

  return (
    <ProfileSubScreen title="Get Help">

      {/* Contact options */}
      <SettingSection title="Contact Us">
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('mailto:support@gruuvypay.com')}
          activeOpacity={0.7}
        >
          <View style={[styles.contactIcon, { backgroundColor: theme.brand.primary + '20' }]}>
            <Ionicons name="mail-outline" size={20} color={theme.brand.primary} />
          </View>
          <View style={styles.contactText}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>Email Support</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>support@gruuvypay.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />

        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL('https://wa.me/2348000000000')}
          activeOpacity={0.7}
        >
          <View style={[styles.contactIcon, { backgroundColor: '#25D36620' }]}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          </View>
          <View style={styles.contactText}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>WhatsApp</Text>
            <Text style={[textStyles.caption, { color: theme.text.muted }]}>Mon–Fri, 8am–6pm WAT</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.text.muted} />
        </TouchableOpacity>
      </SettingSection>

      {/* FAQs */}
      <SettingSection title="Frequently Asked Questions">
        {FAQS.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </SettingSection>

    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  contactRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  contactIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1 },
  divider:     { height: 0.5, marginHorizontal: spacing[4] },
  faqItem:     { borderBottomWidth: 0.5 },
  faqQ:        { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
});