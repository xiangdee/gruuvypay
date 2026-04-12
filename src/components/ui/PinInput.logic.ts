import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const PIN_LENGTH = 4;

export function usePinInputLogic(onComplete?: (pin: string) => void) {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims  = useRef(
    Array(PIN_LENGTH).fill(null).map(() => new Animated.Value(0)),
  ).current;

  function handleKeyPress(key: string) {
    if (key === 'delete') {
      const newPin = [...pin];
      const idx = activeIndex > 0 ? activeIndex - 1 : 0;
      newPin[idx] = '';
      setPin(newPin);
      setActiveIndex(idx);
      return;
    }

    if (activeIndex >= PIN_LENGTH) return;

    const newPin = [...pin];
    newPin[activeIndex] = key;
    setPin(newPin);

    // Animate dot fill
    Animated.spring(dotAnims[activeIndex], {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();

    const nextIndex = activeIndex + 1;
    setActiveIndex(nextIndex);

    if (nextIndex === PIN_LENGTH) {
      onComplete?.(newPin.join(''));
    }
  }

  function reset() {
    setPin(Array(PIN_LENGTH).fill(''));
    setActiveIndex(0);
    dotAnims.forEach((anim) => anim.setValue(0));
  }

  function shake() {
    reset();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  }

  return { pin, activeIndex, shakeAnim, dotAnims, handleKeyPress, reset, shake };
}