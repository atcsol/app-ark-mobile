import React from 'react';
import { View, Text } from 'react-native';
import { body, heading } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Nenhum resultado',
  description = 'Nao ha dados para exibir.',
  icon,
  action,
}: Props) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: { flex: 1 as const, justifyContent: 'center' as const, alignItems: 'center' as const, padding: 48 },
  iconWrap: { marginBottom: 16 },
  title: { ...heading.h4, color: colors.textPrimary, textAlign: 'center' as const },
  description: { ...body.md, color: colors.textSecondary, textAlign: 'center' as const, marginTop: 8 },
  action: { marginTop: 24 },
});
