import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { mechanicApi } from '@/services/mechanicApi';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState, StatusTag } from '@/components/ui';
import { useRefreshOnFocus } from '@/hooks';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { VehicleService, ServiceStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: ServiceStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Em Andamento', value: 'in_progress' },
  { label: 'Concluido', value: 'completed' },
];

export default function ServicesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();

  const [services, setServices] = useState<VehicleService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const response = await mechanicApi.getMyServices();
      const data = response.data || response;
      setServices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar servicos';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, [fetchServices]);

  useRefreshOnFocus(handleRefresh);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleStatusFilter = useCallback((status: ServiceStatus | 'all') => {
    setStatusFilter(status);
  }, []);

  const handleServicePress = useCallback(
    (service: VehicleService) => {
      router.push(`/(mechanic)/services/${service.uuid}`);
    },
    [router],
  );

  const handleAdd = useCallback(() => {
    router.push('/(mechanic)/services/add');
  }, [router]);

  const filteredServices = services.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      s.service?.name?.toLowerCase().includes(term) ||
      String(s.vehicle_id).includes(term)
    );
  });

  const renderServiceCard = ({ item }: { item: VehicleService }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handleServicePress(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.service?.name || 'Servico'}
        </Text>
        <StatusTag status={item.status} small />
      </View>

      {item.vehicle_id != null && (
        <Text style={styles.cardVehicle} numberOfLines={1}>
          Veiculo #{item.vehicle_id}
        </Text>
      )}

      <View style={styles.cardDetails}>
        <View style={styles.cardDetailItem}>
          <Text style={styles.detailLabel}>Data</Text>
          <Text style={styles.detailValue}>
            {item.service_date ? formatDate(item.service_date) : '-'}
          </Text>
        </View>
        {item.hours_worked != null && item.hours_worked > 0 && (
          <View style={styles.cardDetailItem}>
            <Text style={styles.detailLabel}>Horas</Text>
            <Text style={styles.detailValue}>{item.hours_worked}h</Text>
          </View>
        )}
        <View style={styles.cardDetailItem}>
          <Text style={styles.detailLabel}>Custo</Text>
          <Text style={styles.detailValueAccent}>
            {formatCurrency(item.labor_cost || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>Servicos</Text>
      <Text style={styles.screenSubtitle}>Seus servicos e atividades</Text>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar servico..."
        />
      </View>

      <View style={styles.filtersRow}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              statusFilter === filter.value && styles.filterChipActive,
            ]}
            onPress={() => handleStatusFilter(filter.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading && services.length === 0) {
    return <LoadingScreen message="Carregando servicos..." />;
  }

  if (error && services.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Erro ao carregar"
          description={error}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RefreshableList
        data={filteredServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={renderHeader()}
        emptyTitle="Nenhum servico encontrado"
        emptyDescription="Nao ha servicos que correspondam aos filtros selecionados."
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxxl + spacing.xxl,
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
  filtersRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    ...caption.md,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
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
    marginBottom: spacing.sm,
  },
  cardName: {
    ...heading.h4,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardVehicle: {
    ...body.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  cardDetailItem: {
    alignItems: 'center' as const,
  },
  detailLabel: {
    ...caption.sm,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    ...body.sm,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  detailValueAccent: {
    ...body.sm,
    color: colors.accent,
    fontWeight: '600' as const,
  },
  fab: {
    position: 'absolute' as const,
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    lineHeight: 30,
    color: colors.white,
    fontWeight: '300' as const,
  },
});
