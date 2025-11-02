// ============================================
// 2. src/screens/VehicleListScreen.tsx
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { VehicleCard } from '../components/VehicleCard';
import { SearchBar } from '../components/common/SearchBar';
import { Loading } from '../components/common/Loading';
import { ErrorView } from '../components/common/ErrorView';
import { vehicleApi, VehicleFilters } from '../api/vehicles';
import { Vehicle } from '../types/vehicle';
import { COLORS } from '../constants/config';
import { RootStackParamList } from '../navigation/RootNavigator';

type VehicleListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VehicleList'>;
type VehicleListScreenRouteProp = RouteProp<RootStackParamList, 'VehicleList'>;

interface Props {
  navigation: VehicleListScreenNavigationProp;
  route: VehicleListScreenRouteProp;
}

export const VehicleListScreen: React.FC<Props> = ({ navigation, route }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(route.params?.search || '');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const filters: VehicleFilters = {
    search: searchQuery || route.params?.search,
    manufacturerId: route.params?.manufacturerId,
    bodyType: route.params?.bodyType,
  };

  useEffect(() => {
    loadVehicles(1);
  }, [route.params]);

  const loadVehicles = async (pageNumber: number, append: boolean = false) => {
    try {
      setError(null);
      const response = await vehicleApi.getVehicles({ ...filters, page: pageNumber, limit: 10 });

      if (append) {
        setVehicles((prev) => [...prev, ...response.data]);
      } else {
        setVehicles(response.data);
      }

      setHasMore(response.meta.page < response.meta.totalPages);
      setPage(pageNumber);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách xe');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadVehicles(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadVehicles(page + 1, true);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    loadVehicles(1);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={vehicleListStyles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (loading && !refreshing) {
    return <Loading message="Đang tải danh sách xe..." />;
  }

  if (error && !refreshing && vehicles.length === 0) {
    return <ErrorView message={error} onRetry={() => loadVehicles(1)} />;
  }

  return (
    <View style={vehicleListStyles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Tìm kiếm xe..."
        onSubmit={handleSearch}
      />

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={vehicleListStyles.listContent}
      />
    </View>
  );
};

const vehicleListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});