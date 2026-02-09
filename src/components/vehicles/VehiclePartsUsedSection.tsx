import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, body, caption, heading, borderRadius } from '@/theme';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { Vehicle, VehicleService, PartUsage } from '@/types';

interface Props {
  vehicle: Vehicle;
}

interface AggregatedPart {
  partId: number;
  name: string;
  partNumber?: string;
  totalQuantity: number;
  unitPrice: number;
  totalPrice: number;
  services: string[];
}

export function VehiclePartsUsedSection({ vehicle }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const aggregated = useMemo(() => {
    if (!vehicle.services || vehicle.services.length === 0) return [];

    const partMap = new Map<number, AggregatedPart>();

    vehicle.services.forEach((svc: VehicleService) => {
      if (!svc.parts || svc.parts.length === 0) return;

      svc.parts.forEach((pu: PartUsage) => {
        const existing = partMap.get(pu.part.id);
        if (existing) {
          existing.totalQuantity += pu.quantity;
          existing.totalPrice += pu.total_price;
          if (!existing.services.includes(svc.service.name)) {
            existing.services.push(svc.service.name);
          }
        } else {
          partMap.set(pu.part.id, {
            partId: pu.part.id,
            name: pu.part.name,
            partNumber: pu.part.part_number,
            totalQuantity: pu.quantity,
            unitPrice: pu.unit_price,
            totalPrice: pu.total_price,
            services: [svc.service.name],
          });
        }
      });
    });

    return Array.from(partMap.values()).sort((a, b) => b.totalPrice - a.totalPrice);
  }, [vehicle.services]);

  if (aggregated.length === 0) return null;

  const totalCost = aggregated.reduce((sum, p) => sum + p.totalPrice, 0);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Pecas Utilizadas</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{formatCurrency(totalCost)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        {aggregated.map((part, index) => (
          <View
            key={part.partId}
            style={[
              styles.partItem,
              index < aggregated.length - 1 && styles.partItemBorder,
            ]}
          >
            <View style={styles.partHeader}>
              <Text style={styles.partName} numberOfLines={1}>
                {part.name}
              </Text>
              <Text style={styles.partTotal}>{formatCurrency(part.totalPrice)}</Text>
            </View>

            <View style={styles.partDetails}>
              {part.partNumber && (
                <Text style={styles.partDetail}>#{part.partNumber}</Text>
              )}
              <Text style={styles.partDetail}>
                {formatNumber(part.totalQuantity)} un x {formatCurrency(part.unitPrice)}
              </Text>
            </View>

            {part.services.length > 0 && (
              <View style={styles.servicesRow}>
                {part.services.map((svcName) => (
                  <View key={svcName} style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>{svcName}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  section: {
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
  },
  totalBadge: {
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  totalBadgeText: {
    ...caption.md,
    fontWeight: '700' as const,
    color: colors.accent,
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
  partItem: {
    paddingVertical: spacing.sm,
  },
  partItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
  },
  partHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  partName: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  partTotal: {
    ...body.sm,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  partDetails: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  partDetail: {
    ...caption.md,
    color: colors.textSecondary,
  },
  servicesRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  serviceTag: {
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  serviceTagText: {
    ...caption.sm,
    color: colors.warning,
    fontWeight: '500' as const,
  },
});
