/**
 * ARK Garage - Color palette
 *
 * Matches the web app's Ant Design color scheme.
 * Used throughout the mobile app for consistent branding.
 */

export const lightColors = {
  // Brand
  primary: '#1a1a1a',
  primaryLight: '#404040',
  accent: '#667eea',
  accentLight: '#8fa3f0',

  // Semantic
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  errorDark: '#f5222d',
  info: '#1890ff',
  infoCyan: '#13c2c2',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  background: '#f5f5f5',
  card: '#ffffff',
  border: '#e8e8e8',
  divider: '#f0f0f0',
  disabled: '#d9d9d9',
  overlay: 'rgba(0, 0, 0, 0.45)',

  // Text
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',
  textPlaceholder: '#bbbbbb',

  // Grays (for fine-grained control)
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#e8e8e8',
  gray300: '#d9d9d9',
  gray400: '#bfbfbf',
  gray500: '#999999',
  gray600: '#666666',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#1a1a1a',
} as const;

export const darkColors: Colors = {
  // Brand
  primary: '#e8e8e8',
  primaryLight: '#cccccc',
  accent: '#667eea',
  accentLight: '#8fa3f0',

  // Semantic
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  errorDark: '#f5222d',
  info: '#1890ff',
  infoCyan: '#13c2c2',

  // Neutrals
  white: '#1e1e1e',
  black: '#ffffff',
  background: '#121212',
  card: '#1e1e1e',
  border: '#333333',
  divider: '#2a2a2a',
  disabled: '#555555',
  overlay: 'rgba(0, 0, 0, 0.65)',

  // Text
  textPrimary: '#e8e8e8',
  textSecondary: '#a0a0a0',
  textTertiary: '#707070',
  textInverse: '#1a1a1a',
  textPlaceholder: '#555555',

  // Grays (inverted)
  gray50: '#1a1a1a',
  gray100: '#262626',
  gray200: '#333333',
  gray300: '#444444',
  gray400: '#555555',
  gray500: '#707070',
  gray600: '#a0a0a0',
  gray700: '#cccccc',
  gray800: '#e0e0e0',
  gray900: '#f0f0f0',
};

/** Backward-compatible static alias (light palette) */
export const colors = lightColors;

export type Colors = { [K in keyof typeof lightColors]: string };
export type ColorKey = keyof Colors;
