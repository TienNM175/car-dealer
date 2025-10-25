import React from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { styles } from './styles';

interface Dealer {
  id: string;
  name: string;
}

interface Promotion {
  id: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}

interface PricingFormProps {
  dealers: Dealer[];
  promotions: Promotion[];
  selectedDealerId: string;
  selectedPromoId: string;
  basePrice: number;
  quantity: number;
  onSelectDealer: (dealerId: string) => void;
  onSelectPromotion: (promoId: string) => void;
  onChangeBasePrice: (price: number) => void;
  onChangeQuantity: (qty: number) => void;
  loading: boolean;
}

export const PricingForm: React.FC<PricingFormProps> = ({
  dealers,
  promotions,
  selectedDealerId,
  selectedPromoId,
  basePrice,
  quantity,
  onSelectDealer,
  onSelectPromotion,
  onChangeBasePrice,
  onChangeQuantity,
  loading,
}) => {
  const formatVND = (v: number) =>
    v.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Chi tiết giá</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          {/* Dealer Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chọn đại lý</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedDealerId}
                onValueChange={(value) => onSelectDealer(value)}
                style={styles.picker}
              >
                <Picker.Item label="-- Chọn đại lý --" value="" />
                {dealers.map((dealer) => (
                  <Picker.Item key={dealer.id} label={dealer.name} value={dealer.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Base Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giá gốc (VND)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={basePrice.toString()}
              onChangeText={(text) => onChangeBasePrice(Number(text) || 0)}
            />
          </View>

          {/* Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số lượng</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={quantity.toString()}
              onChangeText={(text) => onChangeQuantity(Math.max(1, Number(text) || 1))}
            />
          </View>

          {/* Promotion Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chọn khuyến mãi</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedPromoId}
                onValueChange={(value) => onSelectPromotion(value)}
                enabled={!!selectedDealerId}
                style={styles.picker}
              >
                <Picker.Item label="Không áp dụng" value="" />
                {promotions.map((promo) => (
                  <Picker.Item
                    key={promo.id}
                    label={`${promo.name} (${
                      promo.discountType === 'PERCENTAGE'
                        ? `${promo.discountValue}%`
                        : formatVND(Number(promo.discountValue))
                    })`}
                    value={promo.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </>
      )}
    </View>
  );
};