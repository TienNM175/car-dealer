import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text } from 'react-native';
import { PricingForm } from '../../src/components/pricing/PricingForm';
import { PricingResults } from '../../src/components/pricing/PricingResults';
import { PromotionList } from '../../src/components/pricing/PromotionList';
import { usePricingLogic } from '../../src/hooks/usePricingLogic';

export default function PricingScreen() {
  const {
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
  } = usePricingLogic();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PricingForm
          dealers={dealers}
          promotions={dealerPromotions}
          selectedDealerId={selectedDealerId}
          selectedPromoId={selectedPromoId}
          basePrice={basePrice}
          quantity={quantity}
          onSelectDealer={handleSelectDealer}
          onSelectPromotion={handleSelectPromotion}
          onChangeBasePrice={setBasePrice}
          onChangeQuantity={setQuantity}
          loading={loading}
        />

        <PromotionList
          promotions={dealerPromotions}
          selectedPromotionId={selectedPromoId}
          onSelectPromotion={handleSelectPromotion}
          disabled={!selectedDealerId}
        />

        <PricingResults
          basePrice={basePrice}
          quantity={quantity}
          displayFinalPrice={displayFinalPrice}
          displayDiscount={displayDiscount}
          selectedPromotion={selectedPromotion}
          calculatedResult={calculatedResult}
          selectedDealerId={selectedDealerId}
          calculating={calculating}
          onCalculate={handleCalculatePrice}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
});