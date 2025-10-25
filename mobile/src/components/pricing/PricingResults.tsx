import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface CalculatedResult {
  originalAmount: number;
  finalAmount: number;
  discountAmount: number;
}

interface Promotion {
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}

interface PricingResultsProps {
  basePrice: number;
  quantity: number;
  displayFinalPrice: number;
  displayDiscount: number;
  selectedPromotion: Promotion | null;
  calculatedResult: CalculatedResult | null;
  selectedDealerId: string;
  calculating: boolean;
  onCalculate: () => void;
}

export const PricingResults: React.FC<PricingResultsProps> = ({
  basePrice,
  quantity,
  displayFinalPrice,
  displayDiscount,
  selectedPromotion,
  calculatedResult,
  selectedDealerId,
  calculating,
  onCalculate,
}) => {
  const formatVND = (v: number) =>
    v.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Kết quả tính toán</Text>
      
      {/* Price Before Discount */}
      <View style={[styles.resultCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
        <Text style={styles.resultLabel}>Giá trước giảm</Text>
        <Text style={styles.resultValue}>{formatVND(basePrice * quantity)}</Text>
      </View>

      {/* Discount Amount */}
      <View style={styles.discountCard}>
        <Text style={styles.resultLabel}>Giảm giá</Text>
        <Text style={styles.discountValue}>{formatVND(displayDiscount)}</Text>
      </View>

      {/* Applied Promotion */}
      <View style={styles.promotionCard}>
        <Text style={styles.resultLabel}>Khuyến mãi áp dụng</Text>
        <Text style={styles.promotionValue}>
          {selectedPromotion
            ? `${selectedPromotion.name} — ${
                selectedPromotion.discountType === 'PERCENTAGE'
                  ? `${selectedPromotion.discountValue}%`
                  : formatVND(Number(selectedPromotion.discountValue))
              }`
            : 'Không có'}
        </Text>
      </View>

      {/* Final Price */}
      <View style={styles.finalPriceCard}>
        <Text style={styles.finalPriceLabel}>Giá sau giảm</Text>
        <Text style={styles.finalPriceValue}>{formatVND(displayFinalPrice)}</Text>
        {calculatedResult && (
          <Text style={styles.confirmedText}>✓ Đã tính toán chính xác từ server</Text>
        )}
        {!calculatedResult && (
          <Text style={styles.estimateText}>
            Ước tính (nhấn "Tính giá chính xác" để xác nhận)
          </Text>
        )}
        
        {/* Payment Method */}
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={[styles.resultLabel, { marginBottom: 8 }]}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethod}>
            <Ionicons name="card" size={20} color="#111827" />
            <Text style={styles.paymentMethodText}>Tiền mặt / Chuyển khoản</Text>
          </View>
        </View>
      </View>

      {/* Calculate Button */}
      <TouchableOpacity
        style={[
          styles.calculateButton,
          (!selectedDealerId || calculating) && styles.calculateButtonDisabled,
        ]}
        onPress={onCalculate}
        disabled={!selectedDealerId || calculating}
        activeOpacity={0.8}
      >
        {calculating ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.calculateButtonText}>Đang tính...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={styles.calculateButtonText}>Tính giá chính xác</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};