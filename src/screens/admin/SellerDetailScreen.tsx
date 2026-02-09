import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, Avatar, StatCard, ConfirmModal } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { usePermissions, useRefreshOnFocus } from '@/hooks';
import type { Seller } from '@/types';

export default function SellerDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { can } = usePermissions();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await adminApi.getSeller(uuid!);
      setSeller((response as any).data ?? response);
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
      await adminApi.deleteSeller(uuid!);
      setDeleteModalVisible(false);
      Alert.alert('Sucesso', 'Vendedor excluido com sucesso.', [
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
    return <LoadingScreen message="Carregando vendedor..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!seller) {
    return (
      <ScreenContainer>
        <EmptyState title="Vendedor nao encontrado" description="O vendedor solicitado nao existe." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Section: Profile */}
      <View style={styles.section}>
        <View style={styles.profileHeader}>
          <Avatar name={seller.name} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{seller.name}</Text>
            <Text style={styles.profileEmail}>{seller.email}</Text>
            {seller.phone ? (
              <Text style={styles.profileDetail}>{seller.phone}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Section: Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desempenho</Text>
        <View style={styles.statsRow}>
          <View style={styles.statHalf}>
            <StatCard
              title="Vendas"
              value={formatNumber(seller.total_sales ?? 0)}
              color={colors.info}
            />
          </View>
          <View style={styles.statHalf}>
            <StatCard
              title="Total Comissao"
              value={formatCurrency(seller.total_commission ?? 0)}
              color={colors.success}
            />
          </View>
        </View>
        <View style={[styles.statsRow, { marginTop: spacing.md }]}>
          <View style={styles.statFull}>
            <StatCard
              title="Comissao"
              value={formatPercentage(seller.commission_percentage)}
              color={colors.accent}
            />
          </View>
        </View>
      </View>

      {/* Edit button */}
      {can('sellers.update') && (
        <View style={styles.actionSection}>
          <Button
            type="primary"
            onPress={() => router.push(`/(admin)/sellers/edit/${uuid}` as any)}
            style={styles.editBtn}
          >
            Editar Vendedor
          </Button>
        </View>
      )}

      {/* Delete button */}
      {can('sellers.delete') && (
        <View style={styles.dangerSection}>
          <Button
            type="warning"
            onPress={() => setDeleteModalVisible(true)}
            style={styles.deleteBtn}
          >
            Excluir Vendedor
          </Button>
        </View>
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        title="Excluir Vendedor"
        message={`Tem certeza que deseja excluir o vendedor "${seller.name}"? Esta acao nao pode ser desfeita.`}
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
  statsRow: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  statHalf: {
    flex: 1,
  },
  statFull: {
    flex: 1,
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
