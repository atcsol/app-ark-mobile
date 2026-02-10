import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { useRouter } from 'expo-router';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, LoadingScreen, EmptyState, RefreshableList, ConfirmModal, FilterChips } from '@/components/ui';
import type { FilterOption } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { usePermissions, useAdaptiveLayout } from '@/hooks';
import type { Brand } from '@/types';

const TYPE_FILTERS: FilterOption[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Veiculos', value: 'vehicle' },
  { label: 'Pecas', value: 'part' },
];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  vehicle: { bg: '#e6f7ff', text: '#1890ff' },
  part: { bg: '#fff7e6', text: '#fa8c16' },
  both: { bg: '#f6ffed', text: '#52c41a' },
  default: { bg: '#f0f0f0', text: '#666666' },
};

const TYPE_LABELS: Record<string, string> = {
  vehicle: 'Veiculo',
  part: 'Peca',
  both: 'Ambos',
};

function getTypeColor(type?: string) {
  if (!type) return TYPE_COLORS.default;
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

export default function BrandsScreen() {
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { listContentStyle } = useAdaptiveLayout();
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'all') params.type = typeFilter;
      const data = await adminApi.getBrands(params);
      setBrands(data.data || data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar marcas';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBrands();
  }, [fetchBrands]);

  const handleBrandPress = useCallback(
    (brand: Brand) => {
      if (!can('brands.update')) return;
      router.push(`/(admin)/brands/edit/${brand.id}`);
    },
    [can, router],
  );

  const handleCreate = useCallback(() => {
    router.push('/(admin)/brands/create');
  }, [router]);

  const handleLongPress = useCallback((brand: Brand) => {
    if (!can('brands.delete')) return;
    setDeleteTarget(brand);
  }, [can]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteBrand(deleteTarget.id);
      setDeleteTarget(null);
      fetchBrands();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao excluir marca';
      Alert.alert('Erro', message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchBrands]);

  if (loading) {
    return <LoadingScreen message="Carregando marcas..." />;
  }

  if (error && brands.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  const renderBrandCard = ({ item }: { item: Brand }) => {
    const typeColor = getTypeColor(item.type);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleBrandPress(item)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={600}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.type ? (
            <View style={[styles.typeTag, { backgroundColor: typeColor.bg }]}>
              <Text style={[styles.typeText, { color: typeColor.text }]}>
                {TYPE_LABELS[item.type] || item.type}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.countItem}>
            <Text style={styles.countLabel}>Veiculos</Text>
            <Text style={styles.countValue}>{item.vehicles_count ?? 0}</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={styles.countLabel}>Pecas</Text>
            <Text style={styles.countValue}>{item.parts_count ?? 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <ScreenHeader title="Marcas" subtitle="Gerencie as marcas cadastradas" />
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar marca..."
      />
      <WhiteSpace size="md" />
      <FilterChips
        options={TYPE_FILTERS}
        value={typeFilter}
        onChange={setTypeFilter}
      />
      <WhiteSpace size="lg" />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={brands}
        renderItem={renderBrandCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={listHeader}
        emptyTitle="Nenhuma marca encontrada"
        emptyDescription="Nao ha marcas cadastradas."
        contentContainerStyle={listContentStyle}
      />

      {can('brands.create') && (
        <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Excluir Marca"
        message={`Deseja realmente excluir a marca "${deleteTarget?.name}"?`}
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
  typeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    ...caption.sm,
    fontWeight: '600' as const,
  },
  cardFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-start' as const,
    alignItems: 'center' as const,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    gap: spacing.xl,
  },
  countItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  countLabel: {
    ...caption.md,
    color: colors.textTertiary,
  },
  countValue: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
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
