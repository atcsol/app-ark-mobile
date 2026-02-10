import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { adminApi } from '@/services/adminApi';
import { SearchBar, RefreshableList, EmptyState, LoadingScreen, Avatar, FilterChips } from '@/components/ui';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { usePermissions, useRefreshOnFocus, useAdaptiveLayout } from '@/hooks';
import { heading, body, caption, spacing, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { AdminUser, PaginatedResponse } from '@/types';

const PER_PAGE = 20;

const ROLE_FILTERS: { label: string; value: string }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Usuario', value: 'user' },
];

function getRoleTagColor(roleName: string, colors: Colors): { bg: string; text: string } {
  switch (roleName) {
    case 'super-admin':
      return { bg: '#fff1f0', text: colors.error };
    case 'admin':
      return { bg: '#f0f0ff', text: colors.accent };
    default:
      return { bg: '#e6f7ff', text: colors.info };
  }
}

export default function UsersScreen() {
  const router = useRouter();
  const { can } = usePermissions();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { listContentStyle } = useAdaptiveLayout();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const isLoadingMore = useRef(false);

  const fetchUsers = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      try {
        setError(null);
        const params: Record<string, any> = {
          page: pageNum,
          per_page: PER_PAGE,
        };
        if (search.trim()) params.search = search.trim();
        if (roleFilter !== 'all') params.role = roleFilter;

        const response = (await adminApi.getUsers(params)) as PaginatedResponse<AdminUser>;
        const data = response.data ?? [];
        const meta = response.meta;

        if (isRefresh || pageNum === 1) {
          setUsers(data);
        } else {
          setUsers((prev) => [...prev, ...data]);
        }

        setHasMore(meta ? meta.current_page < meta.last_page : false);
        setPage(pageNum);
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Erro ao carregar usuarios';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isLoadingMore.current = false;
      }
    },
    [search, roleFilter],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchUsers(1, true);
  }, [fetchUsers]);

  useRefreshOnFocus(
    useCallback(() => {
      fetchUsers(1, true);
    }, [fetchUsers]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchUsers(1, true);
  }, [fetchUsers]);

  const handleEndReached = useCallback(() => {
    if (isLoadingMore.current || !hasMore || loading || refreshing) return;
    isLoadingMore.current = true;
    const nextPage = page + 1;
    fetchUsers(nextPage, false);
  }, [page, hasMore, loading, refreshing, fetchUsers]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleRoleFilter = useCallback((role: string) => {
    setRoleFilter(role);
  }, []);

  const handleUserPress = useCallback(
    (user: AdminUser) => {
      router.push(`/(admin)/users/${user.uuid}`);
    },
    [router],
  );

  const handleCreate = useCallback(() => {
    router.push('/(admin)/users/create' as any);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: AdminUser }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleUserPress(item)}
      >
        <View style={styles.cardRow}>
          <Avatar
            name={item.name}
            imageUrl={item.avatar?.url}
            size={48}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardNameRow}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.deleted_at && (
                <View style={styles.deletedBadge}>
                  <Text style={styles.deletedBadgeText}>Excluido</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>

        {item.roles && item.roles.length > 0 && (
          <View style={styles.rolesRow}>
            {item.roles.map((role) => {
              const tagColor = getRoleTagColor(role.name, colors);
              return (
                <View
                  key={role.id}
                  style={[styles.roleTag, { backgroundColor: tagColor.bg }]}
                >
                  <Text style={[styles.roleTagText, { color: tagColor.text }]}>
                    {role.name}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    ),
    [handleUserPress, styles, colors],
  );

  if (loading && users.length === 0) {
    return <LoadingScreen message="Carregando usuarios..." />;
  }

  if (error && users.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  const listHeader = (
    <View style={styles.headerContainer}>
      <ScreenHeader title="Usuarios" subtitle="Gerencie os usuarios do sistema" />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar por nome ou email..."
        />
      </View>

      <View style={styles.filtersRow}>
        <FilterChips
          options={ROLE_FILTERS}
          value={roleFilter}
          onChange={handleRoleFilter}
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        hasMore={hasMore}
        ListHeaderComponent={listHeader}
        emptyTitle="Nenhum usuario encontrado"
        emptyDescription="Nao ha usuarios que correspondam aos filtros selecionados."
        contentContainerStyle={listContentStyle}
      />

      {can('users.create') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  headerContainer: {
    paddingBottom: spacing.xl,
  },
  searchContainer: {
    marginTop: spacing.lg,
  },
  filtersRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    marginTop: spacing.md,
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
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  cardName: {
    ...body.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
  },
  deletedBadge: {
    backgroundColor: '#fff1f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  deletedBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.error,
  },
  cardEmail: {
    ...caption.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rolesRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  roleTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleTagText: {
    ...caption.md,
    fontWeight: '600' as const,
  },
  fab: {
    position: 'absolute' as const,
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    lineHeight: 30,
    color: colors.white,
    fontWeight: '300' as const,
  },
});
