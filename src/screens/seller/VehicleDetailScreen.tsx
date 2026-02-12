import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sellerApi } from '@/services/sellerApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState } from '@/components/ui';
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
      const response = await sellerApi.getVehicleDetails(uuid!);
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

  const handleRegisterSale = useCallback(() => {
    if (vehicle) {
      router.push({
        pathname: '/(seller)/sales/register',
        params: { vehicleId: String(vehicle.id), vehicleName: vehicle.full_name },
      });
    }
  }, [router, vehicle]);

  // Helper component for detail rows
  const InfoRow = ({
    label,
    value,
    valueColor,
    isLast = false,
  }: {
    label: string;
    value: string;
    valueColor?: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor } : null]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
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
        <EmptyState
          title="Veiculo nao encontrado"
          description="O veiculo solicitado nao existe."
        />
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
          <InfoRow label="Marca" value={vehicle.brand_name || vehicle.brand?.name} />
          <InfoRow label="Modelo" value={vehicle.model} />
          <InfoRow label="Ano" value={String(vehicle.year)} />
          <InfoRow label="VIN" value={vehicle.vin_number} />
          {vehicle.color && <InfoRow label="Cor" value={vehicle.color} />}
          {vehicle.mileage != null && (
            <InfoRow
              label="Quilometragem"
              value={`${formatNumber(vehicle.mileage)} km`}
            />
          )}
          {vehicle.purchase_date && (
            <InfoRow label="Data de Compra" value={formatDate(vehicle.purchase_date)} />
          )}
          {vehicle.notes && (
            <InfoRow label="Observacoes" value={vehicle.notes} isLast />
          )}
        </View>
      </View>

      {/* Financial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financeiro</Text>
        <View style={styles.card}>
          {vehicle.sale_value != null ? (
            <InfoRow
              label="Valor de Venda"
              value={formatCurrency(vehicle.sale_value)}
              isLast
            />
          ) : (
            <InfoRow
              label="Valor de Venda"
              value="A definir"
              valueColor={colors.textTertiary}
              isLast
            />
          )}
        </View>
      </View>

      {/* Investor */}
      {vehicle.investor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investidor</Text>
          <View style={styles.card}>
            <InfoRow label="Nome" value={vehicle.investor.name} isLast />
          </View>
        </View>
      )}

      {/* Register Sale Action */}
      {vehicle.status === 'for_sale' && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRegisterSale}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Registrar Venda</Text>
          </TouchableOpacity>
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
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
  },
  actionButtonText: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
});
