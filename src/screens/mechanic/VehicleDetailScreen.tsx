import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mechanicApi } from '@/services/mechanicApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, StatusTag } from '@/components/ui';
import { VehicleStatusBadge } from '@/components/vehicles';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import type { Vehicle } from '@/types';

export default function VehicleDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    try {
      setError(null);
      // Fetch vehicles list and find by uuid
      const response = await mechanicApi.getMyVehicles();
      const data = response.data || response;
      const list: Vehicle[] = Array.isArray(data) ? data : [];
      const found = list.find((v) => v.uuid === uuid);
      setVehicle(found || null);
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
    return (
      <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={3}>
          {value}
        </Text>
      </View>
    );
  }

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
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.vehicleTitle}>{vehicle.full_name}</Text>
      <View style={styles.statusRow}>
        <VehicleStatusBadge status={vehicle.status} />
      </View>

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
            <InfoRow label="Data de Compra" value={formatDate(vehicle.purchase_date)} isLast />
          )}
        </View>
      </View>

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
                <Text style={styles.serviceName}>{service.service?.name || 'Servico'}</Text>
                <StatusTag status={service.status} small />
              </View>
              {service.mechanic && (
                <InfoRow label="Mecanico" value={service.mechanic.name || '-'} />
              )}
              <InfoRow label="Custo Total" value={formatCurrency(service.total_cost)} />
              <InfoRow label="Data" value={formatDate(service.service_date)} isLast />
            </View>
          ))}
        </View>
      )}

      {/* Costs */}
      {vehicle.costs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custos</Text>
          <View style={styles.card}>
            <InfoRow label="Servicos" value={formatCurrency(vehicle.costs.services)} />
            <InfoRow label="Pecas" value={formatCurrency(vehicle.costs.parts)} />
            <InfoRow
              label="Total"
              value={formatCurrency(vehicle.costs.total)}
              valueColor={colors.accent}
              isLast
            />
          </View>
        </View>
      )}
    </ScreenContainer>
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
});
