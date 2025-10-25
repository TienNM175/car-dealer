import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  minPurchase?: number;
}

interface PromotionListProps {
  promotions: Promotion[];
  selectedPromotionId: string;
  onSelectPromotion: (promotionId: string) => void;
  disabled?: boolean;
}

export const PromotionList: React.FC<PromotionListProps> = ({
  promotions,
  selectedPromotionId,
  onSelectPromotion,
  disabled = false,
}) => {
  const formatVND = (v: number) =>
    v.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Ionicons name="pricetag" size={18} color="#2563eb" />
        <Text style={styles.sectionTitle}>Danh sách khuyến mãi</Text>
        <Text style={styles.sectionCount}>
          ({promotions.length} khuyến mãi)
        </Text>
      </View>
      
      {promotions.length === 0 ? (
        <Text style={styles.emptyText}>
          {disabled 
            ? 'Vui lòng chọn đại lý để xem khuyến mãi'
            : 'Đại lý này chưa có khuyến mãi nào'}
        </Text>
      ) : (
        <ScrollView style={styles.promotionList} nestedScrollEnabled>
          {promotions.map((promotion) => {
            const isSelected = selectedPromotionId === promotion.id;
            
            return (
              <TouchableOpacity
                key={promotion.id}
                style={[
                  styles.promotionItem,
                  isSelected && styles.promotionItemSelected,
                  disabled && styles.promotionItemDisabled,
                ]}
                onPress={() => !disabled && onSelectPromotion(promotion.id)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <View style={styles.promotionHeader}>
                  <View style={styles.promotionInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={styles.promotionName}>{promotion.name}</Text>
                      {promotion.isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Đang hoạt động</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.promotionDiscount}>
                      Giảm giá:{' '}
                      {promotion.discountType === 'PERCENTAGE'
                        ? `${promotion.discountValue}%`
                        : formatVND(Number(promotion.discountValue))}
                    </Text>
                    {promotion.minPurchase && (
                      <Text style={styles.promotionMinPurchase}>
                        Đơn tối thiểu: {formatVND(Number(promotion.minPurchase))}
                      </Text>
                    )}
                  </View>
                  
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                    )}
                    <Text style={styles.promotionType}>{promotion.discountType}</Text>
                  </View>
                </View>
                
                {promotion.description && (
                  <Text style={styles.promotionDescription}>
                    {promotion.description}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};