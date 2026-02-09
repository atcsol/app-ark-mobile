import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Modal, Button } from '@ant-design/react-native';
import { mechanicApi } from '@/services/mechanicApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, StatusTag } from '@/components/ui';
import { FormInput } from '@/components/forms';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { VehicleService } from '@/types';

export default function ServiceDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [service, setService] = useState<VehicleService | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Complete modal state
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeHours, setCompleteHours] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  const fetchService = useCallback(async () => {
    try {
      setError(null);
      const response = await mechanicApi.getServiceDetails(uuid!);
      const data = response.data || response;
      setService(data);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar servico';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchService();
    }
  }, [fetchService, uuid]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchService();
  }, [fetchService]);

  const handleStartService = useCallback(async () => {
    try {
      setActionLoading(true);
      await mechanicApi.updateServiceStatus(uuid!, { status: 'in_progress' });
      Alert.alert('Sucesso', 'Servico iniciado com sucesso.');
      fetchService();
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao iniciar servico';
      Alert.alert('Erro', message);
    } finally {
      setActionLoading(false);
    }
  }, [uuid, fetchService]);

  const handleCompleteService = useCallback(async () => {
    try {
      setActionLoading(true);
      const payload: {
        status: 'pending' | 'in_progress' | 'completed';
        hours_worked?: number;
        notes?: string;
      } = { status: 'completed' };
      if (completeHours.trim()) {
        const hours = parseFloat(completeHours.replace(',', '.'));
        if (!isNaN(hours) && hours > 0) {
          payload.hours_worked = hours;
        }
      }
      if (completeNotes.trim()) {
        payload.notes = completeNotes.trim();
      }
      await mechanicApi.updateServiceStatus(uuid!, payload);
      setCompleteModalVisible(false);
      setCompleteHours('');
      setCompleteNotes('');
      Alert.alert('Sucesso', 'Servico concluido com sucesso.');
      fetchService();
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao concluir servico';
      Alert.alert('Erro', message);
    } finally {
      setActionLoading(false);
    }
  }, [uuid, completeHours, completeNotes, fetchService]);

  const handleAddParts = useCallback(() => {
    router.push(`/(mechanic)/services/${uuid}/parts`);
  }, [router, uuid]);

  // Helper component for detail rows
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
    return (
      <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={3}>
          {value}
        </Text>
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen message="Carregando servico..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!service) {
    return (
      <ScreenContainer>
        <EmptyState title="Servico nao encontrado" description="O servico solicitado nao existe." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.serviceTitle}>{service.service?.name || 'Servico'}</Text>
      <View style={styles.statusRow}>
        <StatusTag status={service.status} />
      </View>

      {/* Service Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacoes do Servico</Text>
        <View style={styles.card}>
          <InfoRow label="Nome" value={service.service?.name || '-'} />
          {service.service?.category && (
            <InfoRow label="Categoria" value={service.service.category} />
          )}
          <InfoRow label="Preco Base" value={formatCurrency(service.service?.base_price || 0)} />
          <InfoRow label="Data" value={service.service_date ? formatDate(service.service_date) : '-'} />
          {service.hours_worked != null && (
            <InfoRow label="Horas Trabalhadas" value={`${service.hours_worked}h`} />
          )}
          <InfoRow label="Custo Mao de Obra" value={formatCurrency(service.labor_cost || 0)} />
          <InfoRow
            label="Custo Total"
            value={formatCurrency(service.total_cost || 0)}
            valueColor={colors.accent}
          />
          {service.notes && <InfoRow label="Observacoes" value={service.notes} isLast />}
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veiculo</Text>
        <View style={styles.card}>
          <InfoRow label="ID do Veiculo" value={String(service.vehicle_id)} isLast />
        </View>
      </View>

      {/* Parts Used */}
      {service.parts && service.parts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pecas Utilizadas</Text>
          {service.parts.map((partUsage, index) => (
            <View
              key={partUsage.id}
              style={[styles.card, index < service.parts!.length - 1 && styles.cardSpaced]}
            >
              <InfoRow label="Peca" value={partUsage.part?.name || '-'} />
              <InfoRow label="Quantidade" value={String(partUsage.quantity)} />
              <InfoRow label="Preco Unitario" value={formatCurrency(partUsage.unit_price)} />
              <InfoRow
                label="Total"
                value={formatCurrency(partUsage.total_price)}
                valueColor={colors.accent}
                isLast
              />
            </View>
          ))}
        </View>
      )}

      {/* Approval */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aprovacao</Text>
        <View style={styles.card}>
          <View style={styles.approvalRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <StatusTag status={service.approval_status} small />
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <View style={styles.actionsRow}>
          {service.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartService}
              activeOpacity={0.7}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>
                {actionLoading ? 'Processando...' : 'Iniciar Servico'}
              </Text>
            </TouchableOpacity>
          )}

          {service.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={() => setCompleteModalVisible(true)}
              activeOpacity={0.7}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>Concluir Servico</Text>
            </TouchableOpacity>
          )}

          {(service.status === 'pending' || service.status === 'in_progress') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonOutline]}
              onPress={handleAddParts}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextOutline]}>
                Adicionar Pecas
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Complete Service Modal */}
      <Modal
        visible={completeModalVisible}
        transparent
        maskClosable={!actionLoading}
        onClose={() => !actionLoading && setCompleteModalVisible(false)}
        animationType="slide"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Concluir Servico</Text>
          <Text style={styles.modalSubtitle}>
            Informe as horas trabalhadas e observacoes finais
          </Text>

          <FormInput
            label="Horas Trabalhadas"
            value={completeHours}
            onChangeText={setCompleteHours}
            placeholder="Ex: 2.5"
            keyboardType="decimal-pad"
          />

          <FormInput
            label="Observacoes"
            value={completeNotes}
            onChangeText={setCompleteNotes}
            placeholder="Observacoes sobre o servico..."
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <Button
              style={styles.modalBtn}
              onPress={() => {
                setCompleteModalVisible(false);
                setCompleteHours('');
                setCompleteNotes('');
              }}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              style={styles.modalBtn}
              onPress={handleCompleteService}
              loading={actionLoading}
              disabled={actionLoading}
            >
              Concluir
            </Button>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  serviceTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row' as const,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
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
  cardSpaced: {
    marginBottom: spacing.md,
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
  approvalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
  },
  actionsRow: {
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
  },
  actionButtonSuccess: {
    backgroundColor: colors.success,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionButtonText: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
  actionButtonTextOutline: {
    color: colors.accent,
  },
  modalContent: {
    padding: spacing.xl,
  },
  modalTitle: {
    ...heading.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalBtn: {
    flex: 1,
  },
});
