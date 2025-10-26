import { useState, useEffect, useCallback } from 'react';
import { promotionApi } from '../lib/api/promotionApi';
import { Alert } from 'react-native';

interface Dealer {
  id: string;
  name: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  dealerId: string;
  minPurchase?: number;
  dealer?: Dealer;
}

interface CalculateDiscountResponse {
  originalAmount: number;
  finalAmount: number;
  discountAmount: number;
  appliedPromotions: Array<{
    id: string;
    name: string;
    discountValue: number;
  }>;
}

export const usePricingLogic = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(1200000000);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPromoId, setSelectedPromoId] = useState<string>('');
  const [calculatedResult, setCalculatedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promotionApi.getAll({ isActive: true });
      const promotionData = response.data || [];
      setPromotions(promotionData);

      // Extract unique dealers
      const uniqueDealers = new Map<string, Dealer>();
      promotionData.forEach((p: any) => {
        if (p.dealer && !uniqueDealers.has(p.dealerId)) {
          uniqueDealers.set(p.dealerId, { id: p.dealerId, name: p.dealer.name });
        }
      });
      const dealerList = Array.from(uniqueDealers.values());
      setDealers(dealerList);

      // Auto-select first dealer if available
      if (dealerList.length > 0 && !selectedDealerId) {
        setSelectedDealerId(dealerList[0].id);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch promotions';
      setError(errorMessage);
      console.error('Error fetching promotions:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPromotions();
    setRefreshing(false);
  }, []);

  const handleSelectDealer = useCallback((dealerId: string) => {
    setSelectedDealerId(dealerId);
    setSelectedPromoId('');
    setCalculatedResult(null);
  }, []);

  const handleSelectPromotion = useCallback((promotionId: string) => {
    setSelectedPromoId(promotionId);
    setCalculatedResult(null);
  }, []);

  const handleCalculatePrice = useCallback(async () => {
    if (!selectedDealerId) {
      Alert.alert('Error', 'Please select a dealer first');
      return;
    }

    try {
      setCalculating(true);
      setError(null);

      const result = await promotionApi.calculateDiscount({
        dealerId: selectedDealerId,
        purchaseAmount: basePrice * quantity,
        promotionId: selectedPromoId || undefined,
      });

      setCalculatedResult(result);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to calculate discount';
      setError(errorMessage);
      console.error('Error calculating discount:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setCalculating(false);
    }
  }, [selectedDealerId, basePrice, quantity, selectedPromoId]);

  // Get promotions for selected dealer
  const dealerPromotions = promotions.filter(
    (p) => p.dealerId === selectedDealerId && p.isActive
  );

  // Get selected promotion details
  const selectedPromotion = dealerPromotions.find((p) => p.id === selectedPromoId) || null;

  // Local calculation for preview
  const localFinalPrice = (() => {
    if (!selectedPromotion) return basePrice * quantity;

    if (selectedPromotion.discountType === 'PERCENTAGE') {
      const discount = (Number(selectedPromotion.discountValue) / 100) * basePrice;
      return Math.max(0, (basePrice - discount) * quantity);
    }

    // FIXED
    const discounted = Math.max(0, basePrice - Number(selectedPromotion.discountValue));
    return discounted * quantity;
  })();

  const displayFinalPrice = calculatedResult?.finalAmount ?? localFinalPrice;
  const displayDiscount = calculatedResult
    ? calculatedResult.originalAmount - calculatedResult.finalAmount
    : basePrice * quantity - localFinalPrice;

  return {
    promotions,
    dealers,
    dealerPromotions,
    selectedDealerId,
    selectedPromoId,
    selectedPromotion,
    basePrice,
    quantity,
    calculatedResult,
    displayFinalPrice,
    displayDiscount,
    loading,
    calculating,
    refreshing,
    error,
    setBasePrice,
    setQuantity,
    handleSelectDealer,
    handleSelectPromotion,
    handleCalculatePrice,
    handleRefresh,
  };
};