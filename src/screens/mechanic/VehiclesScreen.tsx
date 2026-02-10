import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { mechanicApi } from '@/services/mechanicApi';
import { ScreenContainer, ScreenHeader } from '@/components/layout';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState } from '@/components/ui';
import { VehicleCard } from '@/components/vehicles';
import { useRefreshOnFocus, useAdaptiveLayout } from '@/hooks';
import { spacing } from '@/theme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Vehicle } from '@/types';

export default function VehiclesScreen() {
  const styles = useThemeStyles(createStyles);
  const router = useRouter();
  const { listContentStyle } = useAdaptiveLayout();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setError(null);
      const response = await mechanicApi.getMyVehicles();
      const data = response.data || response;
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao carregar veiculos';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
  }, [fetchVehicles]);

  useRefreshOnFocus(handleRefresh);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleVehiclePress = useCallback(
    (vehicle: Vehicle) => {
      router.push(`/(mechanic)/vehicles/${vehicle.uuid}`);
    },
    [router],
  );

  const filteredVehicles = vehicles.filter((v) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      v.brand?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.full_name?.toLowerCase().includes(term) ||
      v.vin_number?.toLowerCase().includes(term)
    );
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <ScreenHeader title="Meus Veiculos" subtitle="Veiculos atribuidos a voce" />

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
        <EmptyState
          title="Erro ao carregar"
          description={error}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <RefreshableList
        data={filteredVehicles}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VehicleCard vehicle={item} onPress={handleVehiclePress} />
          </View>
        )}
        keyExtractor={(item) => item.uuid}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={renderHeader()}
        emptyTitle="Nenhum veiculo encontrado"
        emptyDescription="Nao ha veiculos atribuidos a voce."
        contentContainerStyle={listContentStyle}
      />
    </ScreenContainer>
  );
}

const createStyles = (colors: Colors) => ({
  headerContainer: {
    paddingBottom: spacing.md,
  },
  searchContainer: {
    marginTop: spacing.lg,
  },
  cardWrapper: {
    paddingBottom: spacing.md,
  },
});
