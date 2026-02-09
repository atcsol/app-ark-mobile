import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Button, WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { EmptyState, FilterChips } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

type ReportType = 'vehicles' | 'sales' | 'investors' | 'parts';

interface ReportOption {
  label: string;
  value: ReportType;
}

const REPORT_OPTIONS: ReportOption[] = [
  { label: 'Veiculos', value: 'vehicles' },
  { label: 'Vendas', value: 'sales' },
  { label: 'Investidores', value: 'investors' },
  { label: 'Pecas', value: 'parts' },
];

const VEHICLE_STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Em Analise', value: 'in_analysis' },
  { label: 'Em Reparo', value: 'in_repair' },
  { label: 'Pronto', value: 'ready' },
  { label: 'A Venda', value: 'for_sale' },
  { label: 'Vendido', value: 'sold' },
];

export default function ReportsScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [reportType, setReportType] = useState<ReportType>('vehicles');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setResults([]);
      setHasGenerated(true);

      const filters: Record<string, any> = {};
      if (startDate.trim()) filters.start_date = startDate.trim();
      if (endDate.trim()) filters.end_date = endDate.trim();
      if (reportType === 'vehicles' && vehicleStatus !== 'all') {
        filters.status = vehicleStatus;
      }

      let response: any;

      switch (reportType) {
        case 'vehicles':
          response = await adminApi.getVehiclesReport(filters);
          break;
        case 'sales':
          response = await adminApi.getSalesReport(filters);
          break;
        case 'investors':
          response = await adminApi.getInvestorsReport(filters);
          break;
        case 'parts':
          response = await adminApi.getPartsReport(filters);
          break;
      }

      const data = response?.data ?? response ?? [];
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao gerar relatorio';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [reportType, startDate, endDate, vehicleStatus]);

  const renderVehicleItem = useCallback((item: any, index: number) => (
    <View key={index} style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.name || item.vehicle_name || `Veiculo #${index + 1}`}
      </Text>
      {item.status && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Status</Text>
          <Text style={styles.cardValue}>{item.status}</Text>
        </View>
      )}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Valor Compra</Text>
        <Text style={styles.cardValue}>
          {formatCurrency(item.purchase_value ?? 0)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Custos</Text>
        <Text style={[styles.cardValue, { color: colors.warning }]}>
          {formatCurrency(item.costs ?? 0)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Lucro</Text>
        <Text
          style={[
            styles.cardValue,
            { color: (item.profit ?? 0) >= 0 ? colors.success : colors.error },
          ]}
        >
          {formatCurrency(item.profit ?? 0)}
        </Text>
      </View>
    </View>
  ), [colors, styles]);

  const renderSalesItem = useCallback((item: any, index: number) => (
    <View key={index} style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.buyer_name || `Venda #${index + 1}`}
      </Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Valor Venda</Text>
        <Text style={[styles.cardValue, { color: colors.success }]}>
          {formatCurrency(item.sale_value ?? 0)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Comissao</Text>
        <Text style={[styles.cardValue, { color: colors.accent }]}>
          {formatCurrency(item.commission ?? 0)}
        </Text>
      </View>
      {item.date && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Data</Text>
          <Text style={styles.cardValue}>{formatDate(item.date)}</Text>
        </View>
      )}
    </View>
  ), [colors, styles]);

  const renderInvestorItem = useCallback((item: any, index: number) => (
    <View key={index} style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.name || item.investor_name || `Investidor #${index + 1}`}
      </Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Total Investido</Text>
        <Text style={[styles.cardValue, { color: colors.accent }]}>
          {formatCurrency(item.total_invested ?? 0)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Total Retornado</Text>
        <Text style={[styles.cardValue, { color: colors.success }]}>
          {formatCurrency(item.total_returned ?? 0)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>ROI</Text>
        <Text
          style={[
            styles.cardValue,
            { color: (item.roi ?? 0) >= 0 ? colors.success : colors.error },
          ]}
        >
          {typeof item.roi === 'number' ? `${item.roi.toFixed(1)}%` : '-'}
        </Text>
      </View>
    </View>
  ), [colors, styles]);

  const renderPartsItem = useCallback((item: any, index: number) => (
    <View key={index} style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.name || item.part_name || `Peca #${index + 1}`}
      </Text>
      {item.part_number && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Numero</Text>
          <Text style={styles.cardValue}>{item.part_number}</Text>
        </View>
      )}
      {item.manufacturer && (
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Fabricante</Text>
          <Text style={styles.cardValue}>{item.manufacturer}</Text>
        </View>
      )}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Estoque</Text>
        <Text style={[styles.cardValue, { color: (item.quantity ?? 0) <= (item.minimum_stock ?? 0) ? colors.error : colors.textPrimary }]}>
          {formatNumber(item.quantity ?? item.stock_quantity ?? 0)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Preco Unit.</Text>
        <Text style={styles.cardValue}>
          {formatCurrency(item.unit_price ?? item.price ?? 0)}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Valor Total</Text>
        <Text style={[styles.cardValue, { color: colors.accent }]}>
          {formatCurrency(item.total_value ?? (item.quantity ?? 0) * (item.unit_price ?? item.price ?? 0))}
        </Text>
      </View>
    </View>
  ), [colors, styles]);

  const handleExport = useCallback(async () => {
    if (results.length === 0) {
      Alert.alert('Aviso', 'Gere um relatorio primeiro para exportar.');
      return;
    }

    const typeLabel = REPORT_OPTIONS.find((o) => o.value === reportType)?.label || reportType;
    let header = '';
    let rows = '';

    switch (reportType) {
      case 'vehicles':
        header = 'Nome | Status | Compra | Custos | Lucro';
        rows = results
          .map(
            (item) =>
              `${item.name || '-'} | ${item.status || '-'} | ${formatCurrency(item.purchase_value ?? 0)} | ${formatCurrency(item.costs ?? 0)} | ${formatCurrency(item.profit ?? 0)}`,
          )
          .join('\n');
        break;
      case 'sales':
        header = 'Comprador | Valor Venda | Comissao | Data';
        rows = results
          .map(
            (item) =>
              `${item.buyer_name || '-'} | ${formatCurrency(item.sale_value ?? 0)} | ${formatCurrency(item.commission ?? 0)} | ${item.date ? formatDate(item.date) : '-'}`,
          )
          .join('\n');
        break;
      case 'investors':
        header = 'Nome | Total Investido | Total Retornado | ROI';
        rows = results
          .map(
            (item) =>
              `${item.name || item.investor_name || '-'} | ${formatCurrency(item.total_invested ?? 0)} | ${formatCurrency(item.total_returned ?? 0)} | ${typeof item.roi === 'number' ? item.roi.toFixed(1) + '%' : '-'}`,
          )
          .join('\n');
        break;
      case 'parts':
        header = 'Nome | Numero | Estoque | Preco Unit. | Valor Total';
        rows = results
          .map(
            (item) =>
              `${item.name || '-'} | ${item.part_number || '-'} | ${formatNumber(item.quantity ?? item.stock_quantity ?? 0)} | ${formatCurrency(item.unit_price ?? item.price ?? 0)} | ${formatCurrency(item.total_value ?? 0)}`,
          )
          .join('\n');
        break;
    }

    const period =
      startDate || endDate
        ? `Periodo: ${startDate || '...'} a ${endDate || '...'}`
        : 'Periodo: Todos';

    const content = `RELATORIO - ${typeLabel.toUpperCase()}\n${period}\nTotal: ${results.length} registros\n\n${header}\n${'—'.repeat(40)}\n${rows}`;

    try {
      await Share.share({
        message: content,
        title: `Relatorio ${typeLabel}`,
      });
    } catch {
      // User cancelled share
    }
  }, [results, reportType, startDate, endDate]);

  const renderResults = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Gerando relatorio...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <EmptyState
            title="Erro ao gerar relatorio"
            description={error}
          />
        </View>
      );
    }

    if (hasGenerated && results.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <EmptyState
            title="Nenhum resultado"
            description="Nao foram encontrados dados para os filtros selecionados."
          />
        </View>
      );
    }

    if (!hasGenerated) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          Resultados ({formatNumber(results.length)})
        </Text>
        <WhiteSpace size="md" />
        {results.map((item, index) => {
          switch (reportType) {
            case 'vehicles':
              return renderVehicleItem(item, index);
            case 'sales':
              return renderSalesItem(item, index);
            case 'investors':
              return renderInvestorItem(item, index);
            case 'parts':
              return renderPartsItem(item, index);
            default:
              return null;
          }
        })}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Relatorios</Text>
      <Text style={styles.screenSubtitle}>Gere relatorios do sistema</Text>

      <WhiteSpace size="xl" />

      {/* Report Type Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de Relatorio</Text>
        <FilterChips
          options={REPORT_OPTIONS}
          value={reportType}
          onChange={setReportType}
        />
      </View>

      {/* Vehicle Status Filter */}
      {reportType === 'vehicles' && (
        <>
          <WhiteSpace size="lg" />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status do Veiculo</Text>
            <FilterChips
              options={VEHICLE_STATUS_FILTERS}
              value={vehicleStatus}
              onChange={setVehicleStatus}
            />
          </View>
        </>
      )}

      <WhiteSpace size="lg" />

      {/* Date Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Periodo</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Data Inicio</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Data Fim</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      <WhiteSpace size="lg" />

      {/* Generate Button */}
      <Button
        type="primary"
        onPress={handleGenerate}
        loading={loading}
        disabled={loading}
      >
        Gerar Relatorio
      </Button>

      {/* Export Button */}
      {hasGenerated && results.length > 0 && !loading && (
        <>
          <WhiteSpace size="md" />
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>Compartilhar Relatorio</Text>
          </TouchableOpacity>
        </>
      )}

      <WhiteSpace size="xl" />

      {/* Results */}
      {renderResults()}

      <WhiteSpace size="xl" />
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  screenTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    ...caption.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.sm,
    ...body.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center' as const,
  },
  loadingText: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    paddingVertical: spacing.lg,
  },
  resultsContainer: {
    marginTop: spacing.sm,
  },
  resultsTitle: {
    ...heading.h4,
    color: colors.textPrimary,
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
  cardTitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
  },
  cardLabel: {
    ...caption.md,
    color: colors.textSecondary,
  },
  cardValue: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
  },
  exportButtonText: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.accent,
  },
});
