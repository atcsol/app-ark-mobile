import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type Colors } from './colors';
import { createAntdTheme } from './antdTheme';
import type { Theme } from '@ant-design/react-native/lib/style';

interface ThemeContextValue {
  colors: Colors;
  isDark: boolean;
  antdTheme: Partial<Theme>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  antdTheme: createAntdTheme(lightColors),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const value = useMemo<ThemeContextValue>(() => {
    const c = isDark ? darkColors : lightColors;
    return { colors: c, isDark, antdTheme: createAntdTheme(c) };
  }, [isDark]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
