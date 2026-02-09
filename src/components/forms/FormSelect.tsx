import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Modal } from '@ant-design/react-native';
import { spacing, body, caption, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { SelectOption } from '@/types';

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  value: string | number | undefined;
  options: SelectOption[];
  onValueChange: (value: string) => void;
}

export function FormSelect({
  label,
  required = false,
  error,
  disabled = false,
  placeholder = 'Selecione...',
  value,
  options,
  onValueChange,
}: Props) {
  const styles = useThemeStyles(createStyles);
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find((o) => String(o.value) === String(value));

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.trigger,
          error ? styles.triggerError : null,
          disabled ? styles.triggerDisabled : null,
        ]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedOption && styles.placeholder,
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.chevron}>{'>'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={visible}
        transparent
        maskClosable
        onClose={() => setVisible(false)}
        animationType="slide-up"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>
          {options.map((option) => (
            <TouchableOpacity
              key={String(option.value)}
              style={[
                styles.option,
                String(option.value) === String(value) && styles.optionSelected,
              ]}
              onPress={() => handleSelect(String(option.value))}
            >
              <Text
                style={[
                  styles.optionText,
                  String(option.value) === String(value) && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
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
  chevron: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  error: {
    ...caption.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xxxl,
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...body.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  modalClose: {
    ...body.md,
    color: colors.accent,
  },
  option: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  optionSelected: {
    backgroundColor: colors.accent + '15',
  },
  optionText: {
    ...body.md,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
});
