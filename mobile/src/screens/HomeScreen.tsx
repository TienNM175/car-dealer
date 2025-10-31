// ============================================
// 1. src/screens/HomeScreen.tsx
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { VehicleCard } from '../components/VehicleCard';
import { SearchBar } from '../components/common/SearchBar';
import { Loading } from '../components/common/Loading';
import { ErrorView } from '../components/common/ErrorView';
import { vehicleApi } from '../api/vehicles';
import { manufacturerApi } from '../api/manufacturers';
import { Vehicle, Manufacturer } from '../types/vehicle';
import { COLORS } from '../constants/config';
import { RootStackParamList } from '../navigation/RootNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [vehiclesResponse, manufacturersResponse] = await Promise.all([
        vehicleApi.getVehicles({ limit: 6 }),
        manufacturerApi.getAll(),
      ]);

      setVehicles(vehiclesResponse.data);
      setManufacturers(manufacturersResponse.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('VehicleList', { search: searchQuery });
    }
  };

  if (loading) {
    return <Loading message="Đang tải dữ liệu..." />;
  }

  if (error && !refreshing) {
    return <ErrorView message={error} onRetry={loadData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào! 👋</Text>
          <Text style={styles.title}>Khám phá xe điện EVM</Text>
        </View>
      </View>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Tìm kiếm xe..."
        onSubmit={handleSearch}
      />

      {/* Manufacturers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hãng xe</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
          {manufacturers.map((manufacturer) => (
            <TouchableOpacity
              key={manufacturer.id}
              style={styles.categoryCard}
              onPress={() =>
                navigation.navigate('VehicleList', { manufacturerId: manufacturer.id })
              }
            >
              <View style={styles.categoryIcon}>
                <Ionicons name="car-sport" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.categoryName}>{manufacturer.name}</Text>
              <Text style={styles.categoryCountry}>{manufacturer.country}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Vehicles */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Xe nổi bật</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VehicleList', {})}>
            <Text style={styles.seeAll}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
          />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('VehicleList', {})}
        >
          <Ionicons name="car" size={32} color={COLORS.primary} />
          <Text style={styles.actionTitle}>Tất cả xe</Text>
          <Text style={styles.actionSubtitle}>Xem danh sách đầy đủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('VehicleList', { bodyType: 'SUV' })}
        >
          <Ionicons name="compass" size={32} color={COLORS.primary} />
          <Text style={styles.actionTitle}>SUV</Text>
          <Text style={styles.actionSubtitle}>Xe thể thao đa dụng</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryList: {
    paddingLeft: 16,
  },
  categoryCard: {
    width: 120,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  categoryCountry: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});