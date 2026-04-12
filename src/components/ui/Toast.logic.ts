import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hideToast } from '@/store/slices/ui.slice';

export function useToastLogic() {
  const dispatch = useAppDispatch();
  const toast    = useAppSelector((s) => s.ui.toast);
  const slideY   = useRef(new Animated.Value(-120)).current;
  const opacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    // Slide in
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => dismiss(), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideY,  { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 250, useNativeDriver: true }),
    ]).start(() => dispatch(hideToast()));
  }

  return { toast, slideY, opacity, dismiss };
}