import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { mechanicApi } from '@/services/mechanicApi';
import { SearchBar, RefreshableList, LoadingScreen, EmptyState } from '@/components/ui';
import { VehicleCard } from '@/components/vehicles';
import { useRefreshOnFocus } from '@/hooks';
import { spacing, heading, body, caption, borderRadius } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import type { Colors } from '@/theme/colors';
import type { Vehicle } from '@/types';

export default function VehiclesScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const router = useRouter();

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
      <Text style={styles.screenTitle}>Meus Veiculos</Text>
      <Text style={styles.screenSubtitle}>Veiculos atribuidos a voce</Text>

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
      <View style={styles.container}>
        <EmptyState
          title="Erro ao carregar"
          description={error}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const createStyles = (colors: Colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxxl + spacing.xxl,
  },
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    ...heading.h2,
    color: colors.textPrimary,
  },
  screenSubtitle: {
    ...body.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    marginTop: spacing.lg,
  },
  cardWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});
