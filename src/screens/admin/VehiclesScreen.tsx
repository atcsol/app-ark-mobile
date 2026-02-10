import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { adminApi } from '@/services/adminApi';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState, FilterChips } from '@/components/ui';
import { VehicleCard } from '@/components/vehicles';
import { usePermissions, useRefreshOnFocus } from '@/hooks';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Vehicle, VehicleStatus, PaginatedResponse } from '@/types';

const STATUS_FILTERS: { label: string; value: VehicleStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Em Analise', value: 'in_analysis' },
  { label: 'Em Reparo', value: 'in_repair' },
  { label: 'Pronto', value: 'ready' },
  { label: 'A Venda', value: 'for_sale' },
  { label: 'Vendido', value: 'sold' },
];

export default function VehiclesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();
  const { can } = usePermissions();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const isLoadingMore = useRef(false);

  const fetchVehicles = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      try {
        setError(null);
        const params: Record<string, any> = {
          page: pageNum,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        };

        const response: PaginatedResponse<Vehicle> = await adminApi.getVehicles(params);

        if (isRefresh || pageNum === 1) {
          setVehicles(response.data);
        } else {
          setVehicles((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.meta.current_page < response.meta.last_page);
      } catch (err: any) {
        const data = err.response?.data;
        let message = data?.message || err.message || 'Erro ao carregar veiculos';
        if (err.response?.status === 403 && data?.required_permission) {
          message += `\n\nPermissão necessária: ${data.required_permission}`;
          if (data.your_permissions?.length > 0) {
            message += `\nSuas permissões: ${data.your_permissions.join(', ')}`;
          } else if (data.your_permissions) {
            message += '\nSuas permissões: nenhuma';
          }
        }
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isLoadingMore.current = false;
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchVehicles(1, true);
  }, [fetchVehicles]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchVehicles(1, true);
  }, [fetchVehicles]);

  useRefreshOnFocus(
    useCallback(() => {
      setPage(1);
      fetchVehicles(1, true);
    }, [fetchVehicles]),
  );

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore.current || !hasMore) return;
    isLoadingMore.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVehicles(nextPage, false);
  }, [page, hasMore, fetchVehicles]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleStatusFilter = useCallback((status: VehicleStatus | 'all') => {
    setStatusFilter(status);
  }, []);

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      router.push(`/(admin)/vehicles/${vehicle.uuid}`);
    },
    [router],
  );

  const handleCreate = useCallback(() => {
    router.push('/(admin)/vehicles/create');
  }, [router]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>Veiculos</Text>
      <Text style={styles.screenSubtitle}>Gerencie os veiculos cadastrados</Text>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar por marca, modelo ou VIN..."
        />
      </View>

      <View style={styles.filtersRow}>
        <FilterChips
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={handleStatusFilter}
        />
      </View>
    </View>
  );

  if (loading && vehicles.length === 0) {
    return <LoadingScreen message="Carregando veiculos..." />;
  }

  if (error && vehicles.length === 0) {
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
        data={vehicles}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VehicleCard vehicle={item} onPress={handleVehiclePress} />
          </View>
        )}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
        ListHeaderComponent={renderHeader()}
        emptyTitle="Nenhum veiculo encontrado"
        emptyDescription="Nao ha veiculos que correspondam aos filtros selecionados."
        contentContainerStyle={styles.listContent}
      />

      {can('vehicles.create') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxxl + spacing.xxl,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
