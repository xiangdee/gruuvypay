// TIER_1 → TIER_2: NIN + Utility Bill upload

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/auth.slice';
import { kycApi } from '@/api/kyc.api';
import { Input }     from '@/components/ui/Input';
import { Button }    from '@/components/ui/Button';
import { ErrorCard } from '@/components/ui/ErrorCard';
import { useTheme, textStyles, spacing, radius } from '@/theme';

const UTILITY_TYPES = [
  { id: 'electricity', label: 'Electricity Bill' },
  { id: 'water',       label: 'Water Bill' },
  { id: 'waste',       label: 'Waste Management' },
  { id: 'internet',    label: 'Internet / DSTV Bill' },
];

export default function NinScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const dispatch   = useAppDispatch();

  const [nin,          setNin]          = useState('');
  const [utilityType,  setUtilityType]  = useState('electricity');
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setError('');
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Please allow camera access');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality:    0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setError('');
    }
  }

  async function handleSubmit() {
    if (!/^\d{11}$/.test(nin)) { setError('Enter a valid 11-digit NIN'); return; }
    if (!imageUri)              { setError('Upload your utility bill');   return; }

    setError('');
    setUploading(true);

    try {
      // Upload image first
      const { url } = await kycApi.uploadDocument(imageUri, 'utility-bill');

      setUploading(false);
      setLoading(true);

      // Submit NIN + document URL
      await kycApi.submitNin({ nin, utilityBillUrl: url, utilityType });

      dispatch(setUser({ tier: 'TIER_2' } as any));
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Submission failed. Please try again.');
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
        <View style={styles.successScreen}>
          <Ionicons name="checkmark-circle" size={72} color={theme.status.success} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[5] }]}>
            Documents Verified!
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your account has been upgraded to Tier 2. You can now send up to ₦1,000,000 per transaction.
          </Text>
          <Button label="Continue" onPress={() => router.replace('/(app)/kyc')} style={styles.successBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Ionicons name="document-text-outline" size={32} color={theme.brand.primary} />
          <Text style={[textStyles.h2, { color: theme.text.primary, marginTop: spacing[3] }]}>
            NIN + Utility Bill
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Submit your National Identification Number and a recent utility bill (not older than 3 months).
          </Text>
        </View>

        {error ? <ErrorCard message={error} /> : null}

        <Input
          label="NIN (National Identification Number)"
          placeholder="Enter your 11-digit NIN"
          keyboardType="numeric"
          value={nin}
          onChangeText={(t) => { setNin(t.replace(/\D/g, '').slice(0, 11)); setError(''); }}
          maxLength={11}
          hint="Dial *346# to get your NIN"
        />

        {/* Utility bill type */}
        <View>
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
            Utility Bill Type
          </Text>
          <View style={styles.utilityRow}>
            {UTILITY_TYPES.map((u) => (
              <TouchableOpacity
                key={u.id}
                onPress={() => setUtilityType(u.id)}
                style={[
                  styles.utilityChip,
                  { backgroundColor: theme.bg.secondary },
                  utilityType === u.id && { backgroundColor: theme.brand.primary + '15', borderColor: theme.brand.primary, borderWidth: 1.5 },
                ]}
              >
                <Text style={[
                  textStyles.labelSm,
                  { color: utilityType === u.id ? theme.brand.primary : theme.text.secondary },
                ]}>
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Image upload */}
        <View>
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
            Utility Bill Photo
          </Text>

          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={[styles.removeImg, { backgroundColor: theme.status.error }]}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadRow}>
              <TouchableOpacity
                onPress={pickImage}
                style={[styles.uploadBtn, { backgroundColor: theme.bg.secondary }]}
              >
                <Ionicons name="image-outline" size={24} color={theme.brand.primary} />
                <Text style={[textStyles.label, { color: theme.brand.primary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={takePhoto}
                style={[styles.uploadBtn, { backgroundColor: theme.bg.secondary }]}
              >
                <Ionicons name="camera-outline" size={24} color={theme.brand.primary} />
                <Text style={[textStyles.label, { color: theme.brand.primary }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[1] }]}>
            Must show your name, address, and be dated within 3 months
          </Text>
        </View>

        <Button
          label={uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Documents'}
          onPress={handleSubmit}
          loading={uploading || loading}
          disabled={nin.length !== 11 || !imageUri}
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
  utilityRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  utilityChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  uploadRow:   { flexDirection: 'row', gap: spacing[3] },
  uploadBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], borderRadius: radius.xl,
    paddingVertical: spacing[5],
  },
  imagePreview: { position: 'relative', borderRadius: radius.xl, overflow: 'hidden' },
  previewImg:   { width: '100%', height: 200 },
  removeImg: {
    position: 'absolute', top: spacing[2], right: spacing[2],
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  successScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6],
  },
  successBtn: { width: '100%', marginTop: spacing[8] },
});