// mobile/src/components/ai-insights/MarketTrendsTab.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';

interface MarketTrendsData {
  aiAnalysis?: {
    marketSummary: string;
    growthTrends?: {
      direction: string;
      rate: string;
      drivers?: string[];
    };
    vehiclePreferences?: {
      trending: string[];
      declining: string[];
      reasons: string;
    };
    customerBehavior?: {
      buyingPatterns: string;
      paymentPreferences: string;
      decisionFactors: string[];
    };
    opportunities?: Array<{
      opportunity: string;
      marketSize: string;
      actionPlan: string;
      timeline: string;
    }>;
    forecastNext3Months?: {
      salesVolume: string;
      revenue: string;
      topProducts: string[];
      confidence: string;
    };
  };
  marketData?: {
    topVehicles?: Array<{
      vehicleName: string;
      sales: number;
      price: number;
    }>;
  };
}

interface MarketTrendsTabProps {
  data: MarketTrendsData | null;
  onRefresh: () => void;
  loading: boolean;
}

export default function MarketTrendsTab({
  data,
  onRefresh,
  loading,
}: MarketTrendsTabProps) {
  if (!data) {
    return null;
  }

  const { aiAnalysis, marketData } = data;

  return (
    <View style={styles.container}>
      {/* AI Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.summaryTitle}>Phân tích Thị trường</Text>
        </View>
        <Text style={styles.summaryText}>
          {aiAnalysis?.marketSummary}
        </Text>
      </View>

      {/* Growth Trends */}
      {aiAnalysis?.growthTrends && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="trending-up" size={18} color="#10b981" />
            <Text style={styles.sectionTitle}>Xu hướng tăng trưởng</Text>
          </View>
          
          <View style={styles.trendsCard}>
            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Hướng</Text>
              <Text style={styles.trendValue}>
                {aiAnalysis.growthTrends.direction === 'UP' ? '📈 Tăng' : '📉 Giảm'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.trendItem}>
              <Text style={styles.trendLabel}>Tốc độ</Text>
              <Text style={styles.trendValue}>{aiAnalysis.growthTrends.rate}</Text>
            </View>
          </View>

          {aiAnalysis.growthTrends.drivers && (
            <View style={styles.driversBox}>
              <Text style={styles.driversTitle}>Động lực chính</Text>
              {aiAnalysis.growthTrends.drivers.map((driver, idx) => (
                <View key={idx} style={styles.driverItem}>
                  <Text style={styles.driverBullet}>→</Text>
                  <Text style={styles.driverText}>{driver}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Top Vehicles */}
      {marketData?.topVehicles && marketData.topVehicles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="car-sport" size={18} color="#2563eb" />
            <Text style={styles.sectionTitle}>Xe bán chạy nhất</Text>
          </View>

          {marketData.topVehicles.map((vehicle, idx) => (
            <View key={idx} style={styles.vehicleCard}>
              <View style={styles.vehicleRank}>
                <Text style={styles.vehicleRankText}>#{idx + 1}</Text>
              </View>

              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicle.vehicleName}</Text>
                <Text style={styles.vehiclePrice}>
                  {(vehicle.price / 1000000000).toFixed(1)} tỷ VNĐ
                </Text>
              </View>

              <View style={styles.vehicleSales}>
                <Text style={styles.vehicleSalesValue}>{vehicle.sales}</Text>
                <Text style={styles.vehicleSalesLabel}>xe</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Vehicle Preferences */}
      {aiAnalysis?.vehiclePreferences && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xu hướng sở thích xe</Text>

          {/* Trending */}
          <View style={styles.preferenceBox}>
            <View style={styles.preferenceHeader}>
              <Ionicons name="arrow-up" size={16} color="#10b981" />
              <Text style={styles.preferenceTitle}>Đang thịnh hành</Text>
            </View>
            {aiAnalysis.vehiclePreferences.trending.map((item, idx) => (
              <Text key={idx} style={styles.preferenceItem}>
                ▲ {item}
              </Text>
            ))}
          </View>

          {/* Declining */}
          <View style={styles.preferenceBox}>
            <View style={styles.preferenceHeader}>
              <Ionicons name="arrow-down" size={16} color="#ef4444" />
              <Text style={styles.preferenceTitle}>Giảm nhu cầu</Text>
            </View>
            {aiAnalysis.vehiclePreferences.declining.map((item, idx) => (
              <Text key={idx} style={styles.preferenceItem}>
                ▼ {item}
              </Text>
            ))}
          </View>

          {aiAnalysis.vehiclePreferences.reasons && (
            <View style={styles.reasonsBox}>
              <Text style={styles.reasonsLabel}>Nguyên nhân:</Text>
              <Text style={styles.reasonsText}>
                {aiAnalysis.vehiclePreferences.reasons}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Customer Behavior */}
      {aiAnalysis?.customerBehavior && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="people" size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Hành vi khách hàng</Text>
          </View>

          <View style={styles.behaviorBox}>
            <Text style={styles.behaviorLabel}>Mẫu hình mua hàng</Text>
            <Text style={styles.behaviorValue}>
              {aiAnalysis.customerBehavior.buyingPatterns}
            </Text>
          </View>

          <View style={styles.behaviorBox}>
            <Text style={styles.behaviorLabel}>Thanh toán ưa chuộng</Text>
            <Text style={styles.behaviorValue}>
              {aiAnalysis.customerBehavior.paymentPreferences}
            </Text>
          </View>

          {aiAnalysis.customerBehavior.decisionFactors && (
            <View style={styles.behaviorBox}>
              <Text style={styles.behaviorLabel}>Yếu tố quyết định chính</Text>
              {aiAnalysis.customerBehavior.decisionFactors.map((factor, idx) => (
                <View key={idx} style={styles.factorItem}>
                  <Text style={styles.factorNumber}>{idx + 1}</Text>
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 3-Month Forecast */}
      {aiAnalysis?.forecastNext3Months && (
        <View style={styles.section}>
          <View style={styles.forecastHeader}>
            <FontAwesome5  name="crystal-ball" size={18} color="#fff" />
            <Text style={styles.forecastTitle}>Dự báo 3 tháng tới</Text>
          </View>

          <View style={styles.forecastGrid}>
            <View style={styles.forecastCard}>
              <Text style={styles.forecastLabel}>Sản lượng bán</Text>
              <Text style={styles.forecastValue}>
                {aiAnalysis.forecastNext3Months.salesVolume?.split('(')[0]}
              </Text>
            </View>

            <View style={styles.forecastCard}>
              <Text style={styles.forecastLabel}>Doanh thu</Text>
              <Text style={styles.forecastValue}>
                {aiAnalysis.forecastNext3Months.revenue}
              </Text>
            </View>

            <View style={styles.forecastCard}>
              <Text style={styles.forecastLabel}>Độ tin cậy</Text>
              <Text style={styles.forecastValue}>
                {aiAnalysis.forecastNext3Months.confidence}
              </Text>
            </View>
          </View>

          {aiAnalysis.forecastNext3Months.topProducts && (
            <View style={styles.topProductsBox}>
              <Text style={styles.topProductsLabel}>Xe bán chạy dự kiến</Text>
              <View style={styles.productTags}>
                {aiAnalysis.forecastNext3Months.topProducts.map((product, idx) => (
                  <View key={idx} style={styles.productTag}>
                    <Text style={styles.productTagText}>{product}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Opportunities */}
      {aiAnalysis?.opportunities && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="bulb" size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Cơ hội chiến lược</Text>
          </View>

          {aiAnalysis.opportunities.map((opp, idx) => (
            <View key={idx} style={styles.opportunityCard}>
              <Text style={styles.opportunityTitle}>{opp.opportunity}</Text>

              <View style={styles.opportunityDetails}>
                <View style={styles.oppDetailItem}>
                  <Text style={styles.oppDetailLabel}>Quy mô</Text>
                  <Text style={styles.oppDetailValue}>{opp.marketSize}</Text>
                </View>
                <View style={styles.oppDetailItem}>
                  <Text style={styles.oppDetailLabel}>Timeline</Text>
                  <Text style={styles.oppDetailValue}>{opp.timeline}</Text>
                </View>
              </View>

              <View style={styles.oppPlanBox}>
                <Text style={styles.oppPlanLabel}>Kế hoạch:</Text>
                <Text style={styles.oppPlanText}>{opp.actionPlan}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    paddingTop: 0,  // XÓA PADDING TOP
    paddingBottom: 24,
  },
  refreshBtn: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refreshBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    marginTop: 12,  // THÊM MARGIN TOP CHO SUMMARYCARD
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  summaryText: {
    fontSize: 13,
    color: '#dcfce7',
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  trendsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  trendItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  trendLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  driversBox: {
    marginTop: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
  },
  driversTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 6,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  driverBullet: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  driverText: {
    fontSize: 11,
    color: '#15803d',
    flex: 1,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vehicleRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  vehiclePrice: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  vehicleSales: {
    alignItems: 'flex-end',
  },
  vehicleSalesValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  vehicleSalesLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  preferenceBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  preferenceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  preferenceItem: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  reasonsBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  reasonsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  reasonsText: {
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 16,
  },
  behaviorBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  behaviorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  behaviorValue: {
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 16,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  factorNumber: {
    backgroundColor: '#fde68a',
    color: '#92400e',
    fontSize: 11,
    fontWeight: '700',
    width: 18,
    height: 18,
    textAlign: 'center',
    borderRadius: 9,
  },
  factorText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  forecastHeader: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  forecastTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  forecastCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  topProductsBox: {
    marginTop: 12,
  },
  topProductsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productTag: {
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  productTagText: {
    fontSize: 11,
    color: '#1e40af',
  },
  opportunityCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 10,
  },
  opportunityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  opportunityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  oppDetailItem: {
    flex: 1,
  },
  oppDetailLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  oppDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  oppPlanBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  oppPlanLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  oppPlanText: {
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 16,
  },
});