import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, WhiteSpace } from '@ant-design/react-native';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { LoadingScreen, EmptyState, ConfirmModal } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import { usePermissions } from '@/hooks';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';

interface StockMovement {
  id: number;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  reason?: string;
  reference?: string;
  created_at: string;
}

interface Part {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  part_number?: string;
  brand_id?: string;
  brand?: { id: string; name: string };
  unit_price: number;
  stock_quantity: number;
  min_stock: number;
  category_id?: string;
  category?: { id: string; name: string; color?: string };
  stock_movements?: StockMovement[];
}

export default function PartDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { can } = usePermissions();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const infoRowStylesThemed = useThemeStyles(createInfoRowStyles);

  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete state
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPart = useCallback(async () => {
    if (!uuid) return;
    try {
      setError(null);
      const data = await adminApi.getPart(uuid);
      setPart(data.data || data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao carregar peca';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchPart();
  }, [fetchPart]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPart();
  }, [fetchPart]);

  const handleDelete = useCallback(async () => {
    if (!part) return;
    setDeleting(true);
    try {
      await adminApi.deletePart(part.uuid);
      setDeleteVisible(false);
      Alert.alert('Sucesso', 'Peca excluida com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao excluir peca';
      Alert.alert('Erro', message);
    } finally {
      setDeleting(false);
    }
  }, [part, router]);

  if (loading) {
    return <LoadingScreen message="Carregando peca..." />;
  }

  if (error) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  if (!part) {
    return (
      <ScreenContainer>
        <EmptyState title="Peca nao encontrada" description="Nao foi possivel encontrar esta peca." />
      </ScreenContainer>
    );
  }

  const isLowStock = part.stock_quantity <= part.min_stock;

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={handleRefresh}>
      {/* Header */}
      <Text style={styles.screenTitle}>{part.name}</Text>
      {part.description ? (
        <Text style={styles.description}>{part.description}</Text>
      ) : null}

      <WhiteSpace size="xl" />

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacoes</Text>
        <View style={styles.card}>
          <InfoRow label="Nome" value={part.name} styles={infoRowStylesThemed} />
          {part.description ? (
            <InfoRow label="Descricao" value={part.description} styles={infoRowStylesThemed} />
          ) : null}
          {part.part_number ? (
            <InfoRow label="Numero da Peca" value={part.part_number} styles={infoRowStylesThemed} />
          ) : null}
          {part.brand?.name ? (
            <InfoRow label="Marca" value={part.brand.name} styles={infoRowStylesThemed} />
          ) : null}
          {part.category?.name ? (
            <InfoRow label="Categoria" value={part.category.name} styles={infoRowStylesThemed} />
          ) : null}
          <InfoRow label="Preco Unitario" value={formatCurrency(part.unit_price)} highlight styles={infoRowStylesThemed} />
        </View>
      </View>

      <WhiteSpace size="lg" />

      {/* Stock Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estoque</Text>
        <View style={styles.card}>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Estoque Atual</Text>
            <View style={[styles.stockIndicator, isLowStock ? styles.stockLow : styles.stockOk]}>
              <Text style={[styles.stockValue, isLowStock ? styles.stockValueLow : styles.stockValueOk]}>
                {part.stock_quantity}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Estoque Minimo</Text>
            <Text style={styles.stockMinValue}>{part.min_stock}</Text>
          </View>

          {isLowStock && (
            <>
              <View style={styles.divider} />
              <View style={styles.lowStockAlert}>
                <Text style={styles.lowStockAlertText}>
                  Estoque abaixo do minimo! Necessario reabastecer.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Stock Movements */}
      {part.stock_movements && part.stock_movements.length > 0 && (
        <>
          <WhiteSpace size="lg" />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movimentacoes de Estoque</Text>
            <View style={styles.card}>
              {part.stock_movements.map((movement, index) => (
                <View
                  key={movement.id || index}
                  style={[
                    styles.movementItem,
                    index < part.stock_movements!.length - 1 && styles.movementItemBorder,
                  ]}
                >
                  <View style={styles.movementHeader}>
                    <View style={styles.movementTypeRow}>
                      <View
                        style={[
                          styles.movementBadge,
                          movement.type === 'entry' && styles.movementBadgeEntry,
                          movement.type === 'exit' && styles.movementBadgeExit,
                          movement.type === 'adjustment' && styles.movementBadgeAdjust,
                        ]}
                      >
                        <Text
                          style={[
                            styles.movementBadgeText,
                            movement.type === 'entry' && styles.movementBadgeTextEntry,
                            movement.type === 'exit' && styles.movementBadgeTextExit,
                            movement.type === 'adjustment' && styles.movementBadgeTextAdjust,
                          ]}
                        >
                          {movement.type === 'entry' ? 'Entrada' : movement.type === 'exit' ? 'Saida' : 'Ajuste'}
                        </Text>
                      </View>
                      <Text style={styles.movementDate}>
                        {formatDate(movement.created_at)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.movementQty,
                        movement.type === 'entry' ? styles.movementQtyEntry : styles.movementQtyExit,
                      ]}
                    >
                      {movement.type === 'entry' ? '+' : movement.type === 'exit' ? '-' : ''}{formatNumber(movement.quantity)}
                    </Text>
                  </View>
                  {movement.reason && (
                    <Text style={styles.movementReason} numberOfLines={2}>
                      {movement.reason}
                    </Text>
                  )}
                  {movement.reference && (
                    <Text style={styles.movementRef}>Ref: {movement.reference}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <WhiteSpace size="xl" />

      {/* Edit Button */}
      {can('parts.update') && (
        <Button
          type="primary"
          onPress={() => router.push(`/(admin)/parts/edit/${uuid}` as any)}
          style={{ borderRadius: borderRadius.md, marginBottom: spacing.md }}
        >
          Editar Peca
        </Button>
      )}

      {/* Delete Button */}
      {can('parts.delete') && (
        <Button type="warning" onPress={() => setDeleteVisible(true)}>
          Excluir Peca
        </Button>
      )}

      <WhiteSpace size="xl" />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        visible={deleteVisible}
        title="Excluir Peca"
        message={`Deseja realmente excluir a peca "${part.name}"?`}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </ScreenContainer>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
  styles,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  styles: ReturnType<typeof createInfoRowStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const createInfoRowStyles = (colors: Colors) => ({
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: {
    ...caption.md,
    color: colors.textTertiary,
    flex: 1,
  },
  value: {
    ...body.md,
    color: colors.textPrimary,
    flex: 2,
    textAlign: 'right' as const,
  },
  valueHighlight: {
    fontWeight: '600' as const,
    color: colors.accent,
  },
});

const createStyles = (colors: Colors) => ({
  screenTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  description: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.sm,
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
  stockRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
  },
  stockLabel: {
    ...body.md,
    color: colors.textSecondary,
  },
  stockIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 48,
    alignItems: 'center' as const,
  },
  stockLow: {
    backgroundColor: '#fff1f0',
  },
  stockOk: {
    backgroundColor: '#f6ffed',
  },
  stockValue: {
    ...heading.h4,
    fontWeight: '700' as const,
  },
  stockValueLow: {
    color: colors.error,
  },
  stockValueOk: {
    color: colors.success,
  },
  stockMinValue: {
    ...body.md,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  lowStockAlert: {
    backgroundColor: '#fff1f0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  lowStockAlertText: {
    ...body.sm,
    color: colors.error,
    fontWeight: '500' as const,
  },
  movementItem: {
    paddingVertical: spacing.sm,
  },
  movementItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
  },
  movementHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  movementTypeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  movementBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  movementBadgeEntry: {
    backgroundColor: '#f6ffed',
  },
  movementBadgeExit: {
    backgroundColor: '#fff1f0',
  },
  movementBadgeAdjust: {
    backgroundColor: '#e6f7ff',
  },
  movementBadgeText: {
    ...caption.sm,
    fontWeight: '600' as const,
  },
  movementBadgeTextEntry: {
    color: colors.success,
  },
  movementBadgeTextExit: {
    color: colors.error,
  },
  movementBadgeTextAdjust: {
    color: colors.info,
  },
  movementDate: {
    ...caption.sm,
    color: colors.textTertiary,
  },
  movementQty: {
    ...body.md,
    fontWeight: '700' as const,
  },
  movementQtyEntry: {
    color: colors.success,
  },
  movementQtyExit: {
    color: colors.error,
  },
  movementReason: {
    ...caption.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  movementRef: {
    ...caption.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
