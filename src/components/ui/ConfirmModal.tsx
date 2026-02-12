import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Modal } from '@ant-design/react-native';
import { spacing, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  requireReason = false,
  reasonPlaceholder = 'Motivo...',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(requireReason ? reason : undefined);
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  const confirmDisabled = loading || (requireReason && reason.trim().length === 0);

  return (
    <Modal
      visible={visible}
      transparent
      maskClosable={!loading}
      onClose={handleCancel}
      animationType="fade"
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {requireReason && (
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder={reasonPlaceholder}
            placeholderTextColor={colors.textPlaceholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        )}

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              danger ? styles.confirmBtnDanger : styles.confirmBtnPrimary,
              confirmDisabled && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={confirmDisabled}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.confirmBtnText, confirmDisabled && styles.confirmBtnTextDisabled]}>
                {confirmLabel}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Colors) => ({
  content: {
    padding: spacing.lg,
  },
  title: {
    ...body.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    ...caption.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...body.sm,
    color: colors.textPrimary,
    minHeight: 72,
    marginBottom: spacing.md,
  },
  buttons: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.white,
  },
  cancelBtnText: {
    ...body.sm,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  confirmBtnPrimary: {
    backgroundColor: colors.accent,
  },
  confirmBtnDanger: {
    backgroundColor: colors.error,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    ...body.sm,
    fontWeight: '500' as const,
    color: colors.white,
  },
  confirmBtnTextDisabled: {
    color: colors.white,
  },
});
