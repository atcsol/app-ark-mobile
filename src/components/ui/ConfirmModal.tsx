import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Modal, Button } from '@ant-design/react-native';
import { spacing, heading, body, borderRadius } from '@/theme';
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
          <Button
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type={danger ? 'warning' : 'primary'}
            style={styles.confirmBtn}
            onPress={handleConfirm}
            disabled={confirmDisabled}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Colors) => ({
  content: {
    padding: spacing.xl,
  },
  title: {
    ...heading.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...body.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...body.md,
    color: colors.textPrimary,
    minHeight: 80,
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
