import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { RefreshableList, LoadingScreen, EmptyState, StatusTag, ConfirmModal, FilterChips } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatDate } from '@/utils/formatters';
import { usePermissions } from '@/hooks';

type ApprovalType = 'services' | 'parts' | 'sales';
type ApprovalItemStatus = 'pending' | 'approved' | 'rejected';

interface Approval {
  id: number;
  uuid: string;
  type: ApprovalType;
  item: Record<string, unknown>;
  status: ApprovalItemStatus;
  requested_by: { id: number; name: string };
  approved_by?: { id: number; name: string } | null;
  rejection_reason?: string | null;
  created_at: string;
}

interface ApprovalStats {
  pending_services: number;
  pending_parts: number;
  pending_sales: number;
  total_pending: number;
}

type TabKey = 'services' | 'parts' | 'sales';

interface Tab {
  key: TabKey;
  label: string;
  countField: keyof ApprovalStats;
}

const TABS: Tab[] = [
  { key: 'services', label: 'Servicos', countField: 'pending_services' },
  { key: 'parts', label: 'Pecas', countField: 'pending_parts' },
  { key: 'sales', label: 'Vendas', countField: 'pending_sales' },
];

type StatusFilterKey = 'pending' | 'approved' | 'rejected';

const STATUS_FILTERS: { label: string; value: StatusFilterKey }[] = [
  { label: 'Pendentes', value: 'pending' },
  { label: 'Aprovados', value: 'approved' },
  { label: 'Rejeitados', value: 'rejected' },
];

const TYPE_ICONS: Record<ApprovalType, string> = {
  services: 'S',
  parts: 'P',
  sales: 'V',
};

function getApprovalDescription(approval: Approval): string {
  const item = approval.item;
  if (item.name) return String(item.name);
  if (item.description) return String(item.description);
  if (item.solicitation_number) return `Solicitacao #${item.solicitation_number}`;
  return `Item #${approval.id}`;
}

export default function ApprovalsScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { can } = usePermissions();

  const TYPE_ICON_COLORS: Record<ApprovalType, string> = {
    services: colors.info,
    parts: colors.warning,
    sales: colors.success,
  };

  const [activeTab, setActiveTab] = useState<TabKey>('services');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('pending');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<Approval | null>(null);
  const [rejecting, setRejecting] = useState(false);

  // Approve loading state
  const [approvingUuid, setApprovingUuid] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getApprovalStats();
      setStats(data.data || data);
    } catch {
      // Stats are optional, don't block the UI
    }
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      setError(null);
      let data;
      if (statusFilter === 'pending') {
        data = await adminApi.getApprovals(activeTab);
      } else {
        data = await adminApi.getApprovalsHistory({ status: statusFilter, type: activeTab });
      }
      setApprovals(data.data || data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar aprovacoes';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchApprovals();
    fetchStats();
  }, [fetchApprovals, fetchStats]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApprovals();
    fetchStats();
  }, [fetchApprovals, fetchStats]);

  const handleTabChange = useCallback((tab: TabKey) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLoading(true);
  }, [activeTab]);

  const handleStatusFilterChange = useCallback((status: StatusFilterKey) => {
    if (status === statusFilter) return;
    setStatusFilter(status);
    setLoading(true);
  }, [statusFilter]);

  const handleApprove = useCallback((approval: Approval) => {
    Alert.alert(
      'Aprovar',
      `Deseja aprovar "${getApprovalDescription(approval)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            setApprovingUuid(approval.uuid);
            try {
              if (approval.type === 'services') {
                await adminApi.approveService(approval.uuid);
              } else if (approval.type === 'parts') {
                await adminApi.approvePart(approval.uuid);
              } else {
                await adminApi.approveSale(approval.uuid);
              }
              fetchApprovals();
              fetchStats();
            } catch (err: any) {
              const message = err.response?.data?.message || err.message || 'Erro ao aprovar';
              Alert.alert('Erro', message);
            } finally {
              setApprovingUuid(null);
            }
          },
        },
      ],
    );
  }, [fetchApprovals, fetchStats]);

  const handleReject = useCallback(async (reason?: string) => {
    if (!rejectTarget || !reason) return;
    setRejecting(true);
    try {
      if (rejectTarget.type === 'services') {
        await adminApi.rejectService(rejectTarget.uuid, reason);
      } else if (rejectTarget.type === 'parts') {
        await adminApi.rejectPart(rejectTarget.uuid, reason);
      } else {
        await adminApi.rejectSale(rejectTarget.uuid, reason);
      }
      setRejectTarget(null);
      fetchApprovals();
      fetchStats();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao rejeitar';
      Alert.alert('Erro', message);
    } finally {
      setRejecting(false);
    }
  }, [rejectTarget, fetchApprovals, fetchStats]);

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = stats ? stats[tab.countField] : 0;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {count > 0 && (
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderApprovalCard = ({ item }: { item: Approval }) => {
    const isPending = item.status === 'pending';
    const isApproving = approvingUuid === item.uuid;
    const iconColor = TYPE_ICON_COLORS[item.type];
    const iconLetter = TYPE_ICONS[item.type];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.typeIcon, { backgroundColor: iconColor + '20' }]}>
            <Text style={[styles.typeIconText, { color: iconColor }]}>
              {iconLetter}
            </Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {getApprovalDescription(item)}
            </Text>
            <Text style={styles.cardRequester}>
              Solicitado por: {item.requested_by.name}
            </Text>
            {item.approved_by && (
              <Text style={styles.cardRequester}>
                {item.status === 'approved' ? 'Aprovado' : 'Rejeitado'} por: {item.approved_by.name}
              </Text>
            )}
            <Text style={styles.cardDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <StatusTag status={item.status} small />
        </View>

        {item.rejection_reason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Motivo da rejeicao:</Text>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}

        {isPending && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
              disabled={isApproving}
              activeOpacity={0.7}
            >
              <Text style={styles.approveBtnText}>
                {isApproving ? 'Aprovando...' : 'Aprovar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => setRejectTarget(item)}
              disabled={isApproving}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectBtnText}>Rejeitar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={styles.screenTitle}>Aprovacoes</Text>
      {stats && (
        <Text style={styles.screenSubtitle}>
          {stats.total_pending} pendente{stats.total_pending !== 1 ? 's' : ''}
        </Text>
      )}
      <WhiteSpace size="md" />
      {renderTabBar()}
      <WhiteSpace size="md" />
      <FilterChips
        options={STATUS_FILTERS}
        value={statusFilter}
        onChange={handleStatusFilterChange}
      />
      <WhiteSpace size="lg" />
    </View>
  );

  return (
    <View style={styles.container}>
      {loading && approvals.length === 0 ? (
        <LoadingScreen message="Carregando aprovacoes..." />
      ) : error && approvals.length === 0 ? (
        <View style={styles.errorContainer}>
          {listHeader}
          <EmptyState title="Erro ao carregar" description={error} />
        </View>
      ) : (
        <RefreshableList
          data={approvals}
          renderItem={renderApprovalCard}
          keyExtractor={(item) => item.uuid}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={listHeader}
          emptyTitle="Nenhuma aprovacao encontrada"
          emptyDescription="Nao ha aprovacoes para esta categoria."
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Reject Modal */}
      <ConfirmModal
        visible={!!rejectTarget}
        title="Rejeitar"
        message={`Informe o motivo da rejeicao de "${rejectTarget ? getApprovalDescription(rejectTarget) : ''}".`}
        confirmLabel="Rejeitar"
        danger
        requireReason
        reasonPlaceholder="Motivo da rejeicao..."
        loading={rejecting}
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  listHeader: {
    paddingBottom: spacing.md,
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
  tabBar: {
    flexDirection: 'row' as const,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    ...caption.sm,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  tabBadgeTextActive: {
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
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: spacing.md,
  },
  typeIconText: {
    ...heading.h4,
    fontWeight: '700' as const,
  },
  cardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardDescription: {
    ...body.md,
    color: colors.textPrimary,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  cardRequester: {
    ...caption.md,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardDate: {
    ...caption.sm,
    color: colors.textTertiary,
  },
  rejectionBox: {
    backgroundColor: '#fff1f0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  rejectionLabel: {
    ...caption.sm,
    color: colors.error,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  rejectionText: {
    ...body.sm,
    color: colors.error,
  },
  cardActions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  approveBtn: {
    backgroundColor: '#f6ffed',
    borderWidth: 1,
    borderColor: colors.success,
  },
  approveBtnText: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.success,
  },
  rejectBtn: {
    backgroundColor: '#fff1f0',
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectBtnText: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.error,
  },
});
