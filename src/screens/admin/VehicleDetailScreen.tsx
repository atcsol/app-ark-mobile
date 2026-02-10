import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, ConfirmModal, StatusTag } from '@/components/ui';
import {
  VehicleStatusBadge,
  VehicleImagesSection,
  VehicleSellersSection,
  VehicleInvestorsSection,
  VehicleSaleSection,
  VehicleTimelineSection,
  VehicleAddServiceSection,
  VehiclePartsUsedSection,
} from '@/components/vehicles';
import { usePermissions, useAdaptiveLayout } from '@/hooks';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import type { Vehicle, VehicleStatus } from '@/types';

const STATUS_OPTIONS: { label: string; value: VehicleStatus }[] = [
  { label: 'Em Analise', value: 'in_analysis' },
  { label: 'Em Reparo', value: 'in_repair' },
  { label: 'Pronto', value: 'ready' },
  { label: 'A Venda', value: 'for_sale' },
  { label: 'Vendido', value: 'sold' },
];

export default function VehicleDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { can } = usePermissions();
  const { listContentStyle } = useAdaptiveLayout();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchVehicle = useCallback(async () => {
    try {
      setError(null);
      const response = await adminApi.getVehicle(uuid!);
      setVehicle(response);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar veiculo';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchVehicle();
    }
  }, [fetchVehicle, uuid]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicle();
  }, [fetchVehicle]);

  const handleEdit = useCallback(() => {
    router.push(`/(admin)/vehicles/edit/${uuid}` as any);
  }, [router, uuid]);

  const handleDelete = useCallback(async () => {
    try {
      setDeleteLoading(true);
      await adminApi.deleteVehicle(uuid!);
      setDeleteModalVisible(false);
      Alert.alert('Sucesso', 'Veiculo excluido com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao excluir veiculo';
      Alert.alert('Erro', message);
    } finally {
      setDeleteLoading(false);
    }
  }, [uuid, router]);

  const handleStatusChange = useCallback(
    async (newStatus: VehicleStatus) => {
      try {
        setStatusLoading(true);
        await adminApi.updateVehicleStatus(uuid!, newStatus);
        setStatusModalVisible(false);
        Alert.alert('Sucesso', 'Status atualizado com sucesso.');
        fetchVehicle();
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Erro ao atualizar status';
        Alert.alert('Erro', message);
      } finally {
        setStatusLoading(false);
      }
    },
    [uuid, fetchVehicle],
  );

  if (loading) {
    return <LoadingScreen message="Carregando veiculo..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!vehicle) {
    return (
      <ScreenContainer>
        <EmptyState title="Veiculo nao encontrado" description="O veiculo solicitado nao existe." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh} padded={false}>
      <View style={{ paddingHorizontal: listContentStyle.paddingHorizontal }}>
      <Text style={styles.vehicleTitle}>{vehicle.full_name}</Text>
      <View style={styles.statusRow}>
        <VehicleStatusBadge status={vehicle.status} />
      </View>

      {/* Images */}
      <VehicleImagesSection
        vehicleId={vehicle.uuid}
        images={vehicle.images || []}
        onRefresh={fetchVehicle}
      />

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacoes Basicas</Text>
        <View style={styles.card}>
          <InfoRow label="Marca" value={vehicle.brand} />
          <InfoRow label="Modelo" value={vehicle.model} />
          <InfoRow label="Ano" value={String(vehicle.year)} />
          <InfoRow label="VIN" value={vehicle.vin_number} />
          {vehicle.color && <InfoRow label="Cor" value={vehicle.color} />}
          {vehicle.mileage != null && (
            <InfoRow label="Quilometragem" value={`${formatNumber(vehicle.mileage)} km`} />
          )}
          {vehicle.purchase_date && (
            <InfoRow label="Data de Compra" value={formatDate(vehicle.purchase_date)} />
          )}
          {vehicle.notes && <InfoRow label="Observacoes" value={vehicle.notes} isLast />}
        </View>
      </View>

      {/* Financial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financeiro</Text>
        <View style={styles.card}>
          <InfoRow label="Valor de Compra" value={formatCurrency(vehicle.purchase_value)} />
          {vehicle.sale_value != null && (
            <InfoRow label="Valor de Venda" value={formatCurrency(vehicle.sale_value)} />
          )}
          {vehicle.costs && (
            <>
              <InfoRow label="Custos - Servicos" value={formatCurrency(vehicle.costs.services)} />
              <InfoRow label="Custos - Pecas" value={formatCurrency(vehicle.costs.parts)} />
              <InfoRow label="Custo Total" value={formatCurrency(vehicle.costs.total)} />
            </>
          )}
          {vehicle.profit != null && (
            <InfoRow
              label="Lucro"
              value={formatCurrency(vehicle.profit)}
              valueColor={vehicle.profit >= 0 ? colors.success : colors.error}
              isLast
            />
          )}
        </View>
      </View>

      {/* Investors */}
      <VehicleInvestorsSection
        vehicleId={vehicle.uuid}
        investor={vehicle.investor}
        onRefresh={fetchVehicle}
      />

      {/* Sellers */}
      <VehicleSellersSection
        vehicleId={vehicle.uuid}
        onRefresh={fetchVehicle}
      />

      {/* Services */}
      {vehicle.services && vehicle.services.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicos</Text>
          {vehicle.services.map((service, index) => (
            <View
              key={service.uuid}
              style={[styles.card, index < vehicle.services!.length - 1 && styles.cardSpaced]}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.service.name}</Text>
                <StatusTag status={service.status} small />
              </View>
              <InfoRow label="Mecanico" value={service.mechanic?.name || '-'} />
              <InfoRow label="Custo Total" value={formatCurrency(service.total_cost)} />
              <InfoRow label="Data" value={formatDate(service.service_date)} isLast />
            </View>
          ))}
        </View>
      )}

      {/* Add Service (Item 11) */}
      <VehicleAddServiceSection vehicleId={vehicle.uuid} onRefresh={fetchVehicle} />

      {/* Parts Used (Item 12) */}
      <VehiclePartsUsedSection vehicle={vehicle} />

      {/* Sale */}
      <VehicleSaleSection vehicle={vehicle} onRefresh={fetchVehicle} />

      {/* Timeline / History (Item 6) */}
      <VehicleTimelineSection vehicle={vehicle} />

      {/* Actions */}
      <View style={styles.section}>
        <View style={styles.actionsRow}>
          {can('vehicles.update') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>
          )}

          {can('vehicles.update') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonOutline]}
              onPress={() => setStatusModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextOutline]}>
                Alterar Status
              </Text>
            </TouchableOpacity>
          )}

          {can('vehicles.delete') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => setDeleteModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                Excluir
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      </View>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Excluir Veiculo"
        message={`Tem certeza que deseja excluir "${vehicle.full_name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />

      {/* Status Change Modal */}
      {statusModalVisible && (
        <View style={styles.statusModalOverlay}>
          <TouchableOpacity
            style={styles.statusModalBackdrop}
            onPress={() => setStatusModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.statusModalContent}>
            <Text style={styles.statusModalTitle}>Alterar Status</Text>
            <Text style={styles.statusModalSubtitle}>
              Selecione o novo status do veiculo
            </Text>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  vehicle.status === option.value && styles.statusOptionActive,
                ]}
                onPress={() => handleStatusChange(option.value)}
                disabled={statusLoading || vehicle.status === option.value}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    vehicle.status === option.value && styles.statusOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {vehicle.status === option.value && (
                  <Text style={styles.statusOptionCurrent}>Atual</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.statusModalCancel}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.statusModalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

// Helper component for detail rows
function InfoRow({
  label,
  value,
  valueColor,
  isLast = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  vehicleTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row' as const,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSpaced: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: spacing.sm,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...body.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...body.md,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right' as const,
  },
  serviceHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  serviceName: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  actionsRow: {
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionButtonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  actionButtonText: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
  actionButtonTextOutline: {
    color: colors.accent,
  },
  actionButtonTextDanger: {
    color: colors.error,
  },
  // Status modal styles
  statusModalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end' as const,
  },
  statusModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  statusModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  statusModalTitle: {
    ...heading.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusModalSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  statusOption: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionActive: {
    backgroundColor: '#f0f5ff',
    borderColor: colors.accent,
  },
  statusOptionText: {
    ...body.md,
    color: colors.textPrimary,
  },
  statusOptionTextActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  statusOptionCurrent: {
    ...caption.sm,
    color: colors.accent,
  },
  statusModalCancel: {
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  statusModalCancelText: {
    ...body.md,
    color: colors.textSecondary,
  },
});
