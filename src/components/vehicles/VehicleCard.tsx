import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { FallbackImage } from '@/components/ui';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import type { Vehicle } from '@/types';

interface Props {
  vehicle: Vehicle;
  onPress: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, onPress }: Props) {
  const styles = useThemeStyles(createStyles);
  const primaryImage = vehicle.images?.find((img) => img.is_primary) || vehicle.images?.[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(vehicle)}
      activeOpacity={0.7}
    >
      {primaryImage && (
        <FallbackImage
          uri={primaryImage.thumbnail || primaryImage.url}
          fallbackUri={primaryImage.url}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {vehicle.brand_name || vehicle.brand?.name || ''} {vehicle.model} {vehicle.year}
            </Text>
            <VehicleStatusBadge status={vehicle.status} small />
          </View>
          <Text style={styles.vin} numberOfLines={1}>
            VIN: {vehicle.vin_number}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(vehicle.purchase_value)}</Text>
          {vehicle.color && (
            <Text style={styles.color}>{vehicle.color}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden' as const,
  },
  thumbnail: {
    width: '100%' as const,
    height: 160,
    backgroundColor: colors.gray100,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  title: {
    ...heading.h4,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  vin: {
    ...caption.md,
    color: colors.textTertiary,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  price: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  color: {
    ...caption.md,
    color: colors.textSecondary,
  },
});
