// app/(app)/kyc/address.tsx
// TIER_2 â†’ TIER_3: Manual address submission — admin approves

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { kycApi } from '@/api/kyc.api';
import { Input }     from '@/components/ui/Input';
import { Button }    from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing, radius } from '@/theme';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

export default function AddressScreen() {
  const { theme } = useTheme();
  const router    = useRouter();

  const [address,    setAddress]    = useState('');
  const [city,       setCity]       = useState('');
  const [state,      setState]      = useState('Rivers');
  const [showStates, setShowStates] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  async function handleSubmit() {
    if (!address.trim()) { setError('Enter your street address'); return; }
    if (!city.trim())    { setError('Enter your city');           return; }

    setError('');
    setLoading(true);
    try {
      await kycApi.submitAddressManually({ address: address.trim(), city: city.trim(), state });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.successScreen}>
          <Ionicons name="time-outline" size={72} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
            Submitted for Review
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your address has been submitted. Our team will review and upgrade your account within 1–2 business days.
          </Text>
          <Text style={[textStyles.caption, { color: theme.text.muted, textAlign: 'center', marginTop: spacing[3] }]}>
            You will receive an email and push notification when your account is upgraded.
          </Text>
          <Button label="Done" onPress={() => router.replace('/(app)')} style={styles.successBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Ionicons name="home-outline" size={32} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[3] }]}>
            Address Verification
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Enter your residential address to unlock unlimited transfers. Our team will verify it within 1–2 business days.
          </Text>
        </View>

        {error ? <ErrorCard message={error} /> : null}

        <Input
          label="Street Address"
          placeholder="e.g. 12 Aba Road"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
        />

        <Input
          label="City"
          placeholder="e.g. Port Harcourt"
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        {/* State picker */}
        <View>
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
            State
          </Text>
          <TouchableOpacity
            onPress={() => setShowStates(!showStates)}
            style={[styles.statePicker, { backgroundColor: theme.bg.secondary }]}
          >
            <Text style={[textStyles.body, { color: theme.text.primary }]}>{state}</Text>
            <Ionicons name={showStates ? 'chevron-up' : 'chevron-down'} size={16} color={theme.text.muted} />
          </TouchableOpacity>
          {showStates && (
            <View style={[styles.stateDropdown, { backgroundColor: theme.bg.secondary }]}>
              {NIGERIAN_STATES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => { setState(s); setShowStates(false); }}
                  style={[styles.stateItem, s === state && { backgroundColor: theme.brand.primary + '15' }]}
                >
                  <Text style={[textStyles.body, { color: s === state ? theme.brand.primary : theme.text.primary }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Button
          label={loading ? 'Submitting...' : 'Submit for Verification'}
          onPress={handleSubmit}
          loading={loading}
          disabled={!address || !city || loading}
        />

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  content:     { padding: spacing[4], gap: spacing[4] },
  header:      { alignItems: 'center', marginBottom: spacing[2] },
  statePicker: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderRadius: radius.xl,
    padding: spacing[4],
  },
  stateDropdown: {
    borderRadius: radius.xl, maxHeight: 200,
    marginTop: spacing[1], overflow: 'hidden',
  },
  stateItem: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6],
  },
  successBtn: { width: '100%', marginTop: spacing[8] },
});
