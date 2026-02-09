import { TextStyle } from 'react-native';

/**
 * ARK Garage - Typography system
 *
 * Defines font sizes, line heights, and weights for
 * consistent text rendering across the app.
 */

// ---------------------
// Font sizes
// ---------------------
export const fontSize = {
  /** 10px */
  xs: 10,
  /** 12px */
  sm: 12,
  /** 14px - base body text */
  md: 14,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 28px */
  xxxl: 28,
} as const;

// ---------------------
// Line heights
// ---------------------
export const lineHeight = {
  /** tight - 1.2x ratio */
  xs: 14,
  sm: 18,
  md: 22,
  lg: 24,
  xl: 28,
  xxl: 32,
  xxxl: 36,
} as const;

// ---------------------
// Font weights
// ---------------------
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ---------------------
// Typography presets
// ---------------------

/** Heading styles */
export const heading: Record<string, TextStyle> = {
  h1: {
    fontSize: fontSize.xxxl,
    lineHeight: lineHeight.xxxl,
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.semibold,
  },
  h4: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.semibold,
  },
};

/** Body text styles */
export const body: Record<string, TextStyle> = {
  lg: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.regular,
  },
  md: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.regular,
  },
  sm: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.regular,
  },
  xs: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.regular,
  },
};

/** Caption / label styles */
export const caption: Record<string, TextStyle> = {
  md: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: fontWeight.medium,
  },
  sm: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    fontWeight: fontWeight.medium,
  },
};

export type FontSize = typeof fontSize;
export type FontSizeKey = keyof FontSize;
