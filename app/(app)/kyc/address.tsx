// app/(app)/kyc/address.tsx
// TIER_2 → TIER_3: Address verification

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

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const DOC_TYPES = [
  { id: 'utility_bill',    label: 'Utility Bill' },
  { id: 'bank_statement',  label: 'Bank Statement' },
  { id: 'tenancy',         label: 'Tenancy Agreement' },
  { id: 'govt_letter',     label: 'Government Letter' },
];

export default function AddressScreen() {
  const { theme }  = useTheme();
  const router     = useRouter();
  const dispatch   = useAppDispatch();

  const [address,     setAddress]    = useState('');
  const [city,        setCity]       = useState('');
  const [state,       setState]      = useState('Rivers');
  const [docType,     setDocType]    = useState('utility_bill');
  const [imageUri,    setImageUri]   = useState<string | null>(null);
  const [showStates,  setShowStates] = useState(false);
  const [uploading,   setUploading]  = useState(false);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState('');
  const [success,     setSuccess]    = useState(false);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError('Allow photo library access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri); setError('');
    }
  }

  async function handleSubmit() {
    if (!address.trim()) { setError('Enter your street address'); return; }
    if (!city.trim())    { setError('Enter your city');           return; }
    if (!imageUri)       { setError('Upload proof of address');   return; }

    setError('');
    setUploading(true);

    try {
      const { url } = await kycApi.uploadDocument(imageUri, 'proof-of-address');
      setUploading(false);
      setLoading(true);

      await kycApi.submitAddress({
        address: address.trim(),
        city:    city.trim(),
        state,
        proofOfAddressUrl: url,
        addressDocType:    docType,
      });

      dispatch(setUser({ tier: 'TIER_3' } as any));
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
            Address Verified!
          </Text>
          <Text style={[textStyles.body, { color: theme.text.secondary, textAlign: 'center', marginTop: spacing[2] }]}>
            Your account now has maximum limits. Unlimited transfers, unlimited balance.
          </Text>
          <Button label="Finish" onPress={() => router.replace('/(app)')} style={styles.successBtn} />
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
            Confirm your residential address to unlock unlimited transfers.
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

        {/* Document type */}
        <View>
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
            Document Type
          </Text>
          <View style={styles.docTypeRow}>
            {DOC_TYPES.map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => setDocType(d.id)}
                style={[
                  styles.docChip,
                  { backgroundColor: theme.bg.secondary },
                  docType === d.id && { backgroundColor: theme.brand.primary + '15', borderColor: theme.brand.primary, borderWidth: 1.5 },
                ]}
              >
                <Text style={[textStyles.labelSm, { color: docType === d.id ? theme.brand.primary : theme.text.secondary }]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document upload */}
        <View>
          <Text style={[textStyles.label, { color: theme.text.primary, marginBottom: spacing[2] }]}>
            Proof of Address
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
            <TouchableOpacity
              onPress={pickImage}
              style={[styles.uploadArea, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}
            >
              <Ionicons name="cloud-upload-outline" size={32} color={theme.brand.primary} />
              <Text style={[textStyles.label, { color: theme.brand.primary, marginTop: spacing[2] }]}>
                Upload Document
              </Text>
              <Text style={[textStyles.caption, { color: theme.text.muted, marginTop: spacing[1] }]}>
                Must clearly show your name and address
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          label={uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit for Verification'}
          onPress={handleSubmit}
          loading={uploading || loading}
          disabled={!address || !city || !imageUri}
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
  docTypeRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  docChip:     { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  uploadArea: {
    borderRadius: radius.xl, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing[8],
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