import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { body } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  message?: string;
}

export function LoadingScreen({ message = 'Carregando...' }: Props) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={styles.text.color} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: { flex: 1 as const, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: colors.background },
  text: { ...body.md, color: colors.textSecondary, marginTop: 16 },
});
