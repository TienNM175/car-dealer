// ============================================
// 1. src/screens/DealerListScreen.tsx
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { DealerCard } from '../components/DealerCard';
import { Loading } from '../components/common/Loading';
import { ErrorView } from '../components/common/ErrorView';
import { dealerApi } from '../api/dealers';
import { Dealer } from '../types/dealer';
import { COLORS } from '../constants/config';
import { RootStackParamList } from '../navigation/RootNavigator';

type DealerListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DealerList'>;
type DealerListScreenRouteProp = RouteProp<RootStackParamList, 'DealerList'>;

interface Props {
  navigation: DealerListScreenNavigationProp;
  route: DealerListScreenRouteProp;
}

export const DealerListScreen: React.FC<Props> = ({ navigation, route }) => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { vehicleId } = route.params;

  useEffect(() => {
    loadDealers();
  }, [vehicleId]);

  const loadDealers = async () => {
    try {
      setError(null);
      const response = await dealerApi.getDealersWithVehicle(vehicleId);
      setDealers(response.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đại lý');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDealers();
  };

  const handleSelectDealer = (dealer: Dealer) => {
    navigation.navigate('TestDrive', {
      vehicleId,
      dealerId: dealer.id,
    });
  };

  if (loading && !refreshing) {
    return <Loading message="Đang tải danh sách đại lý..." />;
  }

  if (error && !refreshing && dealers.length === 0) {
    return <ErrorView message={error} onRetry={loadDealers} />;
  }

  return (
    <View style={styles.container}>
      {dealers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có đại lý nào có sẵn xe này</Text>
        </View>
      ) : (
        <FlatList
          data={dealers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DealerCard
              dealer={item}
              onSelect={handleSelectDealer}
              showAvailability={true}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerText}>
                Tìm thấy {dealers.length} đại lý có xe này
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 16,
  },
  header: {
    padding: 16,
  },
  headerText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});