import React from 'react';
import { View, Text } from 'react-native';
import { spacing, body, heading } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, color, icon }: Props) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.value, color ? { color } : null]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  card: {
    flex: 1 as const,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.sm },
  icon: { marginRight: spacing.sm },
  title: { ...body.sm, color: colors.textSecondary },
  value: { ...heading.h2, color: colors.textPrimary },
  subtitle: { ...body.sm, color: colors.textTertiary, marginTop: 4 },
});
