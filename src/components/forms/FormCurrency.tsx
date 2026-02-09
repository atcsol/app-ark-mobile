import React, { useState, useCallback } from 'react';
import { View, Text, TextInput } from 'react-native';
import { spacing, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  value: number | undefined;
  onChangeValue: (value: number) => void;
}

function formatDisplay(cents: number): string {
  const val = (cents / 100).toFixed(2);
  const [intPart, decPart] = val.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${formatted},${decPart}`;
}

export function FormCurrency({
  label,
  required = false,
  error,
  disabled = false,
  placeholder = 'R$ 0,00',
  value,
  onChangeValue,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [displayValue, setDisplayValue] = useState(
    value ? formatDisplay(Math.round(value * 100)) : '',
  );

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, '');
      if (digits === '') {
        setDisplayValue('');
        onChangeValue(0);
        return;
      }
      const cents = parseInt(digits, 10);
      setDisplayValue(formatDisplay(cents));
      onChangeValue(cents / 100);
    },
    [onChangeValue],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          disabled ? styles.inputDisabled : null,
        ]}
        value={displayValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="numeric"
        editable={!disabled}
      />
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.textTertiary,
  },
  error: {
    ...caption.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
