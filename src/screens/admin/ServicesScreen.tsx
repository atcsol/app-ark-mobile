import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, LoadingScreen, EmptyState, RefreshableList, ConfirmModal, FilterChips } from '@/components/ui';
import type { FilterOption } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import { usePermissions, useAdaptiveLayout } from '@/hooks';

interface ServiceCategory {
  id: string;
  name: string;
  color?: string;
}

interface ServiceCatalog {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  base_price: number;
  category_id?: string;
  category?: ServiceCategory;
}

const DEFAULT_CATEGORY_COLOR = { bg: '#f0f0f0', text: '#666666' };

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: '#e6f7ff', text: '#1890ff' },
  purple: { bg: '#f9f0ff', text: '#722ed1' },
  cyan: { bg: '#e6fffb', text: '#13c2c2' },
  red: { bg: '#fff1f0', text: '#f5222d' },
  gold: { bg: '#fff7e6', text: '#fa8c16' },
  green: { bg: '#f6ffed', text: '#52c41a' },
  orange: { bg: '#fff7e6', text: '#fa8c16' },
  magenta: { bg: '#fff0f6', text: '#eb2f96' },
  teal: { bg: '#e6fffb', text: '#13c2c2' },
  lime: { bg: '#fcffe6', text: '#a0d911' },
  indigo: { bg: '#f0f5ff', text: '#2f54eb' },
  brown: { bg: '#fff1e6', text: '#ad6800' },
  pink: { bg: '#fff0f6', text: '#eb2f96' },
  gray: { bg: '#f0f0f0', text: '#666666' },
};

function getCategoryColor(category?: ServiceCategory) {
  if (!category?.color) return DEFAULT_CATEGORY_COLOR;
  return COLOR_MAP[category.color] || DEFAULT_CATEGORY_COLOR;
}

export default function ServicesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { listContentStyle } = useAdaptiveLayout();
  const router = useRouter();

  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([{ label: 'Todas', value: 'all' }]);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ServiceCatalog | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== 'all') params.category_id = categoryFilter;
      const data = await adminApi.getServices(params);
      setServices(data.data || data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar servicos';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, [fetchServices]);

  const handleServicePress = useCallback(
    (service: ServiceCatalog) => {
      if (!can('services.update')) return;
      router.push(`/(admin)/services/edit/${service.uuid}`);
    },
    [can, router],
  );

  const handleCreate = useCallback(() => {
    router.push('/(admin)/services/create');
  }, [router]);

  const handleLongPress = useCallback((service: ServiceCatalog) => {
    if (!can('services.delete')) return;
    setDeleteTarget(service);
  }, [can]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteService(deleteTarget.uuid);
      setDeleteTarget(null);
      fetchServices();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao excluir servico';
      Alert.alert('Erro', message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchServices]);

  if (loading) {
    return <LoadingScreen message="Carregando servicos..." />;
  }

  if (error && services.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  const renderServiceCard = ({ item }: { item: ServiceCatalog }) => {
    const catColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleServicePress(item)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={600}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.category?.name ? (
            <View style={[styles.categoryTag, { backgroundColor: catColor.bg }]}>
              <Text style={[styles.categoryText, { color: catColor.text }]}>
                {item.category.name}
              </Text>
            </View>
          ) : null}
        </View>

        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.priceLabel}>Preco Base</Text>
          <Text style={styles.priceValue}>{formatCurrency(item.base_price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <ScreenHeader title="Catalogo de Servicos" subtitle="Gerencie os servicos oferecidos" />
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar servico..."
      />
      <WhiteSpace size="md" />
      <FilterChips
        options={categoryOptions}
        value={categoryFilter}
        onChange={setCategoryFilter}
      />
      <WhiteSpace size="lg" />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={listHeader}
        emptyTitle="Nenhum servico encontrado"
        emptyDescription="Nao ha servicos cadastrados."
        contentContainerStyle={listContentStyle}
      />

      {can('services.create') && (
        <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Excluir Servico"
        message={`Deseja realmente excluir o servico "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...caption.sm,
    fontWeight: '600' as const,
  },
  cardDescription: {
    ...body.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
