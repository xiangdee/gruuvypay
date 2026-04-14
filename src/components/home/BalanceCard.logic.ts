import { useRef } from 'react';
import { Animated } from 'react-native';

export function useBalanceCardLogic(visible: boolean) {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  function animateToggle(toVisible: boolean) {
    Animated.timing(fadeAnim, {
      toValue: toVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  return { fadeAnim, animateToggle };
}