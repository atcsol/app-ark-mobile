import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { investorApi } from '@/services/investorApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, StatusTag } from '@/components/ui';
import { VehicleStatusBadge } from '@/components/vehicles';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import type { Vehicle } from '@/types';

export default function InvestorVehicleDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    try {
      setError(null);
      const response = await investorApi.getVehicleDetails(uuid!);
      const data = response.data ?? response;
      setVehicle(data);
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

  const investment = vehicle.investor?.investment;

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.vehicleTitle}>{vehicle.full_name}</Text>
      <View style={styles.statusRow}>
        <VehicleStatusBadge status={vehicle.status} />
      </View>

      {/* Vehicle Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacoes do Veiculo</Text>
        <View style={styles.card}>
          <InfoRow label="Marca" value={vehicle.brand_name || vehicle.brand?.name} styles={styles} />
          <InfoRow label="Modelo" value={vehicle.model} styles={styles} />
          <InfoRow label="Ano" value={String(vehicle.year)} styles={styles} />
          <InfoRow label="VIN" value={vehicle.vin_number} styles={styles} />
          {vehicle.color && <InfoRow label="Cor" value={vehicle.color} styles={styles} />}
          {vehicle.mileage != null && (
            <InfoRow label="Quilometragem" value={`${formatNumber(vehicle.mileage)} km`} styles={styles} />
          )}
          <InfoRow label="Status" value={getStatusLabel(vehicle.status)} isLast styles={styles} />
        </View>
      </View>

      {/* Investment Details */}
      {investment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes do Investimento</Text>
          <View style={styles.card}>
            <InfoRow
              label="Valor Investido"
              value={formatCurrency(investment.amount)}
              styles={styles}
            />
            <InfoRow
              label="Comissao"
              value={`${investment.commission_percentage}%`}
              styles={styles}
            />
            <InfoRow
              label="Valor da Comissao"
              value={formatCurrency(investment.commission_amount)}
              styles={styles}
            />
            {investment.notes ? (
              <InfoRow label="Observacoes" value={investment.notes} isLast styles={styles} />
            ) : (
              <View />
            )}
          </View>
        </View>
      )}

      {/* Financial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financeiro</Text>
        <View style={styles.card}>
          <InfoRow label="Valor de Compra" value={formatCurrency(vehicle.purchase_value)} styles={styles} />
          {vehicle.sale_value != null && (
            <InfoRow label="Valor de Venda" value={formatCurrency(vehicle.sale_value)} styles={styles} />
          )}
          {vehicle.costs && (
            <>
              <InfoRow
                label="Custos - Servicos"
                value={formatCurrency(vehicle.costs.services)}
                styles={styles}
              />
              <InfoRow
                label="Custos - Pecas"
                value={formatCurrency(vehicle.costs.parts)}
                styles={styles}
              />
              <InfoRow
                label="Custo Total"
                value={formatCurrency(vehicle.costs.total)}
                styles={styles}
              />
            </>
          )}
          {vehicle.profit != null && (
            <InfoRow
              label="Lucro"
              value={formatCurrency(vehicle.profit)}
              valueColor={vehicle.profit >= 0 ? colors.success : colors.error}
              isLast
              styles={styles}
            />
          )}
        </View>
      </View>

      {/* Services */}
      {vehicle.services && vehicle.services.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicos Realizados</Text>
          {vehicle.services.map((service, index) => (
            <View
              key={service.uuid}
              style={[
                styles.card,
                index < vehicle.services!.length - 1 && styles.cardSpaced,
              ]}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.service.name}</Text>
                <StatusTag status={service.status} small />
              </View>
              <InfoRow label="Mecanico" value={service.mechanic?.name || '-'} styles={styles} />
              <InfoRow label="Custo Total" value={formatCurrency(service.total_cost)} styles={styles} />
              <InfoRow label="Data" value={formatDate(service.service_date)} isLast styles={styles} />
            </View>
          ))}
        </View>
      )}

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datas</Text>
        <View style={styles.card}>
          {vehicle.purchase_date && (
            <InfoRow label="Data de Compra" value={formatDate(vehicle.purchase_date)} styles={styles} />
          )}
          {vehicle.sale_date && (
            <InfoRow label="Data de Venda" value={formatDate(vehicle.sale_date)} styles={styles} />
          )}
          <InfoRow label="Cadastrado em" value={formatDate(vehicle.created_at)} isLast styles={styles} />
        </View>
      </View>
    </ScreenContainer>
  );
}

// Helper to get status label in Portuguese
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_analysis: 'Em Analise',
    in_repair: 'Em Reparo',
    ready: 'Pronto',
    for_sale: 'A Venda',
    sold: 'Vendido',
  };
  return labels[status] || status;
}

// Helper component for detail rows
function InfoRow({
  label,
  value,
  valueColor,
  isLast = false,
  styles,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
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
