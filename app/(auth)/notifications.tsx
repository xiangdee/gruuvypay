import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useTheme, textStyles, spacing, radius, palette } from '@/theme';
import { useNotificationsLogic } from '../../src/screens/auth/notifications.logic';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const { loading, requestPermission, skip } = useNotificationsLogic();

  return (
    <Screen padded>
      <View style={styles.inner}>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={[textStyles.h1, { color: theme.text.primary, textAlign: 'center' }]}>
            Stay Secure and Informed
          </Text>
          <Text style={[
            textStyles.body,
            { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[3] },
          ]}>
            Enable notifications to get real-time alerts for transactions, security updates, and account changes.
          </Text>
        </View>

        {/* Notification mockup — matches screenshot */}
        <View style={[styles.mockupContainer, { backgroundColor: theme.bg.secondary }]}>
          {/* Fake notification toast */}
          <View style={[styles.notifCard, { backgroundColor: theme.bg.primary }]}>
            <View style={[styles.notifIcon, { backgroundColor: palette.blue[100] }]}>
              <Ionicons name="notifications" size={20} color={palette.blue[500]} />
            </View>
            <View style={styles.notifText}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                Quick Update
              </Text>
              <Text style={[textStyles.caption, { color: theme.text.secondary, marginTop: 2 }]}>
                Your payment to John Doe was successful.{'\n'}Balance: ₦50,234.56
              </Text>
            </View>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Button
            label="Continue"
            onPress={requestPermission}
            loading={loading}
          />
          <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center' }]}>
            You can change settings at anytime
          </Text>
        </View>

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: spacing[8],
  },
  heading: {
    marginBottom: spacing[8],
  },
  mockupContainer: {
    flex: 1,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: spacing[4],
    marginBottom: spacing[8],
    minHeight: 280,
    paddingBottom: spacing[6],
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    borderRadius: radius.lg,
    padding: spacing[4],
    marginHorizontal: spacing[4],
    width: '90%',
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: {
    flex: 1,
  },
  ctas: {
    gap: spacing[4],
    paddingBottom: spacing[4],
  },
});