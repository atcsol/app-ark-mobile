import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sellerApi } from '@/services/sellerApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, StatusTag } from '@/components/ui';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/formatters';
import type { Sale } from '@/types';

export default function SaleDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSale = useCallback(async () => {
    try {
      setError(null);
      const response = await sellerApi.getSale(uuid!);
      setSale(response);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar venda';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    if (uuid) {
      fetchSale();
    }
  }, [fetchSale, uuid]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSale();
  }, [fetchSale]);

  // Helper component for detail rows
  const InfoRow = ({
    label,
    value,
    valueColor,
    isLast = false,
  }: {
    label: string;
    value: string;
    valueColor?: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor } : null]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingScreen message="Carregando venda..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!sale) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Venda nao encontrada"
          description="A venda solicitada nao existe."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      <Text style={styles.pageTitle}>Detalhes da Venda</Text>
      <View style={styles.statusRow}>
        <StatusTag status={sale.status} />
      </View>

      {/* Vehicle Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Veiculo</Text>
        <View style={styles.card}>
          <InfoRow label="Veiculo" value={sale.vehicle.full_name} />
          <InfoRow label="VIN" value={sale.vehicle.vin_number} isLast />
        </View>
      </View>

      {/* Buyer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comprador</Text>
        <View style={styles.card}>
          <InfoRow label="Nome" value={sale.buyer_name} />
          {sale.buyer_email && (
            <InfoRow label="Email" value={sale.buyer_email} />
          )}
          {sale.buyer_phone && (
            <InfoRow label="Telefone" value={sale.buyer_phone} />
          )}
          {sale.buyer_cpf_cnpj && (
            <InfoRow label="CPF/CNPJ" value={sale.buyer_cpf_cnpj} isLast />
          )}
          {!sale.buyer_email && !sale.buyer_phone && !sale.buyer_cpf_cnpj && (
            <View />
          )}
        </View>
      </View>

      {/* Financial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financeiro</Text>
        <View style={styles.card}>
          <InfoRow
            label="Valor da Venda"
            value={formatCurrency(sale.sale_value)}
            valueColor={colors.accent}
          />
          <InfoRow
            label="Comissao (%)"
            value={formatPercentage(sale.commission_percentage)}
          />
          <InfoRow
            label="Valor Comissao"
            value={formatCurrency(sale.commission_amount)}
            valueColor={colors.success}
            isLast
          />
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datas</Text>
        <View style={styles.card}>
          <InfoRow label="Data da Venda" value={formatDate(sale.sale_date)} />
          <InfoRow label="Criado em" value={formatDate(sale.created_at)} />
          <InfoRow label="Atualizado em" value={formatDate(sale.updated_at)} isLast />
        </View>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  pageTitle: {
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
});
