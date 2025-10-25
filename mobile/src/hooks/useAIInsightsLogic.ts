// mobile/src/hooks/useAIInsightsLogic.ts
import { useState, useCallback } from 'react';
import axios from '@/lib/utils/axiosClient';
import Toast from 'react-native-toast-message';

export interface ExecutiveSummaryResponse {
  period: 'daily' | 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
  rawData: {
    metrics: {
      newLeads: number;
      testDrives: {
        total: number;
        completed: number;
        noShows: number;
      };
      sales: {
        total: number;
        revenue: number;
      };
    };
  };
  aiAnalysis: {
    executiveSummary: string;
    keyMetrics: {
      leadGeneration: string;
      conversionRate: string;
      revenuePerformance: string;
    };
    highlights: string[];
    concerns: string[];
    actionItems: Array<{
      priority: string;
      action: string;
      reason: string;
      expectedImpact: string;
    }>;
  };
  generatedAt: string;
}

export interface DealerPerformanceResponse {
  timeframe: 'month' | 'quarter' | 'year';
  aiAnalysis: {
    overallPerformance: string;
    ranking: Array<{
      rank: number;
      dealerId: string;
      dealerName: string;
      score: number;
      strengths: string[];
      weaknesses: string[];
    }>;
    bestPractices: string[];
  };
}

export interface MarketTrendsResponse {
  aiAnalysis: {
    marketSummary: string;
    growthTrends: {
      direction: string;
      rate: string;
    };
  };
}

export function useAIInsightsLogic() {
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummaryResponse | null>(null);
  const [dealerPerformance, setDealerPerformance] = useState<DealerPerformanceResponse | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutiveSummary = useCallback(
    async (period: 'daily' | 'weekly' | 'monthly') => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `ai/admin/executive-summary?period=${period}`
        );
        const data = response.data.data;
        setExecutiveSummary(data);
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Báo cáo đã được tạo',
        });
        return data;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Không thể tạo báo cáo';
        setError(message);
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: message,
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchDealerPerformance = useCallback(
    async (timeframe: 'month' | 'quarter' | 'year') => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `ai/admin/dealer-performance?timeframe=${timeframe}`
        );
        const data = response.data.data;
        setDealerPerformance(data);
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Phân tích đã được tạo',
        });
        return data;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Không thể phân tích đại lý';
        setError(message);
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: message,
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchMarketTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('ai/admin/market-trends');
      const data = response.data.data;
      setMarketTrends(data);
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Phân tích thị trường đã được tạo',
      });
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể phân tích thị trường';
      setError(message);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: message,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    executiveSummary,
    dealerPerformance,
    marketTrends,
    loading,
    error,
    fetchExecutiveSummary,
    fetchDealerPerformance,
    fetchMarketTrends,
  };
}