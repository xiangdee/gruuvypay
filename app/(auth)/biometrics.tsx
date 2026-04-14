import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { useTheme, textStyles, spacing, radius } from '@/theme';
import { useBiometricsLogic } from '../../src/screens/auth/biometrics.logic';

export default function BiometricsScreen() {
  const { theme } = useTheme();
  const { loading, enableBiometrics, skipBiometrics, getBiometricType } = useBiometricsLogic();
  const [biometricType, setBiometricType] = useState<'faceid' | 'fingerprint' | null>(null);

  useEffect(() => {
    getBiometricType().then(setBiometricType);
  }, []);

  const isFaceId     = biometricType === 'faceid';
  const iconName     = isFaceId ? 'scan-outline' : 'finger-print-outline';
  const biometricLabel = isFaceId ? 'Face ID' : 'Fingerprint';

  return (
    <Screen padded>
      <View style={styles.inner}>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={[textStyles.h1, { color: theme.text.primary, textAlign: 'center' }]}>
            Fast & Secure Access
          </Text>
          <Text style={[
            textStyles.body,
            { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[3] },
          ]}>
            Make your transactions faster and secure with Biometrics enabled
          </Text>
        </View>

        {/* Phone mockup with Face ID — matches screenshot */}
        <View style={[styles.mockupContainer, { backgroundColor: theme.bg.secondary }]}>
          <View style={[styles.biometricCard, { backgroundColor: theme.bg.primary }]}>
            <Ionicons name={iconName} size={48} color={theme.text.primary} />
            <Text style={[textStyles.label, { color: theme.text.primary, marginTop: spacing[2] }]}>
              {biometricLabel}
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Button
            label="Continue"
            onPress={enableBiometrics}
            loading={loading}
          />

          <TouchableOpacity
            onPress={skipBiometrics}
            disabled={loading}
            style={styles.skipBtn}
          >
            <Text style={[textStyles.label, { color: theme.text.primary }]}>
              Maybe Later
            </Text>
          </TouchableOpacity>

          <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center' }]}>
            You can change settings at anytime
          </Text>
        </View>

      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: spacing[8],
  },
  heading: {
    marginBottom: spacing[8],
  },
  mockupContainer: {
    flex: 1,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing[4],
    marginBottom: spacing[8],
    minHeight: 280,
  },
  biometricCard: {
    width: 140,
    height: 140,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  ctas: {
    gap: spacing[4],
    paddingBottom: spacing[4],
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
});