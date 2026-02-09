import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { spacing, body, caption, heading, borderRadius } from '@/theme';
import { formatDate } from '@/utils/formatters';
import type { Vehicle } from '@/types';

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
}

interface Props {
  vehicle: Vehicle;
}

export function VehicleTimelineSection({ vehicle }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const EVENT_COLORS = useMemo(() => ({
    created: colors.accent,
    image: '#8b5cf6' as const,
    service: colors.warning,
    status: '#06b6d4' as const,
    sale: colors.success,
  }), [colors]);

  const events = useMemo(() => {
    const items: TimelineEvent[] = [];

    // Vehicle creation
    if (vehicle.created_at) {
      items.push({
        date: vehicle.created_at,
        title: 'Veiculo cadastrado',
        description: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        color: EVENT_COLORS.created,
        icon: '+',
      });
    }

    // Purchase date
    if (vehicle.purchase_date && vehicle.purchase_date !== vehicle.created_at) {
      items.push({
        date: vehicle.purchase_date,
        title: 'Data de compra',
        description: `Valor: R$ ${Number(vehicle.purchase_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        color: EVENT_COLORS.created,
        icon: '$',
      });
    }

    // Images uploaded
    if (vehicle.images && vehicle.images.length > 0) {
      const imagesByDate = new Map<string, number>();
      vehicle.images.forEach((img) => {
        if (img.uploaded_at) {
          const dateKey = img.uploaded_at.split('T')[0];
          imagesByDate.set(dateKey, (imagesByDate.get(dateKey) || 0) + 1);
        }
      });
      imagesByDate.forEach((count, dateKey) => {
        items.push({
          date: dateKey,
          title: 'Imagens adicionadas',
          description: `${count} imagem(ns) enviada(s)`,
          color: EVENT_COLORS.image,
          icon: '📷',
        });
      });
    }

    // Services
    if (vehicle.services && vehicle.services.length > 0) {
      vehicle.services.forEach((svc) => {
        items.push({
          date: svc.service_date || svc.created_at,
          title: svc.service.name,
          description: `Mecanico: ${svc.mechanic?.name || '-'} | Status: ${svc.status}`,
          color: EVENT_COLORS.service,
          icon: '🔧',
        });
      });
    }

    // Sale
    if (vehicle.sale_date) {
      items.push({
        date: vehicle.sale_date,
        title: 'Veiculo vendido',
        description: vehicle.sale_value
          ? `Valor: R$ ${Number(vehicle.sale_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : undefined,
        color: EVENT_COLORS.sale,
        icon: '✓',
      });
    }

    // Sort by date descending (most recent first)
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return items;
  }, [vehicle, EVENT_COLORS]);

  if (events.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Historico</Text>
      <View style={styles.card}>
        {events.map((event, index) => (
          <View key={`${event.date}-${index}`} style={styles.timelineItem}>
            {/* Timeline line */}
            <View style={styles.timelineLeft}>
              <View style={[styles.dot, { backgroundColor: event.color, minHeight: 28 }]}>
                <Text style={styles.dotIcon}>{event.icon}</Text>
              </View>
              {index < events.length - 1 && <View style={styles.line} />}
            </View>

            {/* Content */}
            <View style={styles.timelineContent}>
              <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}
            </View>
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
  sectionTitle: {
    ...heading.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000' as const,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row' as const,
    minHeight: 60,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center' as const,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  dotIcon: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700' as const,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  eventDate: {
    ...caption.sm,
    color: colors.textTertiary,
  },
  eventTitle: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginTop: 2,
  },
  eventDescription: {
    ...caption.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
