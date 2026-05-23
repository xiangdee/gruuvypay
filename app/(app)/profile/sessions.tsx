// app/(app)/profile/sessions.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSubScreen } from '@/components/profile/ProfileSubScreen';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { authApi } from '@/api/auth.api';
import { useToast } from '@/hooks/useToast';

interface Session {
  id:           number;
  deviceName:   string;  // "iPhone 15 Pro (iOS)"
  lastIp:       string;
  lastActivity: string;  // API field
  createdAt:    string;
}

export default function SessionsScreen() {
  const { theme } = useTheme();
  const toast     = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await authApi.getSessions();
      // Backend may return: Session[] directly, or { sessions: Session[] }, or { data: Session[] }
      const list: Session[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.sessions)
        ? data.sessions
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setSessions(list);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  function revokeSession(session: Session) {
    Alert.alert(
      'Revoke Session',
      `Remove ${session.deviceName} from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.revokeSession(String(session.id));
              setSessions((prev) => prev.filter((s) => s.id !== session.id));
              toast.success('Session revoked');
            } catch {
              toast.error('Failed to revoke session');
            }
          },
        },
      ],
    );
  }

  function osIcon(deviceName: string): string {
    const n = deviceName?.toLowerCase() ?? '';
    if (n.includes('ios') || n.includes('iphone') || n.includes('ipad')) return 'logo-apple';
    if (n.includes('android')) return 'logo-android';
    return 'phone-portrait-outline';
  }

  if (loading) {
    return (
      <ProfileSubScreen title="Active Sessions">
        <ActivityIndicator size="large" color={theme.brand.primary} style={{ marginTop: spacing[10] }} />
      </ProfileSubScreen>
    );
  }

  return (
    <ProfileSubScreen title="Active Sessions">
      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="phone-portrait-outline" size={48} color={theme.text.muted} />
          <Text style={[textStyles.body, { color: theme.text.muted, marginTop: spacing[3], textAlign: 'center' }]}>
            No active sessions found
          </Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.bg.secondary }]}>
          {sessions.map((session, idx) => (
            <React.Fragment key={session.id}>
              <View style={styles.sessionRow}>
                <View style={[styles.deviceIcon, { backgroundColor: theme.bg.card }]}>
                  <Ionicons name={osIcon(session.deviceName) as any} size={22} color={theme.text.secondary} />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={[textStyles.label, { color: theme.text.primary }]}>
                    {session.deviceName}
                  </Text>
                  <Text style={[textStyles.caption, { color: theme.text.muted }]}>
                    {session.lastIp} · Last active {new Date(session.lastActivity).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => revokeSession(session)}
                  style={[styles.revokeBtn, { backgroundColor: theme.status.error + '15' }]}
                >
                  <Text style={[textStyles.labelSm, { color: theme.status.error }]}>Revoke</Text>
                </TouchableOpacity>
              </View>
              {idx < sessions.length - 1 && (
                <View style={[styles.divider, { backgroundColor: theme.border.DEFAULT }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}
    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  card:        { borderRadius: radius.xl, overflow: 'hidden' },
  sessionRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  deviceIcon:  { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sessionInfo: { flex: 1, gap: spacing[0.5] },
  revokeBtn:   { paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: radius.full },
  divider:     { height: 0.5, marginHorizontal: spacing[4] },
  empty:       { alignItems: 'center', paddingTop: spacing[16] },
});
