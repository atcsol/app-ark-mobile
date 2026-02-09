import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleProp, TextStyle } from 'react-native';
import { spacing, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  style?: StyleProp<TextStyle>;
}

export function FormInput({
  label,
  required = false,
  error,
  disabled = false,
  style,
  ...inputProps
}: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

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
          style,
        ]}
        placeholderTextColor={colors.textPlaceholder}
        editable={!disabled}
        {...inputProps}
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
