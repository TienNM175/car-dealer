// mobile/src/components/ai-insights/DealerPerformanceTab.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DealerPerformanceResponse } from '@/hooks/useAIInsightsLogic';

interface DealerPerformanceTabProps {
  data: DealerPerformanceResponse | null;
  onRefresh: (timeframe: 'month' | 'quarter' | 'year') => void;
  loading: boolean;
}

export default function DealerPerformanceTab({
  data,
  onRefresh,
  loading,
}: DealerPerformanceTabProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');

  const handleTimeframeChange = (timeframe: 'month' | 'quarter' | 'year') => {
    setSelectedTimeframe(timeframe);
    onRefresh(timeframe);
  };

  if (!data) {
    return (
      <View style={styles.container}>
        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          {(['month', 'quarter', 'year'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeframeBtn,
                selectedTimeframe === t && styles.timeframeBtnActive,
              ]}
              onPress={() => handleTimeframeChange(t)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.timeframeBtnText,
                  selectedTimeframe === t && styles.timeframeBtnTextActive,
                ]}
              >
                {t === 'month' ? 'Tháng' : t === 'quarter' ? 'Quý' : 'Năm'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nhấn nút trên để tạo phân tích</Text>
        </View>
      </View>
    );
  }

  const { aiAnalysis } = data;

  return (
    <ScrollView style={styles.container}>
      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {(['month', 'quarter', 'year'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.timeframeBtn,
              selectedTimeframe === t && styles.timeframeBtnActive,
            ]}
            onPress={() => handleTimeframeChange(t)}
            disabled={loading}
          >
            <Text
              style={[
                styles.timeframeBtnText,
                selectedTimeframe === t && styles.timeframeBtnTextActive,
              ]}
            >
              {t === 'month' ? 'Tháng' : t === 'quarter' ? 'Quý' : 'Năm'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.summaryTitle}>Phân tích Hiệu suất</Text>
        </View>
        <Text style={styles.summaryText}>
          {aiAnalysis?.overallPerformance}
        </Text>
      </View>

      {/* Dealer Rankings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Xếp hạng đại lý</Text>
        {(aiAnalysis?.ranking || []).map((dealer, idx) => (
          <DealerRankCard key={dealer.dealerId} dealer={dealer} />
        ))}
      </View>

      {/* Best Practices */}
      <View style={styles.section}>
        <View style={styles.subsectionHeader}>
          <Ionicons name="star" size={18} color="#f59e0b" />
          <Text style={styles.subsectionTitle}>Thực hành tốt nhất</Text>
        </View>
        {(aiAnalysis?.bestPractices || []).map((practice, idx) => (
          <View key={idx} style={styles.listItem}>
            <Text style={styles.bulletYellow}>★</Text>
            <Text style={styles.itemText}>{practice}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function DealerRankCard({
  dealer,
}: {
  dealer: {
    rank: number;
    dealerId: string;
    dealerName: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
}) {
  return (
    <View style={styles.dealerCard}>
      {/* Rank Badge */}
      <View style={styles.rankContainer}>
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor:
                dealer.rank === 1
                  ? '#fbbf24'
                  : dealer.rank === 2
                  ? '#d1d5db'
                  : '#f97316',
            },
          ]}
        >
          <Text style={styles.rankText}>#{dealer.rank}</Text>
        </View>
      </View>

      {/* Dealer Info */}
      <View style={styles.dealerInfo}>
        <Text style={styles.dealerName}>{dealer.dealerName}</Text>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBar}>
            <View
              style={[
                styles.scoreFill,
                { width: `${dealer.score}%` },
              ]}
            />
          </View>
          <Text style={styles.scoreText}>{dealer.score}/100</Text>
        </View>
      </View>

      {/* Strengths & Weaknesses */}
      <View style={styles.dealerDetails}>
        <View style={styles.detailColumn}>
          <View style={styles.detailHeader}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.detailTitle}>Điểm mạnh</Text>
          </View>
          {(dealer.strengths || []).map((s, idx) => (
            <Text key={idx} style={styles.detailItem}>
              • {s}
            </Text>
          ))}
        </View>

        <View style={styles.detailColumn}>
          <View style={styles.detailHeader}>
            <Ionicons name="warning" size={14} color="#ef4444" />
            <Text style={styles.detailTitle}>Cần cải thiện</Text>
          </View>
          {(dealer.weaknesses || []).map((w, idx) => (
            <Text key={idx} style={styles.detailItem}>
              • {w}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    paddingBottom: 24,
  },
  timeframeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#a855f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
    color: '#f3e8ff',
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  dealerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rankContainer: {
    marginBottom: 10,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  dealerInfo: {
    marginBottom: 10,
  },
  dealerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 6,
  },
  scoreBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  dealerDetails: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  detailColumn: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  detailTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  detailItem: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 14,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bulletYellow: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 16,
  },
});