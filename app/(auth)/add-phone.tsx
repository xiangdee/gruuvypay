import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { KeyboardView } from '@/components/layout/KeyboardView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing } from '@/theme';
import { useAddPhoneLogic } from './add-phone.logic';

export default function AddPhoneScreen() {
  const { theme } = useTheme();
  const { phone, setPhone, loading, error, sendOtp } = useAddPhoneLogic();

  return (
    <Screen padded>
      <KeyboardView>
        <View style={styles.inner}>

          {/* Heading — matches screenshot */}
          <View style={styles.heading}>
            <Text style={[textStyles.h1, { color: theme.text.primary, textAlign: 'center' }]}>
              Add Mobile Number
            </Text>
            <Text style={[
              textStyles.body,
              { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[3] },
            ]}>
              Enhance your account security by adding and verifying your mobile number.
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <ErrorCard message={error} style={styles.errorCard} />
          ) : null}

          {/* Phone input */}
          <View style={styles.inputWrap}>
            <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
              Phone Number
            </Text>
            <Input
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoComplete="tel"
              hint="e.g. 08012345678 or +2348012345678"
            />
          </View>

          {/* CTA */}
          <View style={styles.cta}>
            <Button
              label="Continue"
              onPress={sendOtp}
              loading={loading}
              disabled={phone.length < 10}
            />
          </View>

        </View>
      </KeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: spacing[12],
  },
  heading: {
    marginBottom: spacing[10],
  },
  errorCard: {
    marginBottom: spacing[4],
  },
  inputWrap: {
    marginBottom: spacing[6],
  },
  cta: {
    marginTop: 'auto',
    paddingBottom: spacing[4],
  },
});