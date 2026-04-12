import { useState, useRef } from 'react';
import { Animated } from 'react-native';

export function useInputLogic() {
  const [isFocused, setIsFocused]   = useState(false);
  const [showValue, setShowValue]   = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  function onFocus() {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }

  function onBlur() {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }

  function toggleShowValue() {
    setShowValue((prev) => !prev);
  }

  return { isFocused, showValue, borderAnim, onFocus, onBlur, toggleShowValue };
}