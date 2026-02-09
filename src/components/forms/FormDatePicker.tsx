import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DatePicker } from '@ant-design/react-native';
import { spacing, body, caption, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatDate } from '@/utils/formatters';

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  value: Date | undefined;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function FormDatePicker({
  label,
  required = false,
  error,
  disabled = false,
  placeholder = 'Selecione a data...',
  value,
  onChange,
  minDate,
  maxDate,
}: Props) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <DatePicker
        value={value}
        mode="date"
        minDate={minDate}
        maxDate={maxDate}
        onChange={onChange}
        disabled={disabled}
      >
        <TouchableOpacity
          style={[
            styles.trigger,
            error ? styles.triggerError : null,
            disabled ? styles.triggerDisabled : null,
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.triggerText,
              !value && styles.placeholder,
            ]}
          >
            {value ? formatDate(value) : placeholder}
          </Text>
        </TouchableOpacity>
      </DatePicker>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...caption.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  trigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: colors.white,
  },
  triggerError: {
    borderColor: colors.error,
  },
  triggerDisabled: {
    backgroundColor: colors.gray100,
  },
  triggerText: {
    ...body.md,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: colors.textPlaceholder,
  },
  error: {
    ...caption.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
