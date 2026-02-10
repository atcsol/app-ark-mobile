import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState, FilterChips, ToggleFilter } from '@/components/ui';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import type { FilterOption } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import { usePermissions, useAdaptiveLayout } from '@/hooks';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface PartCategory {
  id: string;
  name: string;
  color?: string;
}

interface PartBrand {
  id: string;
  name: string;
}

interface Part {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  part_number?: string;
  brand_id?: string;
  brand?: PartBrand;
  unit_price: number;
  stock_quantity: number;
  min_stock: number;
  category_id?: string;
  category?: PartCategory;
}

export default function PartsScreen() {
  const router = useRouter();
  const { can } = usePermissions();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { listContentStyle } = useAdaptiveLayout();

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([{ label: 'Todas', value: 'all' }]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.getCategories({ active: true });
        const cats = data.data || data;
        const options: FilterOption[] = [
          { label: 'Todas', value: 'all' },
          ...cats.map((c: any) => ({ label: c.name, value: String(c.id) })),
        ];
        setCategoryOptions(options);
      } catch {}
    })();
  }, []);

  const fetchParts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setError(null);
      const params: Record<string, any> = { page: pageNum, per_page: 20 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== 'all') params.category_id = categoryFilter;
      if (lowStockOnly) params.low_stock = true;
      const data = await adminApi.getParts(params);

      const items: Part[] = data.data || data;
      const meta = data.meta || data.pagination;

      if (append) {
        setParts((prev) => [...prev, ...items]);
      } else {
        setParts(items);
      }

      if (meta) {
        setHasMore(meta.current_page < meta.last_page || meta.page < meta.totalPages);
      } else {
        setHasMore(false);
      }
      setPage(pageNum);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar pecas';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [search, categoryFilter, lowStockOnly]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchParts(1, false);
  }, [fetchParts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchParts(1, false);
  }, [fetchParts]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchParts(page + 1, true);
  }, [loadingMore, hasMore, page, fetchParts]);

  const handlePartPress = useCallback((part: Part) => {
    router.push(`/(admin)/parts/${part.uuid}`);
  }, [router]);

  const handleCreatePress = useCallback(() => {
    router.push('/(admin)/parts/create' as any);
  }, []);

  const isLowStock = (part: Part): boolean => {
    return part.stock_quantity <= part.min_stock;
  };

  if (loading) {
    return <LoadingScreen message="Carregando pecas..." />;
  }

  if (error && parts.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  const renderPartCard = ({ item }: { item: Part }) => {
    const lowStock = isLowStock(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handlePartPress(item)}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.part_number ? (
              <Text style={styles.cardPartNumber} numberOfLines={1}>
                {item.part_number}
              </Text>
            ) : null}
          </View>
          <View style={[styles.stockBadge, lowStock ? styles.stockBadgeLow : styles.stockBadgeOk]}>
            <Text style={[styles.stockBadgeText, lowStock ? styles.stockTextLow : styles.stockTextOk]}>
              {item.stock_quantity}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          {item.brand?.name ? (
            <Text style={styles.metaText}>
              {item.brand.name}
            </Text>
          ) : null}
          {item.category?.name ? (
            <Text style={styles.metaText}>
              {item.brand?.name ? ' | ' : ''}{item.category.name}
            </Text>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.priceLabel}>Preco Unitario</Text>
          <Text style={styles.priceValue}>{formatCurrency(item.unit_price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <ScreenHeader title="Pecas" subtitle="Gerencie as pecas em estoque" />
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar peca..."
      />
      <WhiteSpace size="md" />
      <FilterChips
        options={categoryOptions}
        value={categoryFilter}
        onChange={setCategoryFilter}
      />
      <WhiteSpace size="sm" />
      <ToggleFilter
        label="Apenas estoque baixo"
        value={lowStockOnly}
        onChange={setLowStockOnly}
      />
      <WhiteSpace size="md" />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={parts}
        renderItem={renderPartCard}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        hasMore={hasMore}
        ListHeaderComponent={listHeader}
        emptyTitle="Nenhuma peca encontrada"
        emptyDescription="Nao ha pecas cadastradas."
        contentContainerStyle={listContentStyle}
      />

      {can('parts.create') && (
        <TouchableOpacity style={styles.fab} onPress={handleCreatePress} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  listHeader: {
    paddingBottom: spacing.xl,
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
  cardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.sm,
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardName: {
    ...heading.h4,
    color: colors.textPrimary,
  },
  cardPartNumber: {
    ...caption.md,
    color: colors.textTertiary,
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 36,
    alignItems: 'center' as const,
  },
  stockBadgeLow: {
    backgroundColor: '#fff1f0',
  },
  stockBadgeOk: {
    backgroundColor: '#f6ffed',
  },
  stockBadgeText: {
    ...caption.md,
    fontWeight: '700' as const,
  },
  stockTextLow: {
    color: colors.error,
  },
  stockTextOk: {
    color: colors.success,
  },
  cardMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  metaText: {
    ...body.sm,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  priceLabel: {
    ...caption.md,
    color: colors.textTertiary,
  },
  priceValue: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.accent,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    lineHeight: 30,
    fontWeight: '300' as const,
  },
});
