import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { PinInput } from '@/components/ui/PinInput';
import { useTheme, textStyles, spacing } from '@/theme';
import { useSetPinLogic } from '../../src/screens/auth/set-pin.logic';

export default function SetPinScreen() {
  const { theme } = useTheme();
  const { step, loading, pinRef, onPinComplete } = useSetPinLogic();

  const isConfirm = step === 'confirm';

  return (
    <Screen padded>
      <View style={styles.inner}>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={[textStyles.h1, { color: theme.text.primary, textAlign: 'center' }]}>
            {isConfirm ? 'Confirm Your PIN' : 'Set Your PIN'}
          </Text>
          <Text style={[
            textStyles.body,
            { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] },
          ]}>
            {isConfirm
              ? 'Re-enter your PIN to confirm'
              : 'Create a 4-digit PIN to secure your account.'
            }
          </Text>
        </View>

        {/* PIN dots + numpad */}
        {loading
          ? <ActivityIndicator size="large" color={theme.brand.primary} style={styles.loader} />
          : (
            <PinInput
              key={step}
              onComplete={onPinComplete}
              onRef={(api) => { pinRef.current = api; }}
              style={styles.pin}
            />
          )
        }

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: spacing[12],
  },
  heading: {
    marginBottom: spacing[12],
  },
  pin: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignSelf: 'center',
  },
});