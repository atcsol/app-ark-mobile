import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { WhiteSpace } from '@ant-design/react-native';
import { sellerApi } from '@/services/sellerApi';
import { ScreenContainer } from '@/components/layout';
import { StatCard, LoadingScreen, EmptyState } from '@/components/ui';
import { heading, body, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import type { SellerDashboard } from '@/types/dashboard';

export default function SellerDashboardScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [data, setData] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);
      const response = await sellerApi.getDashboard();
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
      <Text style={styles.sectionTitle}>Painel do Vendedor</Text>
      <Text style={styles.sectionSubtitle}>Suas estatisticas de vendas</Text>

      <WhiteSpace size="xl" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Total Vendas"
            value={formatNumber(stats.total_sales_count)}
            subtitle={formatCurrency(stats.total_sales_value)}
            color={colors.success}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Comissao Total"
            value={formatCurrency(stats.total_commission)}
            color={colors.accent}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Comissao Media"
            value={formatPercentage(stats.avg_commission_percentage)}
            color={colors.info}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Veiculos Pendentes"
            value={formatNumber(stats.pending_vehicles_count)}
            color={colors.warning}
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
