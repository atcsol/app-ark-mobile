import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { spacing, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

export interface FilterOption<T extends string = string> {
  label: string;
  value: T;
}

interface FilterChipsProps<T extends string = string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string = string>({
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface ToggleFilterProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleFilter({ label, value, onChange }: ToggleFilterProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.toggleContainer}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    ...caption.md,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  toggleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    ...caption.md,
    color: colors.textSecondary,
  },
});
