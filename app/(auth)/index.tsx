// app/(auth)/index.tsx
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { palette } from '@/theme/colors';
import { useAppSelector } from '@/store/hooks';

export default function WelcomeScreen() {
  const router    = useRouter();
  const { theme } = useTheme();
  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (onboardingStep && onboardingStep !== 'COMPLETE') {
      const routes: Record<string, string> = {
        PHONE:      '/(auth)/add-phone',
        PIN:        '/(auth)/set-pin',
        BIOMETRICS: '/(auth)/biometrics',
      };
      router.replace((routes[onboardingStep] ?? '/(auth)/sign-up') as any);
    } else if (onboardingStep === 'COMPLETE') {
      router.replace('/(app)');
    }
  }, [isAuthenticated, onboardingStep]);

  return (
    <View style={[styles.container, { backgroundColor: theme.brand.primary }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* Logo + tagline */}
        <View style={styles.hero}>
          <View style={[styles.logoMark, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={[textStyles.h1, { color: palette.white, marginTop: spacing[4] }]}>
            GruuvyPay
          </Text>
          <Text style={[
            textStyles.bodyLg,
            { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: spacing[3] },
          ]}>
            Send money, pay bills, and{'\n'}manage crypto — all in one place.
          </Text>
        </View>

        {/* Feature pills */}
        <View style={styles.pills}>
          {['🏦 NGN Wallet', '₿ Crypto', '⚡ Instant Bills', '🎁 Rewards'].map((pill) => (
            <View
              key={pill}
              style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
            >
              <Text style={[textStyles.bodySm, { color: palette.white }]}>{pill}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Button
            label="Create Account"
            onPress={() => router.push('/(auth)/sign-up')}
          />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={[styles.loginBtn, { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1.5 }]}
          >
            <Text style={[textStyles.button, { color: palette.white }]}>Log In</Text>
          </TouchableOpacity>
          <Text style={[textStyles.caption, { color: 'rgba(255,255,255,0.4)', textAlign: 'center' }]}>
            By continuing you agree to our{'  '}
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Terms</Text>
            {'  '}and{'  '}
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Privacy Policy</Text>
          </Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: 'space-between',
    paddingTop: spacing[8],
    paddingBottom: spacing[4],
  },
  hero:     { alignItems: 'center', marginTop: spacing[8] },
  logoMark: {
    width: 80, height: 80,
    borderRadius: radius['2xl'],
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 40, fontWeight: '800', color: palette.white },
  pills:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center' },
  pill:     { paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: radius.full },
  ctas:     { gap: spacing[3] },
  loginBtn: { height: 56, borderRadius: radius['3xl'], alignItems: 'center', justifyContent: 'center' },
});