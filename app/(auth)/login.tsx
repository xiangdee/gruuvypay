// Step 1: identifier (username or email)
// Step 2: PIN entry with numpad (reuses PinInput)

import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { KeyboardView } from '@/components/layout/KeyboardView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PinInput } from '@/components/ui/PinInput';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useLoginLogic } from '../../src/screens/auth/login.logic';

export default function LoginScreen() {
  const { theme } = useTheme();
  const {
    step, identifier, setIdentifier,
    identifierError,
    loading, pinError, pinRef,
    goToPin, goBack, goToSignUp, goToForgotPin,
    onPinComplete, tryBiometricLogin,
  } = useLoginLogic();

  // Try biometric on mount if user has it enabled
  useEffect(() => { tryBiometricLogin(); }, []);

  if (step === 'pin') {
    return (
      <Screen padded>
        <LoadingOverlay visible={loading} message="Signing in..." />
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>

        <View style={styles.pinHeading}>
          <Text style={[textStyles.h1, { color: theme.text.primary, textAlign: 'center' }]}>
            Enter Your PIN
          </Text>
          <Text style={[
            textStyles.body,
            { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] },
          ]}>
            Welcome back,{' '}
            <Text style={{ color: theme.text.primary }}>@{identifier}</Text>
          </Text>
        </View>

        <PinInput
          onComplete={onPinComplete}
          error={pinError}
          onRef={(api) => { pinRef.current = api; }}
          style={styles.pin}
          showBiometrics
          onBiometrics={tryBiometricLogin}
        />

        <TouchableOpacity style={styles.forgotPin} onPress={goToForgotPin}>
          <Text style={[textStyles.bodySm, { color: theme.text.link }]}>
            Forgot PIN?
          </Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <KeyboardView scrollable>
        <View style={styles.inner}>

          {/* Top row */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={goToSignUp}
              style={[styles.signUpBtn, { backgroundColor: theme.bg.card }]}
            >
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={[textStyles.h1, { color: theme.text.primary }]}>
              Log In
            </Text>
            <Text style={[textStyles.bodyLg, { color: theme.text.secondary, marginTop: spacing[2] }]}>
              Welcome back to GruuvyPay
            </Text>
          </View>

          {/* Identifier input */}
          <View style={styles.form}>
            <Input
              placeholder="Username or email"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              value={identifier}
              onChangeText={setIdentifier}
              leftIcon={
                <Ionicons name="person-outline" size={20} color={theme.text.muted} />
              }
              returnKeyType="next"
              onSubmitEditing={goToPin}
            />
          </View>

          <View style={styles.cta}>
            <Button
              label="Continue"
              onPress={goToPin}
              loading={loading}
              disabled={!identifier.trim()}
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
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
    minHeight: '100%',
  },
  topRow: {
    alignItems: 'flex-end',
    marginBottom: spacing[8],
  },
  signUpBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    borderRadius: radius['3xl'],
  },
  heading: {
    marginBottom: spacing[8],
  },
  form: {
    marginBottom: spacing[6],
  },
  cta: {
    marginTop: 'auto',
  },
  // PIN step
  back:       { marginBottom: spacing[6], alignSelf: 'flex-start' },
  pinHeading: { marginBottom: spacing[12] },
  pin:        { flex: 1 },
  forgotPin: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
});