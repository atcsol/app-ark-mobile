import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, StatusTag } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { usePermissions } from '@/hooks';

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: { id: number; name: string }[];
  users_count?: number;
}

const ROLE_COLORS: Record<string, string> = {
  'super-admin': '#f50',
  admin: '#2db7f5',
  manager: '#87d068',
  mechanic: '#fa8c16',
  viewer: '#999',
  vendedor: '#722ed1',
  comprador: '#13c2c2',
  financeiro: '#eb2f96',
  estoquista: '#faad14',
};

export default function RolesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setError(null);
      const response = await adminApi.getRoles();
      const data = (response as any).data ?? response;
      setRoles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar roles';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRoles();
  }, [fetchRoles]);

  if (loading) {
    return <LoadingScreen message="Carregando roles..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.screenTitle}>Roles e Permissoes</Text>
      <Text style={styles.screenSubtitle}>Gerencie as roles e suas permissoes</Text>

      {roles.length === 0 ? (
        <EmptyState title="Nenhuma role encontrada" description="Nao ha roles cadastradas." />
      ) : (
        roles.map((role) => (
          <View key={role.id || role.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: (ROLE_COLORS[role.name] || '#999') + '20' },
                ]}
              >
                <Text
                  style={[styles.roleBadgeText, { color: ROLE_COLORS[role.name] || '#999' }]}
                >
                  {role.name}
                </Text>
              </View>
              {role.users_count != null && (
                <Text style={styles.usersCount}>{role.users_count} usuarios</Text>
              )}
            </View>

            {role.permissions && role.permissions.length > 0 && (
              <View style={styles.permissionsContainer}>
                <Text style={styles.permissionsTitle}>
                  {role.permissions.length} permissoes
                </Text>
                <View style={styles.permissionsList}>
                  {role.permissions.slice(0, 8).map((perm) => (
                    <View key={perm.id || perm.name} style={styles.permissionTag}>
                      <Text style={styles.permissionTagText}>{perm.name}</Text>
                    </View>
                  ))}
                  {role.permissions.length > 8 && (
                    <View style={styles.permissionTag}>
                      <Text style={styles.permissionTagText}>
                        +{role.permissions.length - 8} mais
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  screenTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    ...body.md,
    fontWeight: '700' as const,
  },
  usersCount: {
    ...caption.md,
    color: colors.textSecondary,
  },
  permissionsContainer: {
    marginTop: spacing.md,
  },
  permissionsTitle: {
    ...caption.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  permissionsList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
  },
  permissionTag: {
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  permissionTagText: {
    ...caption.sm,
    color: colors.textSecondary,
  },
});
