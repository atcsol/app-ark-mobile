import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { investorApi } from '@/services/investorApi';
import { RefreshableList, LoadingScreen, EmptyState } from '@/components/ui';
import { useRefreshOnFocus } from '@/hooks';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { formatRelativeDate } from '@/utils/formatters';
import type { InvestorNotification } from '@/types';

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  vehicle_sold: '#52c41a',
  vehicle_update: '#1890ff',
  investment: '#667eea',
  return: '#52c41a',
  alert: '#faad14',
  system: '#999999',
};

export default function InvestorNotificationsScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [notifications, setNotifications] = useState<InvestorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const response = await investorApi.getNotifications();
      const data = Array.isArray(response) ? response : response.data ?? [];
      setNotifications(data);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar notificacoes';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  useRefreshOnFocus(handleRefresh);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      setMarkingAll(true);
      await investorApi.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
      );
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao marcar notificacoes';
      Alert.alert('Erro', message);
    } finally {
      setMarkingAll(false);
    }
  }, []);

  const handleNotificationPress = useCallback(
    async (notification: InvestorNotification) => {
      if (!notification.read_at) {
        try {
          await investorApi.markNotificationAsRead(String(notification.id));
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id
                ? { ...n, read_at: new Date().toISOString() }
                : n,
            ),
          );
        } catch {
          // Silent fail - notification still visible
        }
      }
    },
    [],
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const renderNotificationCard = useCallback(
    ({ item }: { item: InvestorNotification }) => {
      const isUnread = !item.read_at;
      const typeColor = NOTIFICATION_TYPE_COLORS[item.type] || colors.textTertiary;

      return (
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={[styles.notificationCard, isUnread && styles.notificationCardUnread]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.notificationHeader}>
              <View style={styles.titleRow}>
                {isUnread && <View style={styles.unreadDot} />}
                <Text
                  style={[
                    styles.notificationTitle,
                    isUnread && styles.notificationTitleUnread,
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
              </View>
              <Text style={styles.notificationDate}>
                {formatRelativeDate(item.created_at)}
              </Text>
            </View>

            <Text style={styles.notificationMessage} numberOfLines={3}>
              {item.message}
            </Text>

            {item.type && (
              <View style={styles.typeRow}>
                <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                    {getTypeLabel(item.type)}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [handleNotificationPress, styles, colors],
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>Notificacoes</Text>
      <Text style={styles.screenSubtitle}>Acompanhe as atualizacoes</Text>

      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={markingAll}
          activeOpacity={0.7}
        >
          <Text style={styles.markAllText}>
            {markingAll ? 'Marcando...' : `Marcar todas como lidas (${unreadCount})`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && notifications.length === 0) {
    return <LoadingScreen message="Carregando notificacoes..." />;
  }

  if (error && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState title="Erro ao carregar" description={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RefreshableList
        data={notifications}
        renderItem={renderNotificationCard}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={renderHeader()}
        emptyTitle="Nenhuma notificacao"
        emptyDescription="Voce nao possui notificacoes no momento."
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    vehicle_sold: 'Veiculo Vendido',
    vehicle_update: 'Atualizacao',
    investment: 'Investimento',
    return: 'Retorno',
    alert: 'Alerta',
    system: 'Sistema',
  };
  return labels[type] || type;
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
  markAllButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
  },
  markAllText: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.white,
  },
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  notificationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  notificationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
  },
  notificationTitle: {
    ...body.md,
    color: colors.textPrimary,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '700' as const,
  },
  notificationDate: {
    ...caption.sm,
    color: colors.textTertiary,
  },
  notificationMessage: {
    ...body.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row' as const,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    ...caption.sm,
    fontWeight: '600' as const,
  },
});
