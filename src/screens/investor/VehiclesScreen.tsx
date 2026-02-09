import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { investorApi } from '@/services/investorApi';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState } from '@/components/ui';
import { VehicleStatusBadge } from '@/components/vehicles';
import { useRefreshOnFocus } from '@/hooks';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import type { Vehicle } from '@/types';

export default function InvestorVehiclesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setError(null);
      const response = await investorApi.getVehicles();
      const data = Array.isArray(response) ? response : response.data ?? [];
      setVehicles(data);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar investimentos';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
  }, [fetchVehicles]);

  useRefreshOnFocus(handleRefresh);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      router.push(`/(investor)/vehicles/${vehicle.uuid}`);
    },
    [router],
  );

  // Filter vehicles locally by search term
  const filteredVehicles = vehicles.filter((v) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      v.full_name.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      v.vin_number.toLowerCase().includes(term)
    );
  });

  const renderInvestmentCard = useCallback(
    ({ item }: { item: Vehicle }) => {
      const investmentAmount = item.investor?.investment?.amount ?? item.purchase_value;
      const currentValue = item.sale_value ?? item.purchase_value;
      const profit = currentValue - investmentAmount;
      const roiPercent = investmentAmount > 0 ? (profit / investmentAmount) * 100 : 0;
      const isProfitable = profit >= 0;

      return (
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={styles.investmentCard}
            onPress={() => handleVehiclePress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.full_name}
              </Text>
              <VehicleStatusBadge status={item.status} small />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Investimento</Text>
                <Text style={styles.cardValue}>{formatCurrency(investmentAmount)}</Text>
              </View>

              {item.sale_value != null && (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Valor Atual</Text>
                  <Text style={styles.cardValue}>{formatCurrency(currentValue)}</Text>
                </View>
              )}

              <View style={[styles.cardRow, styles.cardRowLast]}>
                <Text style={styles.cardLabel}>Retorno</Text>
                <View style={styles.roiContainer}>
                  <Text
                    style={[
                      styles.roiValue,
                      { color: isProfitable ? colors.success : colors.error },
                    ]}
                  >
                    {isProfitable ? '+' : ''}
                    {formatCurrency(profit)}
                  </Text>
                  <Text
                    style={[
                      styles.roiPercent,
                      { color: isProfitable ? colors.success : colors.error },
                    ]}
                  >
                    ({isProfitable ? '+' : ''}
                    {roiPercent.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [handleVehiclePress, styles, colors],
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>Meus Investimentos</Text>
      <Text style={styles.screenSubtitle}>Veiculos em que voce investiu</Text>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar por marca, modelo ou VIN..."
        />
      </View>
    </View>
  );

  if (loading && vehicles.length === 0) {
    return <LoadingScreen message="Carregando investimentos..." />;
  }

  if (error && vehicles.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState title="Erro ao carregar" description={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RefreshableList
        data={filteredVehicles}
        renderItem={renderInvestmentCard}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={renderHeader()}
        emptyTitle="Nenhum investimento encontrado"
        emptyDescription="Voce ainda nao possui investimentos em veiculos."
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    marginTop: spacing.lg,
  },
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  investmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  cardTitle: {
    ...heading.h4,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardBody: {},
  cardRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  cardLabel: {
    ...body.sm,
    color: colors.textSecondary,
  },
  cardValue: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  roiContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  roiValue: {
    ...body.md,
    fontWeight: '600' as const,
  },
  roiPercent: {
    ...caption.md,
    fontWeight: '600' as const,
  },
});
