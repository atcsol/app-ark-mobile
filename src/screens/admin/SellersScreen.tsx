import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { SearchBar, RefreshableList, EmptyState, LoadingScreen, Avatar } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useRefreshOnFocus, usePermissions } from '@/hooks';
import type { Seller, PaginatedResponse } from '@/types';

const PER_PAGE = 20;

export default function SellersScreen() {
  const router = useRouter();
  const { can } = usePermissions();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchSellers = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const params: Record<string, any> = { page: pageNum, per_page: PER_PAGE };
        if (search.trim()) params.search = search.trim();

        const response = await adminApi.getSellers(params) as PaginatedResponse<Seller>;
        const data = response.data ?? [];
        const meta = response.meta;

        if (pageNum === 1) {
          setSellers(data);
        } else {
          setSellers((prev) => [...prev, ...data]);
        }

        setHasMore(meta ? meta.current_page < meta.last_page : false);
        setPage(pageNum);
      } catch (err: any) {
        console.error('Erro ao carregar vendedores:', err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchSellers(1);
  }, [fetchSellers]);

  useRefreshOnFocus(
    useCallback(() => {
      fetchSellers(1, true);
    }, [fetchSellers]),
  );

  const handleRefresh = useCallback(() => {
    fetchSellers(1, true);
  }, [fetchSellers]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      fetchSellers(page + 1);
    }
  }, [hasMore, loading, refreshing, page, fetchSellers]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Seller }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/(admin)/sellers/${item.uuid}`)}
      >
        <View style={styles.cardRow}>
          <Avatar name={item.name} size={48} />
          <View style={styles.cardContent}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cardEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Comissao</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {formatPercentage(item.commission_percentage)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Vendas</Text>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {formatNumber(item.total_sales ?? 0)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Comissao</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatCurrency(item.total_commission ?? 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [router, styles, colors],
  );

  if (loading && sellers.length === 0) {
    return <LoadingScreen message="Carregando vendedores..." />;
  }

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.title}>Vendedores</Text>
      <Text style={styles.subtitle}>Gerencie os vendedores cadastrados</Text>
      <SearchBar
        value={search}
        onChangeText={handleSearch}
        placeholder="Buscar vendedor..."
      />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.container}>
        <RefreshableList
          data={sellers}
          renderItem={renderItem}
          keyExtractor={(item) => item.uuid}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleEndReached}
          hasMore={hasMore}
          ListHeaderComponent={listHeader}
          emptyTitle="Nenhum vendedor encontrado"
          emptyDescription="Nao ha vendedores cadastrados."
          contentContainerStyle={styles.listContent}
        />
      </View>
      {can('sellers.create') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(admin)/sellers/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  fab: {
    position: 'absolute' as const,
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300' as const,
    marginTop: -2,
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
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardName: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  cardEmail: {
    ...caption.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statLabel: {
    ...caption.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
});
