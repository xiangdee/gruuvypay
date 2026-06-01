import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, textStyles, spacing, radius } from '@/theme';

interface Props {
  visible:      boolean;
  defaultAlias: string;
  onSave:       (alias: string) => void;
  onCancel:     () => void;
}

export function SaveBeneficiaryModal({ visible, defaultAlias, onSave, onCancel }: Props) {
  const { theme } = useTheme();
  const [alias, setAlias] = useState('');

  useEffect(() => {
    if (visible) setAlias(defaultAlias);
  }, [visible, defaultAlias]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: theme.bg.primary, borderColor: theme.border.DEFAULT }]}>
          <View style={styles.header}>
            <Text style={[textStyles.h4 ?? textStyles.h3, { color: theme.text.primary }]}>Save Beneficiary</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={theme.text.muted} />
            </TouchableOpacity>
          </View>

          <Text style={[textStyles.bodySm, { color: theme.text.secondary, marginBottom: spacing[4] }]}>
            Give this a name so it's easy to find later.
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: theme.bg.secondary, borderColor: theme.border.DEFAULT }]}>
            <Ionicons name="person-outline" size={18} color={theme.text.muted} style={{ marginRight: spacing[2] }} />
            <TextInput
              value={alias}
              onChangeText={setAlias}
              placeholder="e.g. Mum's meter, Work router…"
              placeholderTextColor={theme.text.muted}
              style={[textStyles.body, { color: theme.text.primary, flex: 1 }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => alias.trim() && onSave(alias.trim())}
            />
            {alias.length > 0 && (
              <TouchableOpacity onPress={() => setAlias('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.text.muted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.btn, { backgroundColor: theme.bg.secondary }]}
              activeOpacity={0.7}
            >
              <Text style={[textStyles.label, { color: theme.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSave(alias.trim() || defaultAlias)}
              style={[styles.btn, { backgroundColor: theme.brand.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[textStyles.label, { color: '#000' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing[5],
  },
  sheet: {
    width: '100%', borderRadius: radius['2xl'],
    borderWidth: 1, padding: spacing[5],
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing[2],
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: radius.xl,
    paddingHorizontal: spacing[3], paddingVertical: spacing[3],
    marginBottom: spacing[5],
  },
  actions: { flexDirection: 'row', gap: spacing[3] },
  btn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing[3.5], borderRadius: radius.xl,
  },
});
