// Full-screen loading overlay used on PIN submission and auth transitions.
// Swap the internals here to change every full-screen loading animation in the app.

import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.bg}>
        <View style={styles.card}>
          <Spinner size="large" />
          {message ? <Text style={styles.text}>{message}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1A1F2E',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
