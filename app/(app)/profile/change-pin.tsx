// 3-step: verify current PIN → set new → confirm new

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ProfileSubScreen } from '@/components/profile/ProfileSubScreen';
import { PinInput } from '@/components/ui/PinInput';
import { useTheme, textStyles, spacing } from '@/theme';
import { authApi } from '@/api/auth.api';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/auth.slice';

type Step = 'current' | 'new' | 'confirm';

export default function ChangePinScreen() {
  const { theme } = useTheme();
  const toast     = useToast();
  const router    = useRouter();
  const dispatch  = useAppDispatch();

  const [step,       setStep]       = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin,     setNewPin]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const pinRef = useRef<{ shake: () => void; reset: () => void } | null>(null);

  const stepConfig = {
    current: {
      title:    'Enter Current PIN',
      subtitle: 'Enter your existing 4-digit PIN',
    },
    new: {
      title:    'Set New PIN',
      subtitle: 'Choose a new 4-digit PIN',
    },
    confirm: {
      title:    'Confirm New PIN',
      subtitle: 'Re-enter your new PIN to confirm',
    },
  };

  async function onPinComplete(pin: string) {
    if (step === 'current') {
      setCurrentPin(pin);
      setStep('new');
      return;
    }

    if (step === 'new') {
      if (pin === currentPin) {
        toast.warning('Same PIN', 'New PIN must be different from current PIN');
        pinRef.current?.shake();
        return;
      }
      setNewPin(pin);
      setStep('confirm');
      return;
    }

    // confirm step
    if (pin !== newPin) {
      toast.error('PINs do not match', 'Please try again');
      pinRef.current?.shake();
      setStep('new');
      setNewPin('');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePin({
        currentPin,
        newPin,
        confirmPin: pin,
      });
      toast.success('PIN changed!', 'Please log in again with your new PIN');
      // PIN change revokes all sessions — force re-login
      await dispatch(logout());
      router.replace('/(auth)/login');
    } catch (err: any) {
      toast.error('Failed', err?.message ?? 'Current PIN may be incorrect');
      pinRef.current?.shake();
      setStep('current');
      setCurrentPin('');
      setNewPin('');
    } finally {
      setLoading(false);
    }
  }

  const config = stepConfig[step];

  return (
    <ProfileSubScreen title="Change PIN" scrollable={false}>
      <View style={styles.inner}>
        <View style={styles.heading}>
          <Text style={[textStyles.h2, { color: theme.text.primary, textAlign: 'center' }]}>
            {config.title}
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            {config.subtitle}
          </Text>
        </View>

        {loading
          ? <ActivityIndicator size="large" color={theme.brand.primary} style={styles.loader} />
          : (
            <PinInput
              onComplete={onPinComplete}
              onRef={(api) => { pinRef.current = api; }}
              style={styles.pin}
            />
          )
        }
      </View>
    </ProfileSubScreen>
  );
}

const styles = StyleSheet.create({
  inner:   { flex: 1, paddingHorizontal: spacing[4], paddingTop: spacing[4] },
  heading: { marginBottom: spacing[10] },
  pin:     { flex: 1 },
  loader:  { flex: 1, alignSelf: 'center' },
});