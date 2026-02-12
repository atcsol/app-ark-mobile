import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Button } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { usePermissions } from '@/hooks';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { FormInput, FormCurrency } from '@/components/forms';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, body, caption, heading, borderRadius } from '@/theme';
import { formatCurrency } from '@/utils/formatters';
import type { Investor } from '@/types';

interface VehicleInvestorItem {
  id: string;
  uuid?: string;
  name: string;
  investment: {
    amount: number;
    commission_percentage: number;
    commission_amount: number;
    notes?: string;
  };
}

interface Props {
  vehicleId: string;
  investor?: VehicleInvestorItem | null;
  onRefresh: () => void;
}

export function VehicleInvestorsSection({ vehicleId, investor, onRefresh }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { handleError } = useErrorHandler();
  const [showForm, setShowForm] = useState(false);
  const [allInvestors, setAllInvestors] = useState<Investor[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [commission, setCommission] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [loadingInvestors, setLoadingInvestors] = useState(false);

  const fetchInvestors = useCallback(async () => {
    setLoadingInvestors(true);
    try {
      const response = await adminApi.getInvestors({ per_page: 100 });
      const data = response?.data || response || [];
      setAllInvestors(Array.isArray(data) ? data : []);
    } catch {
      // Silently handle
    } finally {
      setLoadingInvestors(false);
    }
  }, []);

  const handleShowForm = () => {
    fetchInvestors();
    setShowForm(true);
  };

  const handleAttach = useCallback(async () => {
    if (!selectedInvestorId) {
      Alert.alert('Aviso', 'Selecione um investidor.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Aviso', 'Informe o valor do investimento.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.attachVehicleInvestor(vehicleId, {
        investor_id: selectedInvestorId,
        investment_amount: parseFloat(amount),
        commission_percentage: parseFloat(commission) || 0,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Sucesso', 'Investidor vinculado ao veiculo.');
      setShowForm(false);
      setSelectedInvestorId(null);
      setAmount('');
      setCommission('');
      setNotes('');
      onRefresh();
    } catch (error) {
      handleError(error, 'attachInvestor');
    } finally {
      setSaving(false);
    }
  }, [vehicleId, selectedInvestorId, amount, commission, notes, onRefresh]);

  const handleDetach = useCallback(() => {
    if (!investor) return;
    Alert.alert('Remover Investidor', `Remover ${investor.name} deste veiculo?`, [
      { text: 'Cancelar', style: 'cancel' as const },
      {
        text: 'Remover',
        style: 'destructive' as const,
        onPress: async () => {
          setRemoving(true);
          try {
            const investorId = investor.uuid || investor.id;
            await adminApi.detachVehicleInvestor(vehicleId, investorId);
            onRefresh();
          } catch (error) {
            handleError(error, 'detachInvestor');
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  }, [vehicleId, investor, onRefresh]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Investidor</Text>
        {can('vehicles.update') && !investor && !showForm && (
          <TouchableOpacity style={styles.addBtn} onPress={handleShowForm} activeOpacity={0.7}>
            <Text style={styles.addBtnText}>+ Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Current investor */}
      {investor && (
        <View style={styles.card}>
          <InfoRow label="Nome" value={investor.name} />
          <InfoRow label="Investimento" value={formatCurrency(investor.investment.amount)} />
          <InfoRow
            label="Comissao"
            value={`${investor.investment.commission_percentage}% (${formatCurrency(investor.investment.commission_amount)})`}
          />
          {investor.investment.notes && (
            <InfoRow label="Observacoes" value={investor.investment.notes} isLast />
          )}
          {can('vehicles.update') && (
            <TouchableOpacity
              style={styles.detachBtn}
              onPress={handleDetach}
              disabled={removing}
              activeOpacity={0.7}
            >
              {removing ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={styles.detachBtnText}>Remover Investidor</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Add form */}
      {showForm && !investor && (
        <View style={styles.card}>
          <Text style={styles.cardSubtitle}>Vincular Investidor</Text>

          {loadingInvestors ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
          ) : (
            <>
              <Text style={styles.fieldLabel}>Selecione o Investidor *</Text>
              {allInvestors.map((inv) => {
                const invId = inv.uuid || String(inv.id);
                const isSelected = selectedInvestorId === invId;
                return (
                  <TouchableOpacity
                    key={invId}
                    style={[styles.selectableRow, isSelected && styles.selectableRowActive]}
                    onPress={() => setSelectedInvestorId(invId)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.selectableText}>{inv.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <FormInput
            label="Valor do Investimento"
            required
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <FormInput
            label="Comissao (%)"
            value={commission}
            onChangeText={setCommission}
            placeholder="0"
            keyboardType="decimal-pad"
          />
          <FormInput
            label="Observacoes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas sobre o investimento..."
            multiline
          />

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
              onPress={handleAttach}
              loading={saving}
              disabled={saving}
              style={{ flex: 1 }}
            >
              Vincular
            </Button>
          </View>
        </View>
      )}

      {!investor && !showForm && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhum investidor vinculado</Text>
        </View>
      )}
    </View>
  );
}

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={3}>
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
    backgroundColor: colors.accent,
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
    ...body.sm,
    color: colors.textTertiary,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: spacing.sm,
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
  detachBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center' as const,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  detachBtnText: {
    ...body.sm,
    color: colors.error,
    fontWeight: '600' as const,
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
