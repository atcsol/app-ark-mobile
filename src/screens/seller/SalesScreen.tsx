import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { sellerApi } from '@/services/sellerApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState, StatusTag } from '@/components/ui';
import { useRefreshOnFocus, useAdaptiveLayout } from '@/hooks';
import { spacing, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Sale, SaleStatus, PaginatedResponse } from '@/types';

const STATUS_FILTERS: { label: string; value: SaleStatus | 'all' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Concluida', value: 'completed' },
  { label: 'Cancelada', value: 'cancelled' },
];

export default function SalesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();
  const { listContentStyle } = useAdaptiveLayout();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const isLoadingMore = useRef(false);

  const fetchSales = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      try {
        setError(null);
        const params: Record<string, any> = {
          page: pageNum,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        };

        const response: PaginatedResponse<Sale> = await sellerApi.getSales(params);

        if (isRefresh || pageNum === 1) {
          setSales(response.data);
        } else {
          setSales((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.meta.current_page < response.meta.last_page);
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Erro ao carregar vendas';
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
    fetchSales(1, true);
  }, [fetchSales]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchSales(1, true);
  }, [fetchSales]);

  useRefreshOnFocus(handleRefresh);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore.current || !hasMore) return;
    isLoadingMore.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSales(nextPage, false);
  }, [page, hasMore, fetchSales]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleStatusFilter = useCallback((status: SaleStatus | 'all') => {
    setStatusFilter(status);
  }, []);

  const handleSalePress = useCallback(
    (sale: Sale) => {
      router.push(`/(seller)/sales/${sale.uuid}`);
    },
    [router],
  );

  const renderSaleCard = useCallback(
    ({ item }: { item: Sale }) => (
      <TouchableOpacity
        style={styles.saleCard}
        onPress={() => handleSalePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.saleCardHeader}>
          <Text style={styles.saleVehicleName} numberOfLines={1}>
            {item.vehicle.full_name}
          </Text>
          <StatusTag status={item.status} small />
        </View>

        <View style={styles.saleCardBody}>
          <View style={styles.saleCardRow}>
            <Text style={styles.saleCardLabel}>Comprador</Text>
            <Text style={styles.saleCardValue} numberOfLines={1}>
              {item.buyer_name}
            </Text>
          </View>
          <View style={styles.saleCardRow}>
            <Text style={styles.saleCardLabel}>Valor</Text>
            <Text style={[styles.saleCardValue, styles.saleCardValueHighlight]}>
              {formatCurrency(item.sale_value)}
            </Text>
          </View>
          <View style={styles.saleCardRow}>
            <Text style={styles.saleCardLabel}>Comissao</Text>
            <Text style={[styles.saleCardValue, { color: colors.success }]}>
              {formatCurrency(item.commission_amount)}
            </Text>
          </View>
          <View style={[styles.saleCardRow, styles.saleCardRowLast]}>
            <Text style={styles.saleCardLabel}>Data</Text>
            <Text style={styles.saleCardValue}>{formatDate(item.sale_date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleSalePress],
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ScreenHeader title="Vendas" subtitle="Historico de vendas realizadas" />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar por veiculo ou comprador..."
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

  if (loading && sales.length === 0) {
    return <LoadingScreen message="Carregando vendas..." />;
  }

  if (error && sales.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={sales}
        renderItem={renderSaleCard}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
        ListHeaderComponent={renderHeader()}
        emptyTitle="Nenhuma venda encontrada"
        emptyDescription="Nao ha vendas que correspondam aos filtros selecionados."
        contentContainerStyle={listContentStyle}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  headerContainer: {
    paddingBottom: spacing.md,
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
  // Sale card styles
  saleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saleCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  saleVehicleName: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  saleCardBody: {},
  saleCardRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  saleCardRowLast: {
    borderBottomWidth: 0,
  },
  saleCardLabel: {
    ...caption.md,
    color: colors.textSecondary,
  },
  saleCardValue: {
    ...body.sm,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  saleCardValueHighlight: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
});
