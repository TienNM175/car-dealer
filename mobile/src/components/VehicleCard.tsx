// ============================================
// Enhanced src/components/VehicleCard.tsx
// ============================================
import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../types/vehicle';
import { formatPrice, formatRange, formatBattery } from '../utils/formatters';
import { COLORS } from '../constants/config';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const mainImage = vehicle.images.find((img) => img.isMain) || vehicle.images[0];

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        {/* Image Section */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: mainImage?.url || 'https://via.placeholder.com/400x300' }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />

          {/* Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{vehicle.year}</Text>
            </View>
          </View>

          {/* Rating/Featured Badge */}
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.featuredText}>Nổi bật</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.brand}>{vehicle.manufacturer.name}</Text>
              <Text style={styles.model} numberOfLines={2}>
                {vehicle.model} {vehicle.variant}
              </Text>
            </View>
          </View>

          {/* Specifications Grid */}
          <View style={styles.specs}>
            <SpecBadge
              icon="battery-charging"
              label={formatBattery(vehicle.batteryCapacity)}
            />
            <SpecBadge
              icon="speedometer"
              label={formatRange(vehicle.range)}
            />
            <SpecBadge
              icon="people"
              label={`${vehicle.seats} chỗ`}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Từ</Text>
              <Text style={styles.price}>
                {formatPrice(vehicle.retailPrice, vehicle.currency)}
              </Text>
            </View>

            <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
              <Text style={styles.ctaButtonText}>Xem ngay</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface SpecBadgeProps {
  icon: string;
  label: string;
}

const SpecBadge: React.FC<SpecBadgeProps> = ({ icon, label }) => (
  <View style={styles.specBadge}>
    <Ionicons name={icon as any} size={14} color={COLORS.primary} />
    <Text style={styles.specBadgeText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  touchable: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badge: {
    backgroundColor: 'rgba(25, 118, 210, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleSection: {
    marginBottom: 8,
  },
  brand: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  model: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  specs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  specBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});