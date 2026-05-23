// Single source of truth for all in-progress indicators.
// Swap the internals here to change every loading animation in the app.

import React from 'react';
import { ActivityIndicator } from 'react-native';

interface SpinnerProps {
  color?: string;
  size?: 'small' | 'large';
}

export function Spinner({ color = '#D7FF64', size = 'small' }: SpinnerProps) {
  return <ActivityIndicator color={color} size={size} />;
}
