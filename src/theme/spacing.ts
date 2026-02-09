/**
 * ARK Garage - Spacing system
 *
 * Based on an 8px grid. All spacing values are multiples of 4
 * to maintain visual consistency across the app.
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  xxl: 32,
  /** 48px */
  xxxl: 48,
} as const;

/** Padding presets for common layout patterns */
export const padding = {
  /** Horizontal padding for screen content */
  screen: spacing.lg,
  /** Padding inside cards and containers */
  card: spacing.lg,
  /** Padding inside list items */
  listItem: spacing.md,
  /** Padding inside buttons */
  buttonHorizontal: spacing.lg,
  buttonVertical: spacing.md,
  /** Padding inside input fields */
  inputHorizontal: spacing.md,
  inputVertical: spacing.sm,
} as const;

/** Margin presets for common layout patterns */
export const margin = {
  /** Vertical gap between sections */
  section: spacing.xl,
  /** Vertical gap between form fields */
  field: spacing.lg,
  /** Vertical gap between related items */
  item: spacing.sm,
  /** Vertical gap between inline elements */
  inline: spacing.xs,
} as const;

/** Border radius values */
export const borderRadius = {
  /** 4px - subtle rounding */
  sm: 4,
  /** 8px - standard rounding */
  md: 8,
  /** 12px - prominent rounding */
  lg: 12,
  /** 16px - very round */
  xl: 16,
  /** 9999px - fully round (pill shape) */
  full: 9999,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
