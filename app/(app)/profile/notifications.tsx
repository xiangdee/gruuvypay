import React, { useEffect, useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSubScreen } from '@/components/profile/ProfileSubScreen';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useToast } from '@/hooks/useToast';
import apiClient from '@/api/client';

const PROJECT_ID: string =
  Constants.expoConfig?.extra?.eas?.projectId ??
  process.env.EXPO_PUBLIC_PROJECT_ID ??
  '';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export default function NotificationsSettingsScreen() {
  const { theme } = useTheme();
  const toast     = useToast();

  const [pushStatus,   setPushStatus]   = useState<PermissionStatus>('undetermined');
  const [pushEnabled,  setPushEnabled]  = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);
  const [testing,      setTesting]      = useState(false);

  useEffect(() => {
    checkPushStatus();
  }, []);

  async function checkPushStatus() {
    if (!Device.isDevice) { setPushStatus('denied'); return; }
    const { status } = await Notifications.getPermissionsAsync();
    setPushStatus(status as PermissionStatus);
    setPushEnabled(status === 'granted');
  }

  async function togglePush(value: boolean) {
    if (togglingPush) return;
    setTogglingPush(true);
    try {
      if (value) {
        // Request permission
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          toast.error('Permission denied', 'Enable notifications in your device settings.');
          setPushEnabled(false);
          return;
        }
        // Set Android channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name:             'GruuvyPay',
            importance:       Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor:       '#D7FF64',
          });
        }
        // Register token with backend
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
        await apiClient.post('/push-tokens', { token: tokenData.data, deviceOs: Platform.OS });
        setPushEnabled(true);
        setPushStatus('granted');
        toast.success('Push notifications enabled');
      } else {
        // Unregister token from backend
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
          await apiClient.delete('/push-tokens', { data: { token: tokenData.data } });
        } catch {
          // non-fatal — token may not exist
        }
        setPushEnabled(false);
        toast.info('Push notifications disabled', 'You can re-enable them any time.');
      }
    } catch (err: any) {
      toast.error('Failed to update notifications');
    } finally {
      setTogglingPush(false);
    }
  }

  async function sendTestNotification() {
    if (!pushEnabled) {
      toast.warning('Enable push notifications first');
      return;
    }
    setTesting(true);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'GruuvyPay',
          body:  'Push notifications are working correctly.',
          data:  { type: 'test' },
        },
        trigger: { seconds: 1 },
      });
      toast.success('Test notification sent');
    } catch {
      toast.error('Failed to send test notification');
    } finally {
      setTesting(false);
    }
  }

  const statusLabel: Record<PermissionStatus, string> = {
    granted:       'Allowed',
    denied:        'Blocked — change in device settings',
    undetermined:  'Not yet requested',
  };

  const statusColor: Record<PermissionStatus, string> = {
    granted:      '#22C55E',
    denied:       '#EF4444',
    undetermined: '#F59E0B',
  };

  return (
    <ProfileSubScreen title="Notifications">
      {/* ── Push ──────────────────────────────────────────────────────── */}
      <View style={[styles.section, { backgroundColor: theme.bg.secondary }]}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: theme.bg.card }]}>
            <Ionicons name="notifications-outline" size={20} color={theme.brand.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[textStyles.label, { color: theme.text.primary }]}>
              Push Notifications
            </Text>
            <Text style={[textStyles.caption, { color: statusColor[pushStatus] }]}>
              {statusLabel[pushStatus]}
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={togglePush}
            disabled={togglingPush || pushStatus === 'denied'}
            trackColor={{ false: theme.border.DEFAULT, true: theme.brand.primary }}
            thumbColor={pushEnabled ? '#000' : '#fff'}
          />
        </View>
      </View>

      {/* ── Test button ────────────────────────────────────────────────── */}
      {pushEnabled && (
        <TouchableOpacity
          onPress={sendTestNotification}
          disabled={testing}
          style={[styles.testBtn, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
        >
          <Ionicons name="send-outline" size={16} color={theme.brand.primary} />
          <Text style={[textStyles.label, { color: theme.brand.primary }]}>
            {testing ? 'Sending…' : 'Send Test Notification'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Info note ──────────────────────────────────────────────────── */}
      {pushStatus === 'denied' && (
        <View style={[styles.note, { backgroundColor: theme.bg.secondary }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.text.muted} />
          <Text style={[textStyles.caption, { color: theme.text.muted, flex: 1 }]}>
            Notifications are blocked at the OS level. Go to{' '}
            {Platform.OS === 'ios' ? 'Settings → GruuvyPay' : 'App Settings → Notifications'}{' '}
            to re-enable them.
          </Text>
        </View>
      )}
    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[3],
    padding:        spacing[4],
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: spacing[0.5] },
  testBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[2],
    borderRadius:   radius.xl,
    borderWidth:    1,
    paddingVertical: spacing[3],
    marginBottom:   spacing[4],
  },
  note: {
    flexDirection: 'row',
    gap:           spacing[2],
    borderRadius:  radius.lg,
    padding:       spacing[4],
    alignItems:    'flex-start',
  },
});
