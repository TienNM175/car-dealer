// ============================================
// 3. src/screens/VehicleDetailScreen.tsx
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Loading } from '../components/common/Loading';
import { ErrorView } from '../components/common/ErrorView';
import { vehicleApi } from '../api/vehicles';
import { Vehicle } from '../types/vehicle';
import {
  formatPrice,
  formatRange,
  formatBattery,
  formatPower,
  formatNumber,
} from '../utils/formatters';
import { COLORS } from '../constants/config';
import { RootStackParamList } from '../navigation/RootNavigator';

const { width } = Dimensions.get('window');

type VehicleDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VehicleDetail'>;
type VehicleDetailScreenRouteProp = RouteProp<RootStackParamList, 'VehicleDetail'>;

interface Props {
  navigation: VehicleDetailScreenNavigationProp;
  route: VehicleDetailScreenRouteProp;
}

export const VehicleDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadVehicle();
  }, [route.params.vehicleId]);

  const loadVehicle = async () => {
    try {
      setError(null);
      const response = await vehicleApi.getVehicleById(route.params.vehicleId);
      setVehicle(response.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin xe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Đang tải thông tin xe..." />;
  }

  if (error || !vehicle) {
    return <ErrorView message={error || 'Không tìm thấy xe'} onRetry={loadVehicle} />;
  }

  const images = vehicle.images.length > 0 ? vehicle.images : [];
  const totalAvailable = vehicle.dealerInventories?.reduce((sum, inv) => sum + inv.available, 0) || 0;

  return (
    <View style={detailStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={detailStyles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.url }}
                style={detailStyles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={detailStyles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  detailStyles.dot,
                  index === currentImageIndex && detailStyles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={detailStyles.content}>
          <View style={detailStyles.header}>
            <View>
              <Text style={detailStyles.brand}>{vehicle.manufacturer.name}</Text>
              <Text style={detailStyles.model}>
                {vehicle.model} {vehicle.variant}
              </Text>
            </View>
            <View style={detailStyles.badge}>
              <Text style={detailStyles.badgeText}>{vehicle.year}</Text>
            </View>
          </View>

          <Text style={detailStyles.price}>
            {formatPrice(vehicle.retailPrice, vehicle.currency)}
          </Text>

          {/* Specifications */}
          <View style={detailStyles.section}>
            <Text style={detailStyles.sectionTitle}>Thông số kỹ thuật</Text>
            <View style={detailStyles.specGrid}>
              <SpecItem icon="battery-charging" label="Pin" value={formatBattery(vehicle.batteryCapacity)} />
              <SpecItem icon="speedometer" label="Quãng đường" value={formatRange(vehicle.range)} />
              <SpecItem icon="flash" label="Công suất" value={vehicle.motorPower ? formatPower(vehicle.motorPower) : 'N/A'} />
              <SpecItem icon="timer" label="Sạc nhanh" value={vehicle.chargingTime ? `${vehicle.chargingTime}p` : 'N/A'} />
              <SpecItem icon="people" label="Số chỗ" value={`${vehicle.seats} chỗ`} />
              <SpecItem icon="car" label="Kiểu dáng" value={vehicle.bodyType} />
            </View>
          </View>

          {/* Description */}
          {vehicle.description && (
            <View style={detailStyles.section}>
              <Text style={detailStyles.sectionTitle}>Mô tả</Text>
              <Text style={detailStyles.description}>{vehicle.description}</Text>
            </View>
          )}

          {/* Availability */}
          <View style={detailStyles.section}>
            <Text style={detailStyles.sectionTitle}>Tình trạng</Text>
            <View style={detailStyles.availability}>
              <Ionicons
                name={totalAvailable > 0 ? 'checkmark-circle' : 'alert-circle'}
                size={24}
                color={totalAvailable > 0 ? COLORS.success : COLORS.warning}
              />
              <Text style={detailStyles.availabilityText}>
                {totalAvailable > 0
                  ? `Có sẵn tại ${vehicle.dealerInventories?.length} đại lý`
                  : 'Liên hệ để biết thêm chi tiết'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={detailStyles.actions}>
        <TouchableOpacity
          style={detailStyles.secondaryButton}
          onPress={() => navigation.navigate('DealerList', { vehicleId: vehicle.id })}
        >
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <Text style={detailStyles.secondaryButtonText}>Xem đại lý</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={detailStyles.primaryButton}
          onPress={() => navigation.navigate('TestDrive', { vehicleId: vehicle.id })}
        >
          <Ionicons name="car-sport" size={20} color="#FFFFFF" />
          <Text style={detailStyles.primaryButtonText}>Đặt lái thử</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SpecItem: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={detailStyles.specItem}>
    <Ionicons name={icon as any} size={24} color={COLORS.primary} />
    <Text style={detailStyles.specLabel}>{label}</Text>
    <Text style={detailStyles.specValue}>{value}</Text>
  </View>
);

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gallery: {
    height: 300,
    backgroundColor: COLORS.card,
  },
  image: {
    width,
    height: 300,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  model: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  badge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    width: (width - 48) / 3,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  availability: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  availabilityText: {
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});