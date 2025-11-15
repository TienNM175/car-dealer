// ============================================
// Enhanced HomeScreen with Better Contract Lookup UI
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width } = Dimensions.get('window');

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

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
    return <Loading message="Khởi động EVM..." />;
  }

  if (error && !refreshing) {
    return <ErrorView message={error} onRetry={loadData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Hero Section */}
      <Animated.View
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#1976D2', '#1565C0', '#0D47A1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Ionicons name="flash" size={48} color="#FFD700" style={styles.heroIcon} />
            <Text style={styles.heroTitle}>EVM</Text>
            <Text style={styles.heroSubtitle}>Electric Vehicle Market</Text>
            <Text style={styles.heroDescription}>
              Khám phá tương lai giao thông xanh
            </Text>

            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>Xe</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>100+</Text>
                <Text style={styles.statLabel}>Đại lý</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Hỗ trợ</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroWave}>
            <Text style={styles.waveEmoji}>⚡</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Contract Lookup - Featured Action */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.primaryActionCard}
          onPress={() => navigation.navigate('ContractLookup')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF5252']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryActionGradient}
          >
            <View style={styles.primaryActionLeft}>
              <View style={styles.primaryActionIcon}>
                <Ionicons name="document-text-outline" size={40} color="#FFFFFF" />
              </View>
              <View style={styles.primaryActionTextWrapper}>
                <Text style={styles.primaryActionTitle}>Tra cứu hợp đồng</Text>
                <Text style={styles.primaryActionSubtitle}>
                  Kiểm tra công nợ & lịch thanh toán
                </Text>
              </View>
            </View>
            <View style={styles.primaryActionArrow}>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchWrapper}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm xe điện yêu thích..."
          onSubmit={handleSearch}
        />
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterList}>
          <FilterButton
            icon="flash"
            label="Tất cả"
            onPress={() => navigation.navigate('VehicleList', {})}
          />
          <FilterButton
            icon="pulse"
            label="Xe Hot"
            onPress={() => navigation.navigate('VehicleList', {})}
          />
          <FilterButton
            icon="trending-up"
            label="Giá Rẻ"
            onPress={() => navigation.navigate('VehicleList', {})}
          />
          <FilterButton
            icon="car-sport"
            label="SUV"
            onPress={() => navigation.navigate('VehicleList', { bodyType: 'SUV' })}
          />
        </ScrollView>
      </View>

      {/* Manufacturers Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Các Hãng Xe</Text>
            <Text style={styles.sectionSubtitle}>Hàng đầu toàn cầu</Text>
          </View>
          <View style={styles.sectionBadge}>
            <Text style={styles.badgeText}>{manufacturers.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
          scrollEventThrottle={16}
        >
          {manufacturers.map((manufacturer, index) => (
            <ManufacturerCard
              key={manufacturer.id}
              manufacturer={manufacturer}
              index={index}
              onPress={() =>
                navigation.navigate('VehicleList', { manufacturerId: manufacturer.id })
              }
            />
          ))}
        </ScrollView>
      </View>

      {/* Featured Vehicles Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Xe Nổi Bật</Text>
            <Text style={styles.sectionSubtitle}>Sản phẩm mới nhất</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('VehicleList', {})}>
            <Text style={styles.seeAll}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        {vehicles.map((vehicle, index) => (
          <VehicleCardWithAnimation
            key={vehicle.id}
            vehicle={vehicle}
            index={index}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
          />
        ))}
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>Tại sao chọn EVM?</Text>

        <BenefitItem
          icon="leaf"
          title="Thân Thiện Môi Trường"
          description="Giảm khí thải, bảo vệ trái đất"
          color="#4CAF50"
        />
        <BenefitItem
          icon="flash-outline"
          title="Công Nghệ Tiên Tiến"
          description="Pin dung lượng cao, sạc nhanh"
          color="#FFC107"
        />
        <BenefitItem
          icon="wallet"
          title="Tiết Kiệm Chi Phí"
          description="Giá điện rẻ, bảo hành toàn diện"
          color="#2196F3"
        />
        <BenefitItem
          icon="checkmark-circle"
          title="Hỗ Trợ Tận Tình"
          description="Đội ngũ chuyên nghiệp 24/7"
          color="#9C27B0"
        />
      </View>

      {/* CTA Section - Test Drive */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={['#A06CD5', '#9B5DD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaGradient}
        >
          <Ionicons name="speedometer-outline" size={40} color="#FFFFFF" style={{ marginBottom: 12 }} />
          <Text style={styles.ctaTitle}>Sẵn Sàng Lái Thử?</Text>
          <Text style={styles.ctaDescription}>
            Đặt lịch lái thử xe của bạn ngay hôm nay
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('VehicleList', {})}
          >
            <Text style={styles.ctaButtonText}>Khám Phá Ngay</Text>
            <Ionicons name="arrow-forward" size={20} color="#A06CD5" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

// ============================================
// Helper Components
// ============================================

interface FilterButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ icon, label, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.filterButton}
      >
        <Ionicons name={icon as any} size={20} color={COLORS.primary} />
        <Text style={styles.filterLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ManufacturerCardProps {
  manufacturer: Manufacturer;
  index: number;
  onPress: () => void;
}

const ManufacturerCard: React.FC<ManufacturerCardProps> = ({
  manufacturer,
  index,
  onPress,
}) => {
  const translateAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.timing(translateAnim, {
      toValue: 0,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX: translateAnim }] }}>
      <TouchableOpacity
        style={styles.manufacturerCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primary + 'DD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.manufacturerGradient}
        >
          <View style={styles.manufacturerIcon}>
            <Ionicons name="car-sport" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.manufacturerName} numberOfLines={1}>
            {manufacturer.name}
          </Text>
          <Text style={styles.manufacturerCountry}>{manufacturer.country}</Text>
          <View style={styles.arrowIcon}>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface VehicleCardWithAnimationProps {
  vehicle: Vehicle;
  index: number;
  onPress: () => void;
}

const VehicleCardWithAnimation: React.FC<VehicleCardWithAnimationProps> = ({
  vehicle,
  index,
  onPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <VehicleCard vehicle={vehicle} onPress={onPress} />
    </Animated.View>
  );
};

interface BenefitItemProps {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({
  icon,
  title,
  description,
  color,
}) => (
  <View style={styles.benefitItem}>
    <View style={[styles.benefitIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={28} color={color} />
    </View>
    <View style={styles.benefitContent}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
  </View>
);

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  heroSection: {
    marginBottom: 20,
  },
  heroGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  heroDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 12,
    opacity: 0.85,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroWave: {
    position: 'absolute',
    right: 20,
    top: 20,
    fontSize: 64,
    opacity: 0.1,
  },
  waveEmoji: {
    fontSize: 80,
  },

  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: -16,
  },
  primaryActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryActionGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryActionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  primaryActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionTextWrapper: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  primaryActionSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  primaryActionArrow: {
    marginLeft: 8,
  },

  searchWrapper: {
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  quickFilters: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  filterList: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
  },
  filterLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  categoryList: {
    marginLeft: -16,
    paddingLeft: 16,
  },
  manufacturerCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  manufacturerGradient: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  manufacturerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  manufacturerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  manufacturerCountry: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  arrowIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
    opacity: 0.6,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  benefitIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  benefitDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ctaSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  ctaGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ctaDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A06CD5',
  },
  footer: {
    height: 20,
  },
});