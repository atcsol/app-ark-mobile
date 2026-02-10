import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { useRouter } from 'expo-router';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, LoadingScreen, EmptyState, RefreshableList, ConfirmModal } from '@/components/ui';
import { useAdaptiveLayout } from '@/hooks';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Category } from '@/types';
import { usePermissions } from '@/hooks';

const PRESET_COLORS: { value: string; hex: string }[] = [
  { value: 'blue', hex: '#1890ff' },
  { value: 'purple', hex: '#722ed1' },
  { value: 'cyan', hex: '#13c2c2' },
  { value: 'red', hex: '#f5222d' },
  { value: 'gold', hex: '#faad14' },
  { value: 'green', hex: '#52c41a' },
  { value: 'orange', hex: '#fa8c16' },
  { value: 'magenta', hex: '#eb2f96' },
  { value: 'teal', hex: '#08979c' },
  { value: 'lime', hex: '#a0d911' },
  { value: 'indigo', hex: '#2f54eb' },
  { value: 'brown', hex: '#8b4513' },
  { value: 'pink', hex: '#ff85c0' },
  { value: 'gray', hex: '#8c8c8c' },
];

function getColorHex(color?: string): string {
  if (!color) return '#8c8c8c';
  const preset = PRESET_COLORS.find(
    (c) => c.value.toLowerCase() === color.toLowerCase(),
  );
  return preset ? preset.hex : color;
}

export default function CategoriesScreen() {
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { listContentStyle } = useAdaptiveLayout();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      const data = await adminApi.getCategories(params);
      setCategories(data.data || data);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar categorias';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, [fetchCategories]);

  const handleCategoryPress = useCallback(
    (category: Category) => {
      if (!can('categories.update')) return;
      router.push(`/(admin)/categories/edit/${category.id}`);
    },
    [can, router],
  );

  const handleCreate = useCallback(() => {
    router.push('/(admin)/categories/create');
  }, [router]);

  const handleLongPress = useCallback(
    (category: Category) => {
      if (!can('categories.delete')) return;
      setDeleteTarget(category);
    },
    [can],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao excluir categoria';
      Alert.alert('Erro', message);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchCategories]);

  if (loading) {
    return <LoadingScreen message="Carregando categorias..." />;
  }

  if (error && categories.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  const renderCategoryCard = ({ item }: { item: Category }) => {
    const colorHex = getColorHex(item.color);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleCategoryPress(item)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={600}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardNameRow}>
            <View style={[styles.colorDot, { backgroundColor: colorHex }]} />
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          {item.icon ? (
            <Text style={styles.cardIcon}>{item.icon}</Text>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.countItem}>
            <Text style={styles.countLabel}>Pecas</Text>
            <Text style={styles.countValue}>{item.parts_count ?? 0}</Text>
          </View>
          <View style={styles.countItem}>
            <Text style={styles.countLabel}>Servicos</Text>
            <Text style={styles.countValue}>{item.services_count ?? 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <ScreenHeader title="Categorias" subtitle="Gerencie as categorias de pecas e servicos" />
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar categoria..."
      />
      <WhiteSpace size="lg" />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={categories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={listHeader}
        emptyTitle="Nenhuma categoria encontrada"
        emptyDescription="Nao ha categorias cadastradas."
        contentContainerStyle={listContentStyle}
      />

      {can('categories.create') && (
        <TouchableOpacity style={styles.fab} onPress={handleCreate} activeOpacity={0.8}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Excluir Categoria"
        message={`Deseja realmente excluir a categoria "${deleteTarget?.name}"?`}
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
  cardNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  cardName: {
    ...heading.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  cardIcon: {
    ...body.md,
    color: colors.textTertiary,
  },
  cardFooter: {
    flexDirection: 'row' as const,
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
