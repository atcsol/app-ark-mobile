import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, getHeaderTitle } from '@react-navigation/elements';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Returns common header screenOptions for Stack navigators.
 * Uses the JS-based Header from @react-navigation/elements
 * instead of the native iOS header, ensuring consistent
 * positioning with the Drawer header.
 */
export function useHeaderOptions() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return {
    headerStyle: { backgroundColor: colors.background },
    headerStatusBarHeight: insets.top,
    headerShadowVisible: false,
    headerTintColor: colors.accent,
    headerLeftContainerStyle: { paddingLeft: 0 },
    header: ({ options, route, back }: any) =>
      React.createElement(Header, {
        ...options,
        title: getHeaderTitle(options, route.name),
        back,
      }),
  } as const;
}
