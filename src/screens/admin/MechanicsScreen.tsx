import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { adminApi } from '@/services/adminApi';
import { ScreenContainer } from '@/components/layout';
import { SearchBar, RefreshableList, EmptyState, LoadingScreen, Avatar, StatusTag } from '@/components/ui';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import { formatCurrency } from '@/utils/formatters';
import { useRefreshOnFocus, usePermissions } from '@/hooks';
import type { Mechanic, PaginatedResponse } from '@/types';

const PER_PAGE = 20;

export default function MechanicsScreen() {
  const router = useRouter();
  const { can } = usePermissions();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchMechanics = useCallback(
    async (pageNum: number, isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const params: Record<string, any> = { page: pageNum, per_page: PER_PAGE };
        if (search.trim()) params.search = search.trim();

        const response = await adminApi.getMechanics(params) as PaginatedResponse<Mechanic>;
        const data = response.data ?? [];
        const meta = response.meta;

        if (pageNum === 1) {
          setMechanics(data);
        } else {
          setMechanics((prev) => [...prev, ...data]);
        }

        setHasMore(meta ? meta.current_page < meta.last_page : false);
        setPage(pageNum);
      } catch (err: any) {
        console.error('Erro ao carregar mecanicos:', err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchMechanics(1);
  }, [fetchMechanics]);

  useRefreshOnFocus(
    useCallback(() => {
      fetchMechanics(1, true);
    }, [fetchMechanics]),
  );

  const handleRefresh = useCallback(() => {
    fetchMechanics(1, true);
  }, [fetchMechanics]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      fetchMechanics(page + 1);
    }
  }, [hasMore, loading, refreshing, page, fetchMechanics]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Mechanic }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/(admin)/mechanics/${item.uuid}`)}
      >
        <View style={styles.cardRow}>
          <Avatar name={item.name} size={48} />
          <View style={styles.cardContent}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.specialty ? (
              <View style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{item.specialty}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Taxa Horaria</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {item.hourly_rate ? formatCurrency(item.hourly_rate) : '-'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [router, styles, colors],
  );

  if (loading && mechanics.length === 0) {
    return <LoadingScreen message="Carregando mecanicos..." />;
  }

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.title}>Mecanicos</Text>
      <Text style={styles.subtitle}>Gerencie os mecanicos cadastrados</Text>
      <SearchBar
        value={search}
        onChangeText={handleSearch}
        placeholder="Buscar mecanico..."
      />
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.container}>
        <RefreshableList
          data={mechanics}
          renderItem={renderItem}
          keyExtractor={(item) => item.uuid}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleEndReached}
          hasMore={hasMore}
          ListHeaderComponent={listHeader}
          emptyTitle="Nenhum mecanico encontrado"
          emptyDescription="Nao ha mecanicos cadastrados."
          contentContainerStyle={styles.listContent}
        />
      </View>
      {can('mechanics.create') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(admin)/mechanics/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  fab: {
    position: 'absolute' as const,
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300' as const,
    marginTop: -2,
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
  cardRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardName: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  specialtyTag: {
    backgroundColor: '#f9f0ff',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start' as const,
    marginTop: spacing.xs,
  },
  specialtyText: {
    ...caption.sm,
    color: '#722ed1',
    fontWeight: '600' as const,
  },
  cardStats: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statLabel: {
    ...caption.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...body.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
});
