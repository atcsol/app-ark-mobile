import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { WhiteSpace } from '@ant-design/react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { StatCard, LoadingScreen, EmptyState } from '@/components/ui';
import { useAdaptiveLayout } from '@/hooks';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { AdminDashboardStats, DashboardCharts } from '@/types/dashboard';

const STATUS_LABELS: Record<string, string> = {
  in_analysis: 'Em Analise',
  in_repair: 'Em Reparo',
  ready: 'Pronto',
  for_sale: 'A Venda',
  sold: 'Vendido',
};

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { width: windowWidth } = useWindowDimensions();
  const { paddingHorizontal } = useAdaptiveLayout();
  const chartWidth = windowWidth - paddingHorizontal * 2 - spacing.lg * 2;

  const STATUS_COLORS: Record<string, string> = {
    in_analysis: colors.info,
    in_repair: colors.warning,
    ready: colors.success,
    for_sale: colors.accent,
    sold: colors.textTertiary,
  };

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, chartsData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getDashboardCharts().catch(() => null),
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (err: any) {
      const data = err.response?.data;
      let message = data?.message || err.message || 'Erro ao carregar dados';
      if (err.response?.status === 403 && data?.required_permission) {
        message += `\n\nPermissão necessária: ${data.required_permission}`;
        if (data.your_roles?.length > 0) {
          message += `\nSeus roles: ${data.your_roles.join(', ')}`;
        }
        if (data.your_permissions?.length > 0) {
          message += `\nSuas permissões: ${data.your_permissions.join(', ')}`;
        } else {
          message += '\nSuas permissões: nenhuma';
        }
      }
      if (err.response?.status === 401) {
        message += '\n\nToken inválido ou expirado. Faça login novamente.';
      }
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

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

  if (!stats) {
    return (
      <ScreenContainer>
        <EmptyState title="Sem dados" description="Nenhuma estatistica disponivel." />
      </ScreenContainer>
    );
  }

  // Build vehicle status data for chart
  const vehicleStatusData = [
    { status: 'in_analysis', count: stats.vehicles.in_analysis || 0 },
    { status: 'in_repair', count: stats.vehicles.in_repair || 0 },
    { status: 'ready', count: stats.vehicles.ready || 0 },
    { status: 'for_sale', count: stats.vehicles.for_sale || 0 },
    { status: 'sold', count: stats.vehicles.sold || 0 },
  ].filter((d) => d.count > 0);

  const maxVehicleCount = Math.max(...vehicleStatusData.map((d) => d.count), 1);

  // Sales by month data
  const salesByMonth = charts?.sales_by_month || [];
  const maxRevenue = Math.max(...salesByMonth.map((d) => d.revenue), 1);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.sectionTitle}>Painel Administrativo</Text>
      <Text style={styles.sectionSubtitle}>Visao geral do negocio</Text>

      <WhiteSpace size="xl" />

      {/* Row 1: Vehicles & Financial */}
      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Total Veiculos"
            value={formatNumber(stats.vehicles.total)}
            subtitle={`${stats.vehicles.in_repair} em reparo`}
            color={colors.info}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Total Investido"
            value={formatCurrency(stats.financial.total_invested)}
            color={colors.accent}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Lucro Total"
            value={formatCurrency(stats.financial.total_profit)}
            subtitle={`Margem: ${stats.financial.profit_margin.toFixed(1)}%`}
            color={colors.success}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Pecas em Estoque"
            value={formatNumber(stats.stock.total_parts)}
            subtitle={`${stats.stock.low_stock_count} com estoque baixo`}
            color={colors.warning}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      {/* Row 2: Sales & Services */}
      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Vendas do Mes"
            value={formatNumber(stats.sales.this_month_count)}
            subtitle={formatCurrency(stats.sales.this_month_revenue)}
            color={colors.success}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Servicos do Mes"
            value={formatNumber(stats.services.this_month_count)}
            subtitle={formatCurrency(stats.services.this_month_cost)}
            color={colors.infoCyan}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      <View style={styles.row}>
        <View style={styles.cardHalf}>
          <StatCard
            title="Investidores"
            value={formatNumber(stats.investors.total)}
            subtitle={`${stats.investors.active} ativos`}
            color={colors.accent}
          />
        </View>
        <View style={styles.cardHalf}>
          <StatCard
            title="Valor do Estoque"
            value={formatCurrency(stats.stock.total_value)}
            color={colors.info}
          />
        </View>
      </View>

      <WhiteSpace size="md" />

      {/* Row 3: Extra Metrics */}
      <View style={styles.row}>
        <View style={styles.cardThird}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Ticket Medio</Text>
            <Text style={styles.metricValue}>{formatCurrency(stats.sales.average_ticket)}</Text>
          </View>
        </View>
        <View style={styles.cardThird}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Top Vendedor</Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {stats.top_seller?.name || '-'}
            </Text>
            {stats.top_seller && (
              <Text style={styles.metricSubtext}>
                {stats.top_seller.sales_count} vendas
              </Text>
            )}
          </View>
        </View>
        <View style={styles.cardThird}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Top Mecanico</Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {stats.top_mechanic?.name || '-'}
            </Text>
            {stats.top_mechanic && (
              <Text style={styles.metricSubtext}>
                {stats.top_mechanic.services_count} servicos
              </Text>
            )}
          </View>
        </View>
      </View>

      <WhiteSpace size="xl" />

      {/* Chart: Vehicles by Status */}
      {vehicleStatusData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Veiculos por Status</Text>
          <WhiteSpace size="md" />
          {vehicleStatusData.map((item) => {
            const pct = (item.count / maxVehicleCount) * 100;
            return (
              <View key={item.status} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {STATUS_LABELS[item.status] || item.status}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: STATUS_COLORS[item.status] || colors.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{item.count}</Text>
              </View>
            );
          })}

          {/* Legend */}
          <View style={styles.legendRow}>
            {vehicleStatusData.map((item) => (
              <View key={item.status} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: STATUS_COLORS[item.status] || colors.accent },
                  ]}
                />
                <Text style={styles.legendText}>
                  {STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <WhiteSpace size="md" />

      {/* Chart: Sales by Month */}
      {salesByMonth.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Vendas por Mes</Text>
          <WhiteSpace size="md" />
          <Svg width={chartWidth - spacing.lg * 2} height={160}>
            {salesByMonth.map((item, index) => {
              const barWidth = Math.max(
                (chartWidth - spacing.lg * 2 - salesByMonth.length * 8) / salesByMonth.length,
                20,
              );
              const x = index * (barWidth + 8);
              const barHeight = (item.revenue / maxRevenue) * 120;
              return (
                <React.Fragment key={index}>
                  <Rect
                    x={x}
                    y={130 - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    fill={colors.accent}
                    opacity={0.8}
                  />
                  <SvgText
                    x={x + barWidth / 2}
                    y={150}
                    fontSize={10}
                    fill={colors.textTertiary}
                    textAnchor="middle"
                  >
                    {item.month}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
          <View style={styles.chartFooter}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={styles.legendText}>Receita</Text>
            </View>
          </View>
        </View>
      )}

      <WhiteSpace size="xl" />
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
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
  cardThird: {
    flex: 1,
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center' as const,
    flex: 1,
  },
  metricLabel: {
    ...caption.sm,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  metricValue: {
    ...body.sm,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  metricSubtext: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // Charts
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  barRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  barLabel: {
    ...caption.sm,
    color: colors.textSecondary,
    width: 80,
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: colors.gray100,
    borderRadius: 10,
    overflow: 'hidden' as const,
    marginHorizontal: spacing.sm,
  },
  barFill: {
    height: '100%' as const,
    borderRadius: 10,
  },
  barValue: {
    ...caption.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    width: 30,
    textAlign: 'right' as const,
  },
  legendRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    ...caption.sm,
    color: colors.textSecondary,
  },
  chartFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginTop: spacing.sm,
  },
});
