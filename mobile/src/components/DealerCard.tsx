// ============================================
// 5. src/components/DealerCard.tsx
// ============================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dealer } from '../types/dealer';
import { COLORS } from '../constants/config';

interface DealerCardProps {
  dealer: Dealer;
  onSelect?: (dealer: Dealer) => void;
  showAvailability?: boolean;
  isSelected?: boolean;
}

export const DealerCard: React.FC<DealerCardProps> = ({
  dealer,
  onSelect,
  showAvailability = true,
  isSelected = false,
}) => {
  const handleCall = () => {
    if (dealer.phone) {
      Linking.openURL(`tel:${dealer.phone}`);
    }
  };

  const handlePress = () => {
    if (onSelect) {
      onSelect(dealer);
    }
  };

  const available = dealer.inventories?.[0]?.available || 0;

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onSelect}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="business" size={24} color={COLORS.primary} />
          <View style={styles.headerText}>
            <Text style={styles.name}>{dealer.name}</Text>
            <Text style={styles.code}>{dealer.code}</Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{dealer.address || dealer.city}</Text>
        </View>

        {dealer.phone && (
          <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
            <Ionicons name="call" size={16} color={COLORS.primary} />
            <Text style={[styles.infoText, styles.phone]}>{dealer.phone}</Text>
          </TouchableOpacity>
        )}

        {dealer.region && (
          <View style={styles.infoRow}>
            <Ionicons name="map" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{dealer.region.name}</Text>
          </View>
        )}
      </View>

      {showAvailability && (
        <View style={styles.footer}>
          <View style={[styles.badge, available > 0 ? styles.badgeSuccess : styles.badgeWarning]}>
            <Ionicons
              name={available > 0 ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={available > 0 ? COLORS.success : COLORS.warning}
            />
            <Text style={styles.badgeText}>
              {available > 0 ? `Còn ${available} xe` : 'Hết xe'}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  code: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  info: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  phone: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSuccess: {
    backgroundColor: COLORS.success + '20',
  },
  badgeWarning: {
    backgroundColor: COLORS.warning + '20',
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});
