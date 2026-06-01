import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/slices/auth.slice';
import { authApi } from '@/api/auth.api';
import { PinInput } from '@/components/ui/PinInput';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useToast } from '@/hooks/useToast';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { TwoFaType } from '@/types/two-fa.types';

export default function Disable2faScreen() {
  const { theme } = useTheme();
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const toast     = useToast();
  const user      = useAppSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const pinRef = useRef<{ shake: () => void; reset: () => void }>(null);

  async function onPinComplete(pin: string) {
    setLoading(true);
    setPinError('');
    try {
      await authApi.disable2fa(pin);
      if (user) {
        dispatch(setUser({ ...user, isTwofaActive: false, twoFaType: TwoFaType.none }));
      }
      toast.success('2FA disabled', 'Your account no longer requires a second factor.');
      router.back();
    } catch (err: any) {
      const msg = err?.message ?? 'Incorrect PIN. Please try again.';
      setPinError(msg);
      pinRef.current?.shake();
      pinRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <LoadingOverlay visible={loading} message="Disabling 2FA..." />

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.status.error + '15' }]}>
          <Ionicons name="shield-outline" size={36} color={theme.status.error} />
        </View>

        <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[4] }]}>
          Disable 2FA
        </Text>
        <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
          Enter your PIN to confirm. This removes the extra security layer from your account.
        </Text>

        <View style={styles.pinSection}>
          <PinInput
            onComplete={onPinComplete}
            error={pinError}
            onRef={(api) => { (pinRef as any).current = api; }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  content:    { flex: 1, alignItems: 'center', paddingHorizontal: spacing[6], paddingTop: spacing[10] },
  iconWrap:   { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  pinSection: { width: '100%', marginTop: spacing[10] },
});
