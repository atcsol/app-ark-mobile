import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { adminApi } from '@/services/adminApi';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { FormInput, FormCurrency } from '@/components/forms';
import { usePermissions } from '@/hooks';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, body, caption, heading, borderRadius } from '@/theme';
import type { ServiceCatalog, Mechanic } from '@/types';

interface Props {
  vehicleId: string;
  onRefresh: () => void;
}

export function VehicleAddServiceSection({ vehicleId, onRefresh }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();
  const { handleError } = useErrorHandler();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dropdown data
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);

  // Form fields
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [serviceDate, setServiceDate] = useState('');
  const [notes, setNotes] = useState('');

  const canCreate = can('vehicle-services.create') || can('vehicles.update');

  useEffect(() => {
    if (!expanded) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [svcRes, mechRes] = await Promise.all([
          adminApi.getServices({ per_page: 100 }),
          adminApi.getMechanics({ per_page: 100 }),
        ]);
        const svcData = svcRes?.data ?? svcRes ?? [];
        const mechData = mechRes?.data ?? mechRes ?? [];
        setServices(Array.isArray(svcData) ? svcData : []);
        setMechanics(Array.isArray(mechData) ? mechData : []);
      } catch {
        // silently fail - lists will be empty
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [expanded]);

  const resetForm = useCallback(() => {
    setSelectedServiceId(null);
    setSelectedMechanicId(null);
    setLaborCost(0);
    setServiceDate('');
    setNotes('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedServiceId) {
      Alert.alert('Erro', 'Selecione um servico.');
      return;
    }
    if (!selectedMechanicId) {
      Alert.alert('Erro', 'Selecione um mecanico.');
      return;
    }

    try {
      setSaving(true);
      await adminApi.createVehicleService(vehicleId, {
        service_id: selectedServiceId,
        mechanic_id: selectedMechanicId,
        labor_cost: laborCost || 0,
        service_date: serviceDate || new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });
      Alert.alert('Sucesso', 'Servico adicionado com sucesso.');
      resetForm();
      setExpanded(false);
      onRefresh();
    } catch (error) {
      handleError(error, 'addVehicleService');
    } finally {
      setSaving(false);
    }
  }, [vehicleId, selectedServiceId, selectedMechanicId, laborCost, serviceDate, notes, resetForm, onRefresh]);

  if (!canCreate) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Adicionar Servico</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setExpanded(!expanded);
            if (!expanded) resetForm();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleButtonText}>
            {expanded ? 'Cancelar' : '+ Novo'}
          </Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
          ) : (
            <>
              {/* Service Selection */}
              <Text style={styles.fieldLabel}>Servico *</Text>
              <View style={styles.optionsGrid}>
                {services.map((svc) => (
                  <TouchableOpacity
                    key={svc.uuid}
                    style={[
                      styles.optionChip,
                      selectedServiceId === svc.uuid && styles.optionChipActive,
                    ]}
                    onPress={() => setSelectedServiceId(svc.uuid)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedServiceId === svc.uuid && styles.optionChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {svc.name}
                    </Text>
                    {svc.category && (
                      <Text style={styles.optionChipSub}>{svc.category}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {services.length === 0 && (
                  <Text style={styles.emptyText}>Nenhum servico cadastrado</Text>
                )}
              </View>

              {/* Mechanic Selection */}
              <Text style={styles.fieldLabel}>Mecanico *</Text>
              <View style={styles.optionsGrid}>
                {mechanics.map((mech) => (
                  <TouchableOpacity
                    key={mech.uuid}
                    style={[
                      styles.optionChip,
                      selectedMechanicId === mech.uuid && styles.optionChipActive,
                    ]}
                    onPress={() => {
                      setSelectedMechanicId(mech.uuid);
                      if (mech.hourly_rate && !laborCost) {
                        setLaborCost(mech.hourly_rate);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedMechanicId === mech.uuid && styles.optionChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {mech.name}
                    </Text>
                    {mech.specialties && mech.specialties.length > 0 && (
                      <Text style={styles.optionChipSub}>{mech.specialties.join(', ')}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {mechanics.length === 0 && (
                  <Text style={styles.emptyText}>Nenhum mecanico cadastrado</Text>
                )}
              </View>

              {/* Labor Cost */}
              <FormCurrency
                label="Custo de Mao de Obra"
                value={laborCost}
                onChangeValue={setLaborCost}
                placeholder="R$ 0,00"
              />

              {/* Date */}
              <FormInput
                label="Data do Servico"
                value={serviceDate}
                onChangeText={setServiceDate}
                placeholder="YYYY-MM-DD"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {/* Notes */}
              <FormInput
                label="Observacoes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Notas adicionais..."
                multiline
                numberOfLines={3}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Adicionar Servico</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  section: {
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
  },
  toggleButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  toggleButtonText: {
    ...caption.md,
    color: colors.white,
    fontWeight: '600' as const,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000' as const,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center' as const,
  },
  loadingText: {
    ...body.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...caption.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600' as const,
  },
  optionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  optionChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '15',
  },
  optionChipText: {
    ...body.sm,
    color: colors.textPrimary,
  },
  optionChipTextActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  optionChipSub: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: 1,
  },
  emptyText: {
    ...body.sm,
    color: colors.textTertiary,
    fontStyle: 'italic' as const,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
});
