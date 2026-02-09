import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { mechanicApi } from '@/services/mechanicApi';
import { ScreenContainer } from '@/components/layout';
import { StatCard, LoadingScreen, EmptyState } from '@/components/ui';
import { heading, body, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { MechanicDashboard } from '@/types/dashboard';

export default function MechanicDashboardScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [data, setData] = useState<MechanicDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const response = await mechanicApi.getDashboard();
      setData(response);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar dados';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <LoadingScreen message="Carregando dashboard..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!data) {
    return (
      <ScreenContainer>
        <EmptyState title="Sem dados" description="Nenhuma estatistica disponivel." />
      </ScreenContainer>
    );
  }

  const { stats } = data;

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.sectionTitle}>Painel do Mecanico</Text>
      <Text style={styles.sectionSubtitle}>Seus servicos e atividades</Text>

      <WhiteSpace size="xl" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Servicos Totais"
            value={formatNumber(stats.total_services)}
            color={colors.info}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Concluidos"
            value={formatNumber(stats.completed_services)}
            color={colors.success}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Pendentes"
            value={formatNumber(stats.pending_services)}
            color={colors.warning}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Em Andamento"
            value={formatNumber(stats.in_progress_services)}
            color={colors.infoCyan}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Horas Totais"
            value={`${formatNumber(stats.total_hours)}h`}
            color={colors.accent}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Custo de Mao de Obra"
            value={formatCurrency(stats.total_labor_cost)}
            color={colors.primary}
          />
        </View>
      </View>

      <WhiteSpace size="xl" />
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  sectionTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  cardHalf: {
    flex: 1,
  },
});
