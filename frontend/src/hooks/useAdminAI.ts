// src/hooks/useAdminAI.ts
import { useState } from 'react';
import axios from '@/lib/utils/axiosClient';

export interface ExecutiveSummaryResponse {
  period: 'daily' | 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
  rawData: {
    period: {
      type: string;
      startDate: string;
      endDate: string;
    };
    metrics: {
      newLeads: number;
      testDrives: {
        total: number;
        completed: number;
        noShows: number;
      };
      quotations: {
        total: number;
        sent: number;
        accepted: number;
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
      customerSatisfaction: string;
    };
    highlights: string[];
    concerns: string[];
    trends: {
      description: string;
      predictions: string;
    };
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
  dateRange: {
    start: string;
    end: string;
  };
  dealerMetrics: Array<{
    dealerId: string;
    dealerName: string;
    region: any;
    metrics: {
      totalSales: number;
      totalRevenue: number;
      avgDealSize: number;
      staffCount: number;
      avgSalesPerStaff: number;
    };
  }>;
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
    strategicRecommendations: Array<{
      recommendation: string;
      targetDealers: string[];
      expectedImpact: string;
      implementation: string;
    }>;
  };
  generatedAt: string;
}

export interface MarketTrendsResponse {
  period: string;
  marketData: {
    salesTrend: Record<string, { count: number; revenue: number }>;
    topVehicles: Array<{
      vehicleName: string;
      sales: number;
      price: number;
    }>;
    totalSales: number;
    totalRevenue: number;
  };
  aiAnalysis: {
    marketSummary: string;
    growthTrends: {
      direction: string;
      rate: string;
      drivers: string[];
    };
    customerBehavior: {
      buyingPatterns: string;
      pricePoints: string;
      paymentPreferences: string;
      decisionFactors: string[];
    };
    vehiclePreferences: {
      trending: string[];
      declining: string[];
      reasons: string;
    };
    opportunities: Array<{
      opportunity: string;
      marketSize: string;
      actionPlan: string;
      timeline: string;
    }>;
    forecastNext3Months: {
      salesVolume: string;
      revenue: string;
      topProducts: string[];
      confidence: string;
    };
  };
  generatedAt: string;
}

export const useAdminAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    const generateExecutiveSummary = async (
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<ExecutiveSummaryResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`ai/admin/executive-summary?period=${period}`);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo báo cáo');
      return null;
    } finally {
      setLoading(false);
    }
  };

    const analyzeDealerPerformance = async (
    timeframe: 'month' | 'quarter' | 'year'
  ): Promise<DealerPerformanceResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`ai/admin/dealer-performance?timeframe=${timeframe}`);
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phân tích đại lý');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzeMarketTrends = async (): Promise<MarketTrendsResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('ai/admin/market-trends');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phân tích thị trường');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateExecutiveSummary,
    analyzeDealerPerformance,
    analyzeMarketTrends,
  };
};