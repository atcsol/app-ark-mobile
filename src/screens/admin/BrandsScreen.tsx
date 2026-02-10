import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Modal, Button } from '@ant-design/react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, LoadingScreen, EmptyState, RefreshableList, ConfirmModal, FilterChips } from '@/components/ui';
import type { FilterOption } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
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

const TYPE_OPTIONS: { label: string; value: 'vehicle' | 'part' | 'both' }[] = [
  { label: 'Veiculo', value: 'vehicle' },
  { label: 'Peca', value: 'part' },
  { label: 'Ambos', value: 'both' },
];

function getTypeColor(type?: string) {
  if (!type) return TYPE_COLORS.default;
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

export default function BrandsScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { listContentStyle } = useAdaptiveLayout();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create/Edit modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'vehicle' | 'part' | 'both'>('vehicle');
  const [saving, setSaving] = useState(false);

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
      setEditingBrand(brand);
      setFormName(brand.name);
      setFormType(brand.type || 'vehicle');
      setModalVisible(true);
    },
    [can],
  );

  const handleCreate = useCallback(() => {
    setEditingBrand(null);
    setFormName('');
    setFormType('vehicle');
    setModalVisible(true);
  }, []);

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

  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setEditingBrand(null);
    setFormName('');
    setFormType('vehicle');
  }, []);

  const handleModalSave = useCallback(async () => {
    if (!formName.trim()) {
      Alert.alert('Erro', 'O nome da marca e obrigatorio.');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: formName.trim(), type: formType };

      if (editingBrand) {
        await adminApi.updateBrand(editingBrand.id, payload);
      } else {
        await adminApi.createBrand(payload);
      }

      setModalVisible(false);
      setEditingBrand(null);
      setFormName('');
      setFormType('vehicle');
      fetchBrands();
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao salvar marca';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [editingBrand, formName, formType, fetchBrands]);

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

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        maskClosable={!saving}
        onClose={handleModalCancel}
        animationType="fade"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingBrand ? 'Editar Marca' : 'Nova Marca'}
          </Text>

          <Text style={styles.fieldLabel}>Nome</Text>
          <TextInput
            style={styles.textInput}
            value={formName}
            onChangeText={setFormName}
            placeholder="Nome da marca"
            placeholderTextColor={colors.textPlaceholder}
            autoFocus
          />

          <Text style={styles.fieldLabel}>Tipo</Text>
          <View style={styles.typePickerRow}>
            {TYPE_OPTIONS.map((opt) => {
              const selected = formType === opt.value;
              const optColor = TYPE_COLORS[opt.value];
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.typePickerOption,
                    selected && { backgroundColor: optColor.bg, borderColor: optColor.text },
                  ]}
                  onPress={() => setFormType(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typePickerText,
                      selected && { color: optColor.text, fontWeight: '600' as const },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.modalButtons}>
            <Button
              style={styles.cancelBtn}
              onPress={handleModalCancel}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              style={styles.confirmBtn}
              onPress={handleModalSave}
              disabled={saving || !formName.trim()}
              loading={saving}
            >
              {editingBrand ? 'Salvar' : 'Criar'}
            </Button>
          </View>
        </View>
      </Modal>
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

  // Create/Edit Modal styles
  modalContent: {
    padding: spacing.xl,
  },
  modalTitle: {
    ...heading.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...caption.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600' as const,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...body.md,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  typePickerRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typePickerOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
  },
  typePickerText: {
    ...body.sm,
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
