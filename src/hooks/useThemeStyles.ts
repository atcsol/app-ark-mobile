import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { Colors } from '@/theme/colors';

type NamedStyles<T> = { [P in keyof T]: any };

export function useThemeStyles<T extends NamedStyles<T>>(
  createStyles: (colors: Colors) => T,
): T {
  const { colors } = useTheme();
  return useMemo(
    () => StyleSheet.create(createStyles(colors)) as unknown as T,
    [colors, createStyles],
  );
}
