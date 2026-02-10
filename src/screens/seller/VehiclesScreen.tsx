import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { sellerApi } from '@/services/sellerApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState } from '@/components/ui';
import { VehicleCard } from '@/components/vehicles';
import { useRefreshOnFocus, useAdaptiveLayout } from '@/hooks';
import { spacing, body, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Vehicle, PaginatedResponse } from '@/types';

type TabType = 'available' | 'sold';

export default function VehiclesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();
  const { listContentStyle } = useAdaptiveLayout();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [error, setError] = useState<string | null>(null);

  const isLoadingMore = useRef(false);

  const fetchVehicles = useCallback(
    async (pageNum: number, isRefresh: boolean = false) => {
      try {
        setError(null);
        const params: Record<string, any> = {
          page: pageNum,
          search: search || undefined,
        };

        const fetcher =
          activeTab === 'available'
            ? sellerApi.getAvailableVehicles
            : sellerApi.getSoldVehicles;

        const response: PaginatedResponse<Vehicle> = await fetcher(params);

        if (isRefresh || pageNum === 1) {
          setVehicles(response.data);
        } else {
          setVehicles((prev) => [...prev, ...response.data]);
        }

        setHasMore(response.meta.current_page < response.meta.last_page);
      } catch (err: any) {
        const message =
          err.response?.data?.message || err.message || 'Erro ao carregar veiculos';
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        isLoadingMore.current = false;
      }
    },
    [search, activeTab],
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchVehicles(1, true);
  }, [fetchVehicles]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchVehicles(1, true);
  }, [fetchVehicles]);

  useRefreshOnFocus(handleRefresh);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore.current || !hasMore) return;
    isLoadingMore.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVehicles(nextPage, false);
  }, [page, hasMore, fetchVehicles]);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      router.push(`/(seller)/vehicles/${vehicle.uuid}`);
    },
    [router],
  );

  const handleRegisterSale = useCallback(() => {
    router.push('/(seller)/sales/register');
  }, [router]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ScreenHeader title="Veiculos" subtitle="Veiculos disponiveis e vendidos" />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => handleTabChange('available')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}
          >
            Disponiveis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sold' && styles.tabActive]}
          onPress={() => handleTabChange('sold')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'sold' && styles.tabTextActive]}>
            Vendidos
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar por marca, modelo ou VIN..."
        />
      </View>
    </View>
  );

  if (loading && vehicles.length === 0) {
    return <LoadingScreen message="Carregando veiculos..." />;
  }

  if (error && vehicles.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="Erro ao carregar" description={error} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={vehicles}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VehicleCard vehicle={item} onPress={handleVehiclePress} />
          </View>
        )}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        hasMore={hasMore}
        loading={loading}
        ListHeaderComponent={renderHeader()}
        emptyTitle={
          activeTab === 'available'
            ? 'Nenhum veiculo disponivel'
            : 'Nenhum veiculo vendido'
        }
        emptyDescription={
          activeTab === 'available'
            ? 'Nao ha veiculos disponiveis para venda no momento.'
            : 'Nenhum veiculo vendido foi encontrado.'
        }
        contentContainerStyle={listContentStyle}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleRegisterSale}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  headerContainer: {
    paddingBottom: spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row' as const,
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center' as const,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    ...body.md,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  searchContainer: {
    marginTop: spacing.md,
  },
  cardWrapper: {
    paddingBottom: spacing.md,
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
