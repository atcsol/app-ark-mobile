import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { useTheme } from '@/theme/ThemeContext';

export function DrawerToggle() {
  const { colors } = useTheme();
  return <DrawerToggleButton tintColor={colors.accent} />;
}

export function BackButton() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
      <Text style={{ fontSize: 16, color: colors.accent }}>‹ Voltar</Text>
    </TouchableOpacity>
  );
}
