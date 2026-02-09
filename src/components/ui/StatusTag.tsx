import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';

type StatusVariant = 'vehicle' | 'approval' | 'user' | 'service' | 'generic';

const LIGHT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  in_analysis: { bg: '#e6f7ff', text: '#1890ff' },
  in_repair: { bg: '#fff7e6', text: '#fa8c16' },
  ready: { bg: '#f6ffed', text: '#52c41a' },
  for_sale: { bg: '#f9f0ff', text: '#722ed1' },
  sold: { bg: '#f0f0f0', text: '#666666' },
  pending: { bg: '#fff7e6', text: '#fa8c16' },
  approved: { bg: '#f6ffed', text: '#52c41a' },
  rejected: { bg: '#fff1f0', text: '#ff4d4f' },
  in_progress: { bg: '#e6f7ff', text: '#1890ff' },
  completed: { bg: '#f6ffed', text: '#52c41a' },
  cancelled: { bg: '#f0f0f0', text: '#666666' },
  active: { bg: '#f6ffed', text: '#52c41a' },
  inactive: { bg: '#f0f0f0', text: '#666666' },
};

const DARK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  in_analysis: { bg: '#112a45', text: '#40a9ff' },
  in_repair: { bg: '#2b2111', text: '#ffc53d' },
  ready: { bg: '#162312', text: '#73d13d' },
  for_sale: { bg: '#1a1325', text: '#9254de' },
  sold: { bg: '#2a2a2a', text: '#999999' },
  pending: { bg: '#2b2111', text: '#ffc53d' },
  approved: { bg: '#162312', text: '#73d13d' },
  rejected: { bg: '#2a1215', text: '#ff7875' },
  in_progress: { bg: '#112a45', text: '#40a9ff' },
  completed: { bg: '#162312', text: '#73d13d' },
  cancelled: { bg: '#2a2a2a', text: '#999999' },
  active: { bg: '#162312', text: '#73d13d' },
  inactive: { bg: '#2a2a2a', text: '#999999' },
};

const STATUS_LABELS: Record<string, string> = {
  in_analysis: 'Em Analise',
  in_repair: 'Em Reparo',
  ready: 'Pronto',
  for_sale: 'A Venda',
  sold: 'Vendido',
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  in_progress: 'Em Andamento',
  completed: 'Concluido',
  cancelled: 'Cancelado',
  active: 'Ativo',
  inactive: 'Inativo',
};

interface Props {
  status: string;
  variant?: StatusVariant;
  label?: string;
  small?: boolean;
}

export function StatusTag({ status, label, small }: Props) {
  const { isDark } = useTheme();
  const statusMap = isDark ? DARK_STATUS_COLORS : LIGHT_STATUS_COLORS;
  const fallback = isDark
    ? { bg: '#2a2a2a', text: '#999999' }
    : { bg: '#f0f0f0', text: '#666666' };
  const colorSet = statusMap[status] || fallback;
  const displayLabel = label || STATUS_LABELS[status] || status;

  return (
    <View style={[styles.tag, { backgroundColor: colorSet.bg }, small && styles.tagSmall]}>
      <Text
        style={[
          small ? styles.textSmall : styles.text,
          { color: colorSet.text },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  tagSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    ...caption.md,
    fontWeight: '600',
  },
  textSmall: {
    ...caption.sm,
    fontWeight: '600',
  },
});
