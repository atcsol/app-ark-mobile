import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Modal, Button } from '@ant-design/react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, LoadingScreen, EmptyState, RefreshableList, ConfirmModal } from '@/components/ui';
import { useAdaptiveLayout } from '@/hooks';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Category } from '@/types';
import { usePermissions } from '@/hooks';

// ---------------------------------------------------------------------------
// Preset colors for categories
// ---------------------------------------------------------------------------

const PRESET_COLORS: { label: string; value: string; hex: string }[] = [
  { label: 'Blue', value: 'blue', hex: '#1890ff' },
  { label: 'Purple', value: 'purple', hex: '#722ed1' },
  { label: 'Cyan', value: 'cyan', hex: '#13c2c2' },
  { label: 'Red', value: 'red', hex: '#f5222d' },
  { label: 'Gold', value: 'gold', hex: '#faad14' },
  { label: 'Green', value: 'green', hex: '#52c41a' },
  { label: 'Orange', value: 'orange', hex: '#fa8c16' },
  { label: 'Magenta', value: 'magenta', hex: '#eb2f96' },
  { label: 'Teal', value: 'teal', hex: '#08979c' },
  { label: 'Lime', value: 'lime', hex: '#a0d911' },
  { label: 'Indigo', value: 'indigo', hex: '#2f54eb' },
  { label: 'Brown', value: 'brown', hex: '#8b4513' },
  { label: 'Pink', value: 'pink', hex: '#ff85c0' },
  { label: 'Gray', value: 'gray', hex: '#8c8c8c' },
];

function getColorHex(color?: string): string {
  if (!color) return '#8c8c8c';
  const preset = PRESET_COLORS.find(
    (c) => c.value.toLowerCase() === color.toLowerCase(),
  );
  return preset ? preset.hex : color;
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface CategoryForm {
  name: string;
  color: string;
  icon: string;
}

const EMPTY_FORM: CategoryForm = { name: '', color: 'blue', icon: '' };

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { listContentStyle } = useAdaptiveLayout();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create / Edit modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Press handlers
  // ---------------------------------------------------------------------------

  const handleCategoryPress = useCallback(
    (category: Category) => {
      if (!can('categories.update')) return;
      setEditingCategory(category);
      setForm({
        name: category.name,
        color: category.color || 'blue',
        icon: category.icon || '',
      });
      setModalVisible(true);
    },
    [can],
  );

  const handleCreate = useCallback(() => {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }, []);

  const handleLongPress = useCallback(
    (category: Category) => {
      if (!can('categories.delete')) return;
      setDeleteTarget(category);
    },
    [can],
  );

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Save (create / update)
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Erro', 'O nome da categoria e obrigatorio.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        color: form.color,
      };
      if (form.icon.trim()) payload.icon = form.icon.trim();

      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, payload);
      } else {
        await adminApi.createCategory(payload);
      }
      setModalVisible(false);
      setEditingCategory(null);
      setForm(EMPTY_FORM);
      fetchCategories();
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao salvar categoria';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [form, editingCategory, fetchCategories]);

  const handleModalClose = useCallback(() => {
    if (saving) return;
    setModalVisible(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  }, [saving]);

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Render card
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // List header
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

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

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        maskClosable={!saving}
        onClose={handleModalClose}
        animationType="fade"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.fieldLabel}>Nome</Text>
            <TextInput
              style={styles.textInput}
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              placeholder="Nome da categoria"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="words"
            />
            <WhiteSpace size="lg" />

            {/* Icon */}
            <Text style={styles.fieldLabel}>Icone (opcional)</Text>
            <TextInput
              style={styles.textInput}
              value={form.icon}
              onChangeText={(text) => setForm((prev) => ({ ...prev, icon: text }))}
              placeholder="Ex: wrench, engine, bolt"
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
            />
            <WhiteSpace size="lg" />

            {/* Color Picker */}
            <Text style={styles.fieldLabel}>Cor</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((preset) => {
                const isSelected = form.color === preset.value;
                return (
                  <TouchableOpacity
                    key={preset.value}
                    style={[
                      styles.colorOption,
                      { backgroundColor: preset.hex },
                      isSelected && styles.colorOptionSelected,
                    ]}
                    onPress={() => setForm((prev) => ({ ...prev, color: preset.value }))}
                    activeOpacity={0.7}
                  >
                    {isSelected && (
                      <Text style={styles.colorCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.colorLabel}>
              {PRESET_COLORS.find((c) => c.value === form.color)?.label || form.color}
            </Text>
            <WhiteSpace size="lg" />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <Button
              style={styles.cancelBtn}
              onPress={handleModalClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              style={styles.confirmBtn}
              onPress={handleSave}
              loading={saving}
              disabled={saving || !form.name.trim()}
            >
              {editingCategory ? 'Salvar' : 'Criar'}
            </Button>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const createStyles = (colors: Colors) => ({
  listHeader: {
    paddingBottom: spacing.xl,
  },

  // Card
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

  // FAB
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

  // Modal
  modalContent: {
    padding: spacing.xl,
    maxHeight: 500,
  },
  modalTitle: {
    ...heading.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...caption.md,
    color: colors.textSecondary,
    fontWeight: '600' as const,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...body.md,
    color: colors.textPrimary,
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorCheck: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  colorLabel: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
