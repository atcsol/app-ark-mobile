import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { usePermissions } from '@/hooks';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { FormInput } from '@/components/forms';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, body, caption, heading, borderRadius } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Vehicle, Seller } from '@/types';

interface Props {
  vehicle: Vehicle;
  onRefresh: () => void;
}

export function VehicleSaleSection({ vehicle, onRefresh }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { handleError } = useErrorHandler();
  const [showForm, setShowForm] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [saleValue, setSaleValue] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [commissionPct, setCommissionPct] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(false);

  const isSold = vehicle.status === 'sold';

  const fetchSellers = useCallback(async () => {
    setLoadingSellers(true);
    try {
      const response = await adminApi.getSellers({ per_page: 100 });
      const data = response?.data || response || [];
      setSellers(Array.isArray(data) ? data : []);
    } catch {
      // Silently handle
    } finally {
      setLoadingSellers(false);
    }
  }, []);

  const handleShowForm = () => {
    fetchSellers();
    setShowForm(true);
  };

  const handleRegisterSale = useCallback(async () => {
    if (!saleValue || parseFloat(saleValue) <= 0) {
      Alert.alert('Aviso', 'Informe o valor da venda.');
      return;
    }
    if (!saleDate) {
      Alert.alert('Aviso', 'Informe a data da venda.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.registerVehicleSale(vehicle.uuid, {
        sale_value: parseFloat(saleValue),
        sale_date: saleDate,
        seller_id: selectedSellerId || undefined,
        seller_commission_percentage: commissionPct ? parseFloat(commissionPct) : undefined,
      });
      Alert.alert('Sucesso', 'Venda registrada com sucesso.');
      setShowForm(false);
      onRefresh();
    } catch (error) {
      handleError(error, 'registerSale');
    } finally {
      setSaving(false);
    }
  }, [vehicle.uuid, saleValue, saleDate, selectedSellerId, commissionPct, onRefresh]);

  // If sold, show sale info
  if (isSold) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Venda</Text>
        <View style={styles.card}>
          {vehicle.sale_value != null && (
            <InfoRow label="Valor de Venda" value={formatCurrency(vehicle.sale_value)} />
          )}
          {vehicle.sale_date && (
            <InfoRow label="Data da Venda" value={formatDate(vehicle.sale_date)} />
          )}
          {vehicle.seller && <InfoRow label="Vendedor" value={vehicle.seller.name} />}
          {vehicle.seller?.commission != null && (
            <InfoRow label="Comissao" value={formatCurrency(vehicle.seller.commission)} />
          )}
          <InfoRow
            label="Valor de Compra"
            value={formatCurrency(vehicle.purchase_value)}
          />
          {vehicle.costs?.total != null && (
            <InfoRow label="Custo Total" value={formatCurrency(vehicle.costs.total)} />
          )}
          {vehicle.profit != null && (
            <InfoRow
              label="Lucro"
              value={formatCurrency(vehicle.profit)}
              valueColor={vehicle.profit >= 0 ? colors.success : colors.error}
              isLast
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Venda</Text>
        {can('vehicles.update') && !showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={handleShowForm} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>Registrar Venda</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm ? (
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>Registrar Venda</Text>

          <FormInput
            label="Valor da Venda"
            required
            value={saleValue}
            onChangeText={setSaleValue}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <FormInput
            label="Data da Venda"
            required
            value={saleDate}
            onChangeText={setSaleDate}
            placeholder="YYYY-MM-DD"
          />

          {loadingSellers ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
          ) : sellers.length > 0 ? (
            <>
              <Text style={styles.fieldLabel}>Vendedor (opcional)</Text>
              <TouchableOpacity
                style={[styles.selectableRow, !selectedSellerId && styles.selectableRowActive]}
                onPress={() => setSelectedSellerId(null)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, !selectedSellerId && styles.radioActive]}>
                  {!selectedSellerId && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.selectableText}>Nenhum</Text>
              </TouchableOpacity>
              {sellers.map((seller) => {
                const sellerId = seller.uuid || String(seller.id);
                const isSelected = selectedSellerId === sellerId;
                return (
                  <TouchableOpacity
                    key={sellerId}
                    style={[styles.selectableRow, isSelected && styles.selectableRowActive]}
                    onPress={() => {
                      setSelectedSellerId(sellerId);
                      if (seller.commission_percentage != null) {
                        setCommissionPct(String(seller.commission_percentage));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.selectableText}>
                      {seller.name}
                      {seller.commission_percentage != null ? ` (${seller.commission_percentage}%)` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : null}

          {selectedSellerId && (
            <FormInput
              label="Comissao do Vendedor (%)"
              value={commissionPct}
              onChangeText={setCommissionPct}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          )}

          {/* Cost breakdown */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Resumo Financeiro</Text>
            <InfoRow label="Compra" value={formatCurrency(vehicle.purchase_value)} />
            {vehicle.costs?.total != null && (
              <InfoRow label="Custos" value={formatCurrency(vehicle.costs.total)} />
            )}
            {saleValue && parseFloat(saleValue) > 0 && (
              <>
                <InfoRow label="Venda" value={formatCurrency(parseFloat(saleValue))} />
                {(() => {
                  const totalCost =
                    vehicle.purchase_value + (vehicle.costs?.total || 0);
                  const profit = parseFloat(saleValue) - totalCost;
                  return (
                    <InfoRow
                      label="Lucro Estimado"
                      value={formatCurrency(profit)}
                      valueColor={profit >= 0 ? colors.success : colors.error}
                      isLast
                    />
                  );
                })()}
              </>
            )}
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelFormBtn}
              onPress={() => setShowForm(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelFormBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <Button
              type="primary"
              onPress={handleRegisterSale}
              loading={saving}
              disabled={saving}
              style={{ flex: 1 }}
            >
              Confirmar Venda
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Veiculo ainda nao vendido</Text>
          <Text style={styles.emptyHint}>
            Valor de compra: {formatCurrency(vehicle.purchase_value)}
          </Text>
        </View>
      )}
    </View>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
  isLast = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
  },
  addBtn: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  addBtnText: {
    ...caption.md,
    fontWeight: '600' as const,
    color: colors.white,
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
  cardSubtitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
  },
  emptyText: {
    ...body.md,
    color: colors.textSecondary,
  },
  emptyHint: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    ...body.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
  selectableText: {
    ...body.md,
    color: colors.textPrimary,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray300,
    marginRight: spacing.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  radioActive: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  breakdownCard: {
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  breakdownTitle: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: spacing.xs + 2,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    ...body.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...body.md,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right' as const,
  },
  formButtons: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelFormBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
  },
  cancelFormBtnText: {
    ...body.md,
    color: colors.textSecondary,
  },
});
