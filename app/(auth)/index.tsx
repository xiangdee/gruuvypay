// app/(auth)/index.tsx
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions,
  Animated,
  Pressable,
  TouchableWithoutFeedback,
  
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { palette } from '@/theme/colors';
import { useAppSelector } from '@/store/hooks';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';  
import { siteLink } from '@/constants/links';

const { width } = Dimensions.get('window');
export default function WelcomeScreen() {
  const router    = useRouter();
  const { theme } = useTheme();
  const { isAuthenticated, onboardingStep } = useAppSelector((s) => s.auth);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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

  const openLink  = (url: string) => Linking.openURL(url);

return (
    <View style={[styles.container, { backgroundColor: '#080908' }]}>
      <StatusBar style="light" />
      
      {/* Background Decor: The "Fintech Glow" */}
      <View style={[styles.glowOrb, { backgroundColor: theme.brand.primary, opacity: 0.15 }]} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        
        {/* Visual Header: Abstract Floating Cards */}
        <Animated.View style={[styles.heroContainer, { opacity: fadeAnim }]}>
           <View style={[styles.floatingCard, styles.cardBack, { backgroundColor: theme.brand.primary, opacity: 0.2 }]} />
           <View style={[styles.floatingCard, styles.cardMid, { backgroundColor: theme.brand.primary, opacity: 0.4 }]} />
           <View style={[styles.floatingCard, styles.cardFront, { backgroundColor: theme.brand.primary }]}>
              <View style={styles.cardChip} />
              <Text style={[styles.cardBrand, { color: theme.brand.primary }]}>GRV</Text>
           </View>
        </Animated.View>

        {/* Content Section */}
        <View style={styles.textSection}>
          <Text style={[styles.headline, { color: palette.white }]}>
            Pay Every Bill,{'\n'}
            <Text style={{ color: theme.brand.primary }}>In One Tap</Text>
          </Text>
          <Text style={styles.subheadline}>
            Electricity, airtime, internet, cable TV and more — settled instantly from one app.
          </Text>
        </View>

        {/* Actions Section */}
        <View style={styles.footer}>
          <View style={styles.buttonStack}>
            <Button
              label="Create Account"
              onPress={() => router.push('/(auth)/sign-up')}
             
            />
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/login')}
              style={[styles.loginBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}
            >
              <Text style={[textStyles.button, { color: palette.white }]}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <TouchableWithoutFeedback onPress={() => openLink(`${siteLink}/terms`)}><Text style={styles.legalBold}>Terms</Text></TouchableWithoutFeedback> &{' '}
              <TouchableWithoutFeedback onPress={() => openLink(`${siteLink}/privacy`)}><Text style={styles.legalBold}>Privacy Policy</Text></TouchableWithoutFeedback>
            </Text>
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  glowOrb: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width,
    height: width,
    borderRadius: width / 2,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  // Floating Card Visuals
  heroContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  floatingCard: {
    width: 200,
    height: 130,
    borderRadius: 20,
    position: 'absolute',
  },
  cardBack: { transform: [{ rotate: '-15deg' }, { translateX: -30 }] },
  cardMid: { transform: [{ rotate: '-5deg' }, { translateX: -10 }] },
  cardFront: {
    transform: [{ rotate: '5deg' }, { translateX: 20 }],
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  cardChip: { width: 35, height: 25, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 4 },
  cardBrand: { fontWeight: '900', color: 'rgba(0,0,0,0.3)', textAlign: 'right' },

  // Typography
  textSection: { alignItems: 'center' },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -1,
  },
  subheadline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Buttons & Footer
  footer: { marginBottom: 20 },
  buttonStack: { gap: 14 },
  loginBtn: {
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  legalContainer: { marginTop: 24 },
  legalText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
  legalBold: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
});