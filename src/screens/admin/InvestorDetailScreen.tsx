import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, Avatar, StatCard, StatusTag, ConfirmModal } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { usePermissions, useRefreshOnFocus } from '@/hooks';
import type { Investor, Vehicle } from '@/types';

export default function InvestorDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { can } = usePermissions();

  const [investor, setInvestor] = useState<Investor | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [investorRes, vehiclesRes] = await Promise.all([
        adminApi.getInvestor(uuid!),
        adminApi.getInvestorVehicles(uuid!),
      ]);
      setInvestor((investorRes as any).data ?? investorRes);
      const vehicleData = (vehiclesRes as any).data ?? vehiclesRes;
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
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
      await adminApi.deleteInvestor(uuid!);
      setDeleteModalVisible(false);
      Alert.alert('Sucesso', 'Investidor excluido com sucesso.', [
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
    return <LoadingScreen message="Carregando investidor..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!investor) {
    return (
      <ScreenContainer>
        <EmptyState title="Investidor nao encontrado" description="O investidor solicitado nao existe." />
      </ScreenContainer>
    );
  }

  const totalInvested = investor.total_invested ?? 0;
  const totalReturned = investor.total_returned ?? 0;
  const roi = totalInvested > 0 ? ((totalReturned / totalInvested) * 100) : 0;

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Section: Profile */}
      <View style={styles.section}>
        <View style={styles.profileHeader}>
          <Avatar name={investor.name} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{investor.name}</Text>
            <Text style={styles.profileEmail}>{investor.email}</Text>
            {investor.phone ? (
              <Text style={styles.profileDetail}>{investor.phone}</Text>
            ) : null}
            {investor.cpf_cnpj ? (
              <Text style={styles.profileDetail}>{investor.cpf_cnpj}</Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Section: Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
        <View style={styles.statsRow}>
          <View style={styles.statHalf}>
            <StatCard
              title="Total Investido"
              value={formatCurrency(totalInvested)}
              color={colors.accent}
            />
          </View>
          <View style={styles.statHalf}>
            <StatCard
              title="Retorno Total"
              value={formatCurrency(totalReturned)}
              color={colors.success}
            />
          </View>
        </View>
        <View style={[styles.statsRow, { marginTop: spacing.md }]}>
          <View style={styles.statHalf}>
            <StatCard
              title="Investimentos Ativos"
              value={formatNumber(investor.active_investments ?? 0)}
              color={colors.info}
            />
          </View>
          <View style={styles.statHalf}>
            <StatCard
              title="ROI"
              value={formatPercentage(roi)}
              color={roi >= 0 ? colors.success : colors.error}
            />
          </View>
        </View>
      </View>

      {/* Section: Vehicles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veiculos Vinculados</Text>
        {vehicles.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum veiculo vinculado.</Text>
        ) : (
          vehicles.map((vehicle) => (
            <View key={vehicle.uuid} style={styles.vehicleItem}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName} numberOfLines={1}>
                  {vehicle.full_name}
                </Text>
              </View>
              <StatusTag status={vehicle.status} small />
            </View>
          ))
        )}
      </View>

      {/* Edit button */}
      {can('investors.update') && (
        <View style={styles.actionSection}>
          <Button
            type="primary"
            onPress={() => router.push(`/(admin)/investors/edit/${uuid}` as any)}
            style={styles.editBtn}
          >
            Editar Investidor
          </Button>
        </View>
      )}

      {/* Delete button */}
      {can('investors.delete') && (
        <View style={styles.dangerSection}>
          <Button
            type="warning"
            onPress={() => setDeleteModalVisible(true)}
            style={styles.deleteBtn}
          >
            Excluir Investidor
          </Button>
        </View>
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        title="Excluir Investidor"
        message={`Tem certeza que deseja excluir o investidor "${investor.name}"? Esta acao nao pode ser desfeita.`}
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
  vehicleItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  vehicleName: {
    ...body.md,
    color: colors.textPrimary,
  },
  emptyText: {
    ...body.md,
    color: colors.textTertiary,
    textAlign: 'center' as const,
    paddingVertical: spacing.lg,
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
