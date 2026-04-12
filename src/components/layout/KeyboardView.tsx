import React from 'react';
import {
  KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
  ScrollView, StyleSheet, ViewStyle,
} from 'react-native';

interface KeyboardViewProps {
  children:  React.ReactNode;
  style?:    ViewStyle;
  scrollable?: boolean;
}

export function KeyboardView({ children, style, scrollable }: KeyboardViewProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {scrollable
          ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
            >
              {children}
            </ScrollView>
          )
          : <>{children}</>
        }
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  scroll: { flexGrow: 1 },
});