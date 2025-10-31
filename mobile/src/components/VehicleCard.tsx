// ============================================
// 4. src/components/VehicleCard.tsx
// ============================================
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../types/vehicle';
import { formatPrice, formatRange, formatBattery } from '../utils/formatters';
import { COLORS } from '../constants/config';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onPress }) => {
  const mainImage = vehicle.images.find((img) => img.isMain) || vehicle.images[0];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: mainImage?.url || 'https://via.placeholder.com/400x300' }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>{vehicle.manufacturer.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{vehicle.year}</Text>
          </View>
        </View>

        <Text style={styles.model} numberOfLines={1}>
          {vehicle.model} {vehicle.variant}
        </Text>

        <View style={styles.specs}>
          <View style={styles.specItem}>
            <Ionicons name="battery-charging" size={16} color={COLORS.primary} />
            <Text style={styles.specText}>{formatBattery(vehicle.batteryCapacity)}</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="speedometer" size={16} color={COLORS.primary} />
            <Text style={styles.specText}>{formatRange(vehicle.range)}</Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="people" size={16} color={COLORS.primary} />
            <Text style={styles.specText}>{vehicle.seats} chỗ</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(vehicle.retailPrice, vehicle.currency)}</Text>
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>Xem chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.border,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  model: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  specs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  specText: {
    marginLeft: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});