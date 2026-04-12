import { useRef } from 'react';
import { Animated, GestureResponderEvent } from 'react-native';

export function useButtonLogic(disabled?: boolean, loading?: boolean) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  return { scale, handlePressIn, handlePressOut };
}