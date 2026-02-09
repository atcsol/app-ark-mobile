import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { getInitials } from '@/utils/formatters';

interface Props {
  name: string;
  imageUrl?: string;
  size?: number;
  color?: string;
}

export function Avatar({ name, imageUrl, size = 40, color }: Props) {
  const { colors } = useTheme();
  const bgColor = color || colors.accent;
  const initials = getInitials(name);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[{ backgroundColor: colors.gray200 }, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#ffffff', fontWeight: '600' },
});
