import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { investorApi } from '@/services/investorApi';
import { ScreenContainer } from '@/components/layout';
import { StatCard, LoadingScreen, EmptyState } from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { heading, body, spacing } from '@/theme';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import type { InvestorDashboard } from '@/types/dashboard';

export default function InvestorDashboardScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [data, setData] = useState<InvestorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const response = await investorApi.getDashboard();
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
      <Text style={styles.sectionTitle}>Painel do Investidor</Text>
      <Text style={styles.sectionSubtitle}>Seus investimentos e retornos</Text>

      <WhiteSpace size="xl" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Total Veiculos"
            value={formatNumber(stats.total_vehicles)}
            color={colors.info}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Investimentos Ativos"
            value={formatNumber(stats.active_investments)}
            color={colors.accent}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Total Investido"
            value={formatCurrency(stats.total_invested)}
            color={colors.primary}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Total Retornado"
            value={formatCurrency(stats.total_returned)}
            color={colors.success}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Retorno Pendente"
            value={formatCurrency(stats.pending_return)}
            color={colors.warning}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="ROI"
            value={formatPercentage(stats.roi)}
            color={stats.roi >= 0 ? colors.success : colors.error}
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
