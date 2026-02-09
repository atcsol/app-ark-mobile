import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Switch, StyleSheet } from 'react-native';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { usePermissions } from '@/hooks';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, body, caption, heading, borderRadius } from '@/theme';
import { formatDate } from '@/utils/formatters';
import type { VehicleAssignedSeller, Seller } from '@/types';

interface Props {
  vehicleId: string;
  onRefresh: () => void;
}

export function VehicleSellersSection({ vehicleId, onRefresh }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [availableToAll, setAvailableToAll] = useState(false);
  const [assignedSellers, setAssignedSellers] = useState<VehicleAssignedSeller[]>([]);
  const [allSellers, setAllSellers] = useState<Seller[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toggling, setToggling] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sellersResponse, allSellersResponse] = await Promise.all([
        adminApi.getVehicleSellers(vehicleId),
        adminApi.getSellers({ per_page: 100 }),
      ]);
      setAvailableToAll(sellersResponse?.available_to_all_sellers || false);
      setAssignedSellers(sellersResponse?.assigned_sellers || []);
      const sellers = allSellersResponse?.data || allSellersResponse || [];
      setAllSellers(Array.isArray(sellers) ? sellers : []);
    } catch (err: any) {
      // Silently handle - section is optional
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = useCallback(
    async (value: boolean) => {
      setToggling(true);
      setAvailableToAll(value);
      try {
        await adminApi.toggleAvailableToAllSellers(vehicleId, value);
        fetchData();
      } catch (err: any) {
        setAvailableToAll(!value);
        Alert.alert('Erro', err.response?.data?.message || 'Erro ao alterar disponibilidade.');
      } finally {
        setToggling(false);
      }
    },
    [vehicleId, fetchData],
  );

  const handleAssign = useCallback(async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Aviso', 'Selecione ao menos um vendedor.');
      return;
    }
    setAssigning(true);
    try {
      await adminApi.assignVehicleSellers(vehicleId, selectedIds);
      setSelectedIds([]);
      Alert.alert('Sucesso', 'Vendedor(es) atribuido(s).');
      fetchData();
      onRefresh();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message || 'Erro ao atribuir vendedores.');
    } finally {
      setAssigning(false);
    }
  }, [vehicleId, selectedIds, fetchData, onRefresh]);

  const handleRemove = useCallback(
    (seller: VehicleAssignedSeller) => {
      Alert.alert('Remover Vendedor', `Remover ${seller.name} deste veiculo?`, [
        { text: 'Cancelar', style: 'cancel' as const },
        {
          text: 'Remover',
          style: 'destructive' as const,
          onPress: async () => {
            const sellerId = seller.uuid || seller.id;
            setRemovingId(sellerId);
            try {
              await adminApi.removeVehicleSeller(vehicleId, sellerId);
              fetchData();
              onRefresh();
            } catch (err: any) {
              Alert.alert('Erro', err.response?.data?.message || 'Erro ao remover vendedor.');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]);
    },
    [vehicleId, fetchData, onRefresh],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Filter out already assigned sellers
  const assignedIds = new Set(assignedSellers.map((s) => s.uuid || s.id));
  const availableSellers = allSellers.filter(
    (s) => !assignedIds.has(s.uuid) && !assignedIds.has(String(s.id)),
  );

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendedores</Text>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vendedores</Text>

      {/* Toggle */}
      {can('vehicles.update') && (
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Disponivel para todos</Text>
              <Text style={styles.toggleHint}>
                {availableToAll
                  ? 'Qualquer vendedor ativo pode vender'
                  : 'Apenas vendedores atribuidos'}
              </Text>
            </View>
            <Switch
              value={availableToAll}
              onValueChange={handleToggle}
              disabled={toggling}
              trackColor={{ false: colors.gray300, true: colors.accent + '80' }}
              thumbColor={availableToAll ? colors.accent : colors.gray400}
            />
          </View>
        </View>
      )}

      {/* Assigned Sellers */}
      {!availableToAll && assignedSellers.length > 0 && (
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.cardSubtitle}>Vendedores Atribuidos</Text>
          {assignedSellers.map((seller, index) => {
            const sellerId = seller.uuid || seller.id;
            return (
              <View
                key={sellerId}
                style={[
                  styles.sellerRow,
                  index < assignedSellers.length - 1 && styles.sellerRowBorder,
                ]}
              >
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{seller.name}</Text>
                  {seller.email && <Text style={styles.sellerEmail}>{seller.email}</Text>}
                  {seller.commission_percentage != null && (
                    <Text style={styles.sellerCommission}>
                      Comissao: {seller.commission_percentage}%
                    </Text>
                  )}
                </View>
                {can('vehicles.update') && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(seller)}
                    disabled={removingId === sellerId}
                    activeOpacity={0.7}
                  >
                    {removingId === sellerId ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <Text style={styles.removeBtnText}>Remover</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Assign new sellers */}
      {!availableToAll && can('vehicles.update') && availableSellers.length > 0 && (
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.cardSubtitle}>Atribuir Vendedores</Text>
          {availableSellers.map((seller) => {
            const sellerId = seller.uuid || String(seller.id);
            const isSelected = selectedIds.includes(sellerId);
            return (
              <TouchableOpacity
                key={sellerId}
                style={[styles.selectableRow, isSelected && styles.selectableRowActive]}
                onPress={() => toggleSelect(sellerId)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.selectableInfo}>
                  <Text style={styles.sellerName}>{seller.name}</Text>
                  {seller.commission_percentage != null && (
                    <Text style={styles.sellerCommission}>
                      Comissao: {seller.commission_percentage}%
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          <Button
            type="primary"
            onPress={handleAssign}
            loading={assigning}
            disabled={assigning || selectedIds.length === 0}
            style={{ marginTop: spacing.md }}
          >
            Atribuir Selecionados ({selectedIds.length})
          </Button>
        </View>
      )}

      {!availableToAll && assignedSellers.length === 0 && availableSellers.length === 0 && (
        <View style={[styles.card, { marginTop: spacing.md }]}>
          <Text style={styles.emptyText}>Nenhum vendedor disponivel para atribuicao</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
  },
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center' as const,
  },
  cardSubtitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  toggleHint: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing.sm,
  },
  sellerRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    ...body.md,
    color: colors.textPrimary,
  },
  sellerEmail: {
    ...caption.sm,
    color: colors.textSecondary,
  },
  sellerCommission: {
    ...caption.sm,
    color: colors.accent,
    marginTop: 2,
  },
  removeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  removeBtnText: {
    ...caption.md,
    color: colors.error,
    fontWeight: '600' as const,
  },
  selectableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  selectableRowActive: {
    backgroundColor: colors.accent + '10',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray300,
    marginRight: spacing.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700' as const,
  },
  selectableInfo: {
    flex: 1,
  },
  emptyText: {
    ...body.sm,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
});
