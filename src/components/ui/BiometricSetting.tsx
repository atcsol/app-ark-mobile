import React, { useCallback, useState } from 'react';
import { View, Text, Switch, Alert, StyleProp, ViewStyle } from 'react-native';
import { useBiometrics } from '@/hooks/useBiometrics';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface Props {
  style?: StyleProp<ViewStyle>;
}

/**
 * Lets the user turn off biometric login on this device.
 * Turning it on again happens on the next password login (the password is needed to store it).
 */
export function BiometricSetting({ style }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { isBiometricAvailable, isBiometricEnabled, biometricType, disableBiometrics } = useBiometrics();
  const [loading, setLoading] = useState(false);

  const label = biometricType || 'Biometria';

  const handleToggle = useCallback((value: boolean) => {
    if (value) return;
    Alert.alert(
      `Desativar ${label}`,
      'O login biométrico será removido deste aparelho. Você poderá ativá-lo novamente no próximo login com senha.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const ok = await disableBiometrics();
            setLoading(false);
            if (!ok) {
              Alert.alert('Erro', 'Não foi possível desativar a biometria.');
            }
          },
        },
      ],
    );
  }, [label, disableBiometrics]);

  if (!isBiometricAvailable && !isBiometricEnabled) return null;

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.sectionTitle}>Segurança</Text>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>Login com {label}</Text>
          <Text style={styles.description}>
            {isBiometricEnabled
              ? 'Ativo neste aparelho.'
              : 'Desativado. Para ativar, entre com sua senha na tela de login.'}
          </Text>
        </View>
        <Switch
          value={isBiometricEnabled}
          onValueChange={handleToggle}
          disabled={!isBiometricEnabled || loading}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.white}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  description: {
    ...caption.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
