import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { IconOutline } from '@ant-design/icons-react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, Avatar, StatCard, ConfirmModal } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import { usePermissions, useRefreshOnFocus } from '@/hooks';
import type { Mechanic } from '@/types';
import { SPECIALTY_ICON_MAP } from '@/constants';

export default function MechanicDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { can } = usePermissions();

  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await adminApi.getMechanic(uuid!);
      setMechanic((response as any).data ?? response);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar dados';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefreshOnFocus(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await adminApi.deleteMechanic(uuid!);
      setDeleteModalVisible(false);
      Alert.alert('Sucesso', 'Mecanico excluido com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao excluir';
      Alert.alert('Erro', message);
    } finally {
      setDeleting(false);
    }
  }, [uuid, router]);

  if (loading) {
    return <LoadingScreen message="Carregando mecanico..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!mechanic) {
    return (
      <ScreenContainer>
        <EmptyState title="Mecanico nao encontrado" description="O mecanico solicitado nao existe." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Section: Profile */}
      <View style={styles.section}>
        <View style={styles.profileHeader}>
          <Avatar name={mechanic.name} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{mechanic.name}</Text>
            <Text style={styles.profileEmail}>{mechanic.email}</Text>
            {mechanic.phone ? (
              <Text style={styles.profileDetail}>{mechanic.phone}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Section: Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacoes</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Especialidade</Text>
          {mechanic.specialties && mechanic.specialties.length > 0 ? (
            <View style={[styles.specialtyTag, { flexDirection: 'row', alignItems: 'center' }]}>
              {SPECIALTY_ICON_MAP[mechanic.specialties[0]] ? (
                <IconOutline name={SPECIALTY_ICON_MAP[mechanic.specialties[0]] as any} size={12} color={styles.specialtyText.color} style={{ marginRight: 4 }} />
              ) : null}
              <Text style={styles.specialtyText}>{mechanic.specialties.join(', ')}</Text>
            </View>
          ) : (
            <Text style={styles.infoValue}>Nao informada</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Taxa Horaria</Text>
          <Text style={[styles.infoValue, { color: colors.accent, fontWeight: '600' }]}>
            {mechanic.hourly_rate ? formatCurrency(mechanic.hourly_rate) : 'Nao informada'}
          </Text>
        </View>
      </View>

      {/* Edit button */}
      {can('mechanics.update') && (
        <View style={styles.actionSection}>
          <Button
            type="primary"
            onPress={() => router.push(`/(admin)/mechanics/edit/${uuid}` as any)}
            style={styles.editBtn}
          >
            Editar Mecanico
          </Button>
        </View>
      )}

      {/* Delete button */}
      {can('mechanics.delete') && (
        <View style={styles.dangerSection}>
          <Button
            type="warning"
            onPress={() => setDeleteModalVisible(true)}
            style={styles.deleteBtn}
          >
            Excluir Mecanico
          </Button>
        </View>
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        title="Excluir Mecanico"
        message={`Tem certeza que deseja excluir o mecanico "${mechanic.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
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
  profileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  profileName: {
    ...heading.h3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileDetail: {
    ...body.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...body.md,
    color: colors.textSecondary,
  },
  infoValue: {
    ...body.md,
    color: colors.textPrimary,
  },
  specialtyTag: {
    backgroundColor: '#f9f0ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  specialtyText: {
    ...caption.md,
    color: '#722ed1',
    fontWeight: '600' as const,
  },
  actionSection: {
    marginBottom: spacing.md,
  },
  editBtn: {
    borderRadius: borderRadius.md,
  },
  dangerSection: {
    marginBottom: spacing.xl,
  },
  deleteBtn: {
    borderColor: colors.error,
  },
});
