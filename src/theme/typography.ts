// Uses Inter — installed via @expo-google-fonts/inter
// Pair: Inter for body, Inter Bold/ExtraBold for headings (clean fintech look)

import { TextStyle } from 'react-native';

export const fontFamily = {
  regular:     'Inter_400Regular',
  medium:      'Inter_500Medium',
  semiBold:    'Inter_600SemiBold',
  bold:        'Inter_700Bold',
  extraBold:   'Inter_800ExtraBold',
} as const;

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 40,
} as const;

export const lineHeight = {
  tight:   1.2,
  snug:    1.35,
  normal:  1.5,
  relaxed: 1.65,
} as const;

// Pre-built text styles — use these in components
export const textStyles = {
  // Display — big balance numbers, hero text
  display: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize['4xl'],
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: -1,
  } as TextStyle,

  // Headings
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.snug,
    letterSpacing: -0.3,
  } as TextStyle,

  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
  } as TextStyle,

  // Body
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
  } as TextStyle,

  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  } as TextStyle,

  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  } as TextStyle,

  // Labels
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  } as TextStyle,

  labelSm: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
  } as TextStyle,

  // Button text
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    letterSpacing: 0.2,
  } as TextStyle,

  buttonSm: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    letterSpacing: 0.2,
  } as TextStyle,

  // Monospace — account numbers, transaction refs
  mono: {
    fontFamily: 'monospace',
    fontSize: fontSize.base,
    letterSpacing: 0.5,
  } as TextStyle,

  // Caption — timestamps, fine print
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  } as TextStyle,
} as const;