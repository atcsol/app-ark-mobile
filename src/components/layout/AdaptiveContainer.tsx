import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAdaptiveLayout } from '@/hooks';

interface Props {
  children: React.ReactNode;
  style?: any;
}

export function AdaptiveContainer({ children, style }: Props) {
  const { paddingHorizontal } = useAdaptiveLayout();

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
