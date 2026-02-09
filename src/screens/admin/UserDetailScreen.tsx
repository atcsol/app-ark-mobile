import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { Avatar, LoadingScreen, EmptyState, ConfirmModal } from '@/components/ui';
import { usePermissions } from '@/hooks';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { AdminUser } from '@/types';

function getRoleTagColor(roleName: string, colors: Colors): { bg: string; text: string } {
  switch (roleName) {
    case 'super-admin':
      return { bg: '#fff1f0', text: colors.error };
    case 'admin':
      return { bg: '#f0f0ff', text: colors.accent };
    default:
      return { bg: '#e6f7ff', text: colors.info };
  }
}

export default function UserDetailScreen() {
  const router = useRouter();
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { can } = usePermissions();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!uuid) return;
    try {
      setError(null);
      const response = await adminApi.getUser(uuid);
      const data = (response as any)?.data ?? response;
      setUser(data);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar usuario';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUser();
  }, [fetchUser]);

  const handleDelete = useCallback(async () => {
    if (!uuid) return;
    try {
      setDeleting(true);
      await adminApi.deleteUser(uuid);
      setDeleteModalVisible(false);
      Alert.alert('Sucesso', 'Usuario excluido com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao excluir usuario';
      Alert.alert('Erro', message);
    } finally {
      setDeleting(false);
    }
  }, [uuid, router]);

  const handleRestore = useCallback(async () => {
    if (!uuid) return;
    Alert.alert('Restaurar Usuario', `Deseja restaurar o usuario "${user?.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        onPress: async () => {
          try {
            setRestoring(true);
            await adminApi.restoreUser(uuid);
            Alert.alert('Sucesso', 'Usuario restaurado com sucesso.');
            fetchUser();
          } catch (err: any) {
            const message =
              err.response?.data?.message || err.message || 'Erro ao restaurar usuario';
            Alert.alert('Erro', message);
          } finally {
            setRestoring(false);
          }
        },
      },
    ]);
  }, [uuid, user, fetchUser]);

  if (loading) {
    return <LoadingScreen message="Carregando usuario..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Usuario nao encontrado"
          description="O usuario solicitado nao foi encontrado."
        />
      </ScreenContainer>
    );
  }

  const roles = user.roles ?? [];
  const permissions = user.permissions ?? [];

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Deleted banner */}
      {user.deleted_at && (
        <View style={styles.deletedBanner}>
          <Text style={styles.deletedBannerText}>
            Este usuario foi excluido
          </Text>
          {can('users.update') && (
            <TouchableOpacity
              style={styles.restoreBannerBtn}
              onPress={handleRestore}
              disabled={restoring}
              activeOpacity={0.7}
            >
              <Text style={styles.restoreBannerBtnText}>
                {restoring ? 'Restaurando...' : 'Restaurar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Section 1: Profile */}
      <View style={styles.section}>
        <View style={styles.profileContainer}>
          <Avatar
            name={user.name}
            imageUrl={user.avatar?.url}
            size={80}
          />
          <WhiteSpace size="md" />
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          {user.phone && (
            <Text style={styles.profilePhone}>{user.phone}</Text>
          )}
          {user.is_active === false && !user.deleted_at && (
            <View style={styles.inactiveTag}>
              <Text style={styles.inactiveTagText}>Inativo</Text>
            </View>
          )}
          {user.deleted_at && (
            <View style={styles.deletedTag}>
              <Text style={styles.deletedTagText}>Excluido</Text>
            </View>
          )}
        </View>
      </View>

      {/* Section 2: Roles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Papeis</Text>
        {roles.length > 0 ? (
          <View style={styles.tagsContainer}>
            {roles.map((role) => {
              const tagColor = getRoleTagColor(role.name, colors);
              return (
                <View
                  key={role.id}
                  style={[styles.roleTag, { backgroundColor: tagColor.bg }]}
                >
                  <Text style={[styles.roleTagText, { color: tagColor.text }]}>
                    {role.name}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhum papel atribuido</Text>
        )}
      </View>

      {/* Section 3: Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissoes</Text>
        {permissions.length > 0 ? (
          <View style={styles.permissionsList}>
            {permissions.map((permission) => (
              <View key={permission.id} style={styles.permissionItem}>
                <View style={styles.permissionDot} />
                <Text style={styles.permissionText}>{permission.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            Nenhuma permissao especifica (apenas permissoes dos papeis)
          </Text>
        )}
      </View>

      {/* Actions */}
      {user.deleted_at ? (
        can('users.update') && (
          <View style={styles.actionsSection}>
            <Button
              type="primary"
              onPress={handleRestore}
              loading={restoring}
              disabled={restoring}
              style={{ borderRadius: borderRadius.md }}
            >
              Restaurar Usuario
            </Button>
          </View>
        )
      ) : (
        <>
          {can('users.update') && (
            <View style={styles.actionsSection}>
              <Button
                type="primary"
                onPress={() => router.push(`/(admin)/users/edit/${uuid}` as any)}
                style={{ borderRadius: borderRadius.md }}
              >
                Editar Usuario
              </Button>
            </View>
          )}

          {can('users.delete') && (
            <View style={styles.actionsSection}>
              <Button
                type="warning"
                onPress={() => setDeleteModalVisible(true)}
              >
                Excluir Usuario
              </Button>
            </View>
          )}
        </>
      )}

      <WhiteSpace size="xl" />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Excluir Usuario"
        message={`Tem certeza que deseja excluir o usuario "${user.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  profileContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
  },
  profileName: {
    ...heading.h3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  roleTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  roleTagText: {
    ...body.sm,
    fontWeight: '600' as const,
  },
  emptyText: {
    ...body.sm,
    color: colors.textTertiary,
    fontStyle: 'italic' as const,
  },
  permissionsList: {
    gap: spacing.sm,
  },
  permissionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  permissionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  permissionText: {
    ...body.sm,
    color: colors.textSecondary,
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  deletedBanner: {
    backgroundColor: '#fff1f0',
    borderWidth: 1,
    borderColor: colors.error + '30',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  deletedBannerText: {
    ...body.sm,
    color: colors.error,
    fontWeight: '600' as const,
    flex: 1,
  },
  restoreBannerBtn: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  restoreBannerBtnText: {
    ...caption.md,
    color: colors.white,
    fontWeight: '600' as const,
  },
  profilePhone: {
    ...body.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  inactiveTag: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  inactiveTagText: {
    ...caption.md,
    color: colors.warning,
    fontWeight: '600' as const,
  },
  deletedTag: {
    backgroundColor: '#fff1f0',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  deletedTagText: {
    ...caption.md,
    color: colors.error,
    fontWeight: '600' as const,
  },
});
