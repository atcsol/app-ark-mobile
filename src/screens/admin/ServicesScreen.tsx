import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { SearchBar, LoadingScreen, EmptyState, RefreshableList, ConfirmModal, FilterChips } from '@/components/ui';
import type { FilterOption } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import { usePermissions } from '@/hooks';

interface ServiceCatalog {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  base_price: number;
  category?: string;
}

const CATEGORY_FILTERS: FilterOption[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Mecanica', value: 'mecanica' },
  { label: 'Eletrica', value: 'eletrica' },
  { label: 'Funilaria', value: 'funilaria' },
  { label: 'Pintura', value: 'pintura' },
  { label: 'Detalhamento', value: 'detalhamento' },
  { label: 'Diagnostico', value: 'diagnostico' },
  { label: 'Outros', value: 'outros' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  mecanica: { bg: '#e6f7ff', text: '#1890ff' },
  eletrica: { bg: '#fff7e6', text: '#fa8c16' },
  funilaria: { bg: '#f9f0ff', text: '#722ed1' },
  pintura: { bg: '#f6ffed', text: '#52c41a' },
  default: { bg: '#f0f0f0', text: '#666666' },
};

function getCategoryColor(category?: string) {
  if (!category) return CATEGORY_COLORS.default;
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
}

export default function ServicesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const router = useRouter();

  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ServiceCatalog | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;
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
          {item.category ? (
            <View style={[styles.categoryTag, { backgroundColor: catColor.bg }]}>
              <Text style={[styles.categoryText, { color: catColor.text }]}>
                {item.category}
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
      <Text style={styles.screenTitle}>Catalogo de Servicos</Text>
      <Text style={styles.screenSubtitle}>Gerencie os servicos oferecidos</Text>
      <WhiteSpace size="lg" />
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar servico..."
      />
      <WhiteSpace size="md" />
      <FilterChips
        options={CATEGORY_FILTERS}
        value={categoryFilter}
        onChange={setCategoryFilter}
      />
      <WhiteSpace size="lg" />
    </View>
  );

  return (
    <View style={styles.container}>
      <RefreshableList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={listHeader}
        emptyTitle="Nenhum servico encontrado"
        emptyDescription="Nao ha servicos cadastrados."
        contentContainerStyle={styles.listContent}
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
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  listHeader: {
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
