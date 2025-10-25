// ai-insights.tsx
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet, // ⚠️ Cần import StyleSheet
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

import { AIInsightsTabs } from '@/components/ai-insights/AIInsightsTabs';
import ExecutiveSummaryTab from '@/components/ai-insights/ExecutiveSummaryTab';
import DealerPerformanceTab from '@/components/ai-insights/DealerPerformanceTab';
import MarketTrendsTab from '@/components/ai-insights/MarketTrendsTab';
import { styles } from '@/components/ai-insights/styles'; // ⚠️ styles từ styles.ts
import { useAIInsightsLogic } from '@/hooks/useAIInsightsLogic';

type TabType = 'executive' | 'dealer' | 'market';
type ExecutivePeriodType = 'daily' | 'weekly' | 'monthly';

// ⚠️ COMPONENT BUTTON MỚI SỬ DỤNG GIAO DIỆN ĐỒNG BỘ (Dựa trên DealerPerformanceTab)
function PeriodButtonExecutive({
  label,
  period,
  activePeriod,
  onPress,
  disabled,
}: {
  label: string;
  period: ExecutivePeriodType;
  activePeriod: ExecutivePeriodType;
  onPress: (period: ExecutivePeriodType) => void;
  disabled: boolean;
}) {
  const isActive = period === activePeriod;
  return (
    <TouchableOpacity
      style={[
        localStyles.timeframeBtn,
        isActive && localStyles.timeframeBtnActive,
        disabled && localStyles.timeframeBtnDisabled, // Thêm style disabled nếu cần
      ]}
      onPress={() => onPress(period)}
      disabled={disabled}
    >
      <Text
        style={[
          localStyles.timeframeBtnText,
          isActive && localStyles.timeframeBtnTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function AIInsightsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [refreshing, setRefreshing] = useState(false);
  const [executivePeriod, setExecutivePeriod] = useState<ExecutivePeriodType>('weekly');

  const {
    executiveSummary,
    dealerPerformance,
    marketTrends,
    loading,
    error,
    fetchExecutiveSummary,
    fetchDealerPerformance,
    fetchMarketTrends,
  } = useAIInsightsLogic();

  // Only admin can access
  if (user?.role !== 'ADMIN') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Bạn không có quyền truy cập tính năng này</Text>
        </View>
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'executive') {
        await fetchExecutiveSummary(executivePeriod);
      } else if (activeTab === 'dealer') {
        await fetchDealerPerformance('month');
      } else {
        await fetchMarketTrends();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const getCurrentData = () => {
    if (activeTab === 'executive') return executiveSummary;
    if (activeTab === 'dealer') return dealerPerformance;
    return marketTrends;
  };

  const handleGenerate = () => {
    if (activeTab === 'executive') {
      fetchExecutiveSummary(executivePeriod);
    } else if (activeTab === 'dealer') {
      fetchDealerPerformance('month');
    } else {
      fetchMarketTrends();
    }
  };
  
  const handlePeriodChange = (period: ExecutivePeriodType) => {
      setExecutivePeriod(period);
      // Tự động fetch dữ liệu mới nếu đã có báo cáo
      if (executiveSummary) {
          fetchExecutiveSummary(period);
      }
  };

  const currentData = getCurrentData();

  // ⚠️ RENDERER CHO CÁC NÚT CHỌN KHOẢNG THỜI GIAN
  const renderExecutivePeriodSelector = () => (
    <View style={localStyles.timeframeContainer}>
        <PeriodButtonExecutive
          label="Ngày"
          period="daily"
          activePeriod={executivePeriod}
          onPress={handlePeriodChange}
          disabled={loading}
        />
        <PeriodButtonExecutive
          label="Tuần"
          period="weekly"
          activePeriod={executivePeriod}
          onPress={handlePeriodChange}
          disabled={loading}
        />
        <PeriodButtonExecutive
          label="Tháng"
          period="monthly"
          activePeriod={executivePeriod}
          onPress={handlePeriodChange}
          disabled={loading}
        />
      </View>
  );

  return (
    <View style={styles.container}>
      <AIInsightsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {loading && activeTab === 'executive' ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>AI đang phân tích dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {activeTab === 'executive' && (
            <>
              {/* HIỂN THỊ NÚT CHỌN KHOẢNG THỜI GIAN LUÔN LUÔN */}
              {renderExecutivePeriodSelector()}

              {currentData ? (
                <ExecutiveSummaryTab
                  data={executiveSummary}
                  onRefresh={() => fetchExecutiveSummary(executivePeriod)}
                  loading={loading}
                />
              ) : (
                // TRẠNG THÁI RỖNG
                <View style={styles.emptyContainer}>
                  {/* Dùng một View để đẩy nội dung lên trên, nếu không ScrollView bị kéo dài */}
                  <View style={localStyles.emptyContentWrapper}> 
                    <Text style={styles.emptyStateTitle}>Chưa có dữ liệu phân tích</Text>
                    <Text style={styles.emptyStateText}>Nhấn nút bên dưới để tạo báo cáo AI cho khoảng thời gian đã chọn</Text>
                    <TouchableOpacity
                      style={styles.generateBtn}
                      onPress={handleGenerate}
                      disabled={loading}
                    >
                      <Text style={styles.generateBtnText}>Tạo phân tích</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'dealer' && (
            <DealerPerformanceTab
              data={dealerPerformance}
              onRefresh={(tf) => fetchDealerPerformance(tf)}
              loading={loading}
            />
          )}

          {activeTab === 'market' && (
            currentData ? (
              <MarketTrendsTab
                data={marketTrends}
                onRefresh={() => fetchMarketTrends()}
                loading={loading}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyStateTitle}>Chưa có dữ liệu phân tích</Text>
                <Text style={styles.emptyStateText}>Nhấn nút bên dưới để tạo báo cáo AI</Text>
                <TouchableOpacity
                  style={styles.generateBtn}
                  onPress={handleGenerate}
                >
                  <Text style={styles.generateBtnText}>Tạo phân tích</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ⚠️ STYLES MỚI ĐỒNG BỘ VỚI DealerPerformanceTab
const localStyles = StyleSheet.create({
  timeframeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12, // Căn chỉnh với padding của ScrollView/container
    marginTop: 12,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  timeframeBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  timeframeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  timeframeBtnTextActive: {
    color: '#fff',
  },
  timeframeBtnDisabled: {
      opacity: 0.7,
  },
  // Style hỗ trợ căn giữa nội dung rỗng sau khi thêm periodSelector
  emptyContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});