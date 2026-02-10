import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { heading, body, spacing } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: Props) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
