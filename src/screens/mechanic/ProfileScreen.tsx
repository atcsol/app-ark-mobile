import React, { useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button, List, WhiteSpace } from '@ant-design/react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks';
import { ScreenContainer } from '@/components/layout';
import { Avatar } from '@/components/ui';
import { heading, body, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

export default function MechanicProfileScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { user, userType, logout } = useAuth();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ]
    );
  }, [logout]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Avatar name={user?.name || 'Mecânico'} size={80} />
        <WhiteSpace size="md" />
        <Text style={styles.name}>{user?.name || 'Mecânico'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <Text style={styles.role}>Mecânico</Text>
      </View>

      <WhiteSpace size="xl" />

      <List>
        <List.Item arrow="horizontal" onPress={() => {}}>
          Editar Perfil
        </List.Item>
        <List.Item arrow="horizontal" onPress={() => {}}>
          Alterar Senha
        </List.Item>
        <List.Item arrow="horizontal" onPress={() => {}}>
          Meus Serviços
        </List.Item>
      </List>

      <WhiteSpace size="xl" />

      <View style={styles.logoutContainer}>
        <Button type="warning" onPress={handleLogout}>
          Sair da Conta
        </Button>
      </View>

      <WhiteSpace size="xl" />

      <Text style={styles.version}>ARK Garage v1.0.0</Text>
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  header: {
    alignItems: 'center' as const,
    paddingVertical: spacing.xl,
  },
  name: {
    ...heading.h3,
    color: colors.textPrimary,
  },
  email: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  role: {
    ...body.sm,
    color: colors.accent,
    marginTop: 4,
    fontWeight: '600' as const,
  },
  logoutContainer: {
    paddingHorizontal: spacing.md,
  },
  version: {
    ...body.sm,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
});
