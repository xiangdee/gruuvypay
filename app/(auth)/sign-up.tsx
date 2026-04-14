import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { KeyboardView } from '@/components/layout/KeyboardView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useSignUpLogic } from '../../src/screens/auth/sign-up.logic';

export default function SignUpScreen() {
  const { theme } = useTheme();
  const {
    form, loading, agreedToTerms,
    setAgreedToTerms, onSubmit, goToLogin,
  } = useSignUpLogic();

  const { formState: { errors }, register: reg } = form;

  return (
    <Screen padded={false}>
      <KeyboardView scrollable>
        <View style={styles.inner}>

          {/* Top row — Log In button */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={goToLogin}
              style={[styles.loginBtn, { backgroundColor: theme.bg.card }]}
            >
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.heading}>
            <Text style={[textStyles.h1, { color: theme.text.primary }]}>
              Sign Up
            </Text>
            <Text style={[textStyles.bodyLg, { color: theme.text.secondary, marginTop: spacing[2] }]}>
              Create your free account to start banking in Naira securely
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              placeholder="example@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={
                <Ionicons name="mail-outline" size={20} color={theme.text.muted} />
              }
              onChangeText={form.setValue.bind(null, 'email')}
              error={errors.email?.message}
            />

            <View style={styles.field}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                Username
              </Text>
              <Input
                placeholder="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={
                  <Ionicons name="person-outline" size={20} color={theme.text.muted} />
                }
                onChangeText={(t) => form.setValue('username', t)}
                error={errors.username?.message}
                hint="This becomes your GruuvyTag e.g @username"
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.halfField}>
                <Input
                  label="First Name"
                  placeholder="First name"
                  autoCapitalize="words"
                  onChangeText={(t) => form.setValue('firstName', t)}
                  error={errors.firstName?.message}
                />
              </View>
              <View style={styles.halfField}>
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  autoCapitalize="words"
                  onChangeText={(t) => form.setValue('lastName', t)}
                  error={errors.lastName?.message}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[textStyles.label, { color: theme.text.primary }]}>
                Referral Code{' '}
                <Text style={{ color: theme.text.muted, fontWeight: '400' }}>
                  (optional)
                </Text>
              </Text>
              <Input
                placeholder="Referral code (optional)"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(t) => form.setValue('referralCode', t)}
              />
            </View>
          </View>

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              {
                backgroundColor: agreedToTerms ? theme.brand.primary : 'transparent',
                borderColor: agreedToTerms ? theme.brand.primary : theme.border.DEFAULT,
              },
            ]}>
              {agreedToTerms && (
                <Ionicons name="checkmark" size={12} color="#fff" />
              )}
            </View>
            <Text style={[textStyles.bodySm, { color: theme.text.secondary, flex: 1 }]}>
              By signing up you agree to our{' '}
              <Text style={{ color: theme.text.link }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: theme.text.link }}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* CTA */}
          <View style={styles.cta}>
            <Button
              label="Continue"
              onPress={onSubmit}
              loading={loading}
              disabled={!agreedToTerms}
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
  },
  topRow: {
    alignItems: 'flex-end',
    marginBottom: spacing[8],
  },
  loginBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
    borderRadius: radius['3xl'],
  },
  heading: {
    marginBottom: spacing[8],
  },
  form: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  field: {
    gap: spacing[2],
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfField: {
    flex: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cta: {
    marginTop: 'auto',
  },
});