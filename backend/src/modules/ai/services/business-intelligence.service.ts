// src/modules/ai/services/business-intelligence.service.ts
import { GeminiClient } from '../../../utils/gemini-client.util';
import prisma from '../../../config/database';

/**
 * AI Business Intelligence Service for Admin
 */
export class BusinessIntelligenceService {
  /**
   * 1. Generate Executive Summary
   */
  async generateExecutiveSummary(
    period: 'daily' | 'weekly' | 'monthly',
    baseDate?: string 
  ) {
    const now = baseDate ? new Date(baseDate) : new Date();

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 1);
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    console.log('📅 Executive Summary Period:', {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Gather data (loại bỏ quotation)
    const [newLeads, testDrives, contracts, revenue] = await Promise.all([
      prisma.customer.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),

      prisma.testDrive.findMany({
        where: { scheduledDate: { gte: startDate, lte: endDate } },
        include: { vehicle: true },
      }),

      prisma.contract.findMany({
        where: {
          signedAt: { gte: startDate, lte: endDate },
          status: { in: ['SIGNED', 'COMPLETED'] },
        },
      }),

      prisma.contract.aggregate({
        where: {
          signedAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
        _sum: { finalPrice: true },
      }),
    ]);

    const businessData = {
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      metrics: {
        newLeads,
        testDrives: {
          total: testDrives.length,
          completed: testDrives.filter((td) => td.status === 'COMPLETED').length,
          noShows: testDrives.filter((td) => td.status === 'NO_SHOW').length,
        },
        sales: {
          total: contracts.length,
          revenue: Number(revenue._sum.finalPrice || 0),
        },
      },
    };

    // AI Analysis
    const prompt = `
You are a senior business analyst for automotive dealerships.
Analyze this business performance data and create an executive summary.

Bạn là chuyên gia phân tích kinh doanh cấp cao trong ngành đại lý ô tô.
Hãy phân tích dữ liệu hiệu suất kinh doanh dưới đây và tạo báo cáo tổng kết điều hành.

Data:
${JSON.stringify(businessData, null, 2)}

Return JSON in Vietnamese:
{
  "executiveSummary": "Tổng quan 2-3 đoạn tóm tắt tình hình kinh doanh",
  "keyMetrics": {
    "leadGeneration": "Phân tích hiệu quả tạo khách hàng tiềm năng",
    "conversionRate": "Tỷ lệ chuyển đổi từ lái thử đến mua xe",
    "revenuePerformance": "Hiệu suất doanh thu và lợi nhuận",
    "customerSatisfaction": "Nhận xét về mức độ hài lòng của khách hàng"
  },
  "highlights": ["điểm nổi bật 1", "điểm nổi bật 2", "điểm nổi bật 3"],
  "concerns": ["vấn đề 1", "vấn đề 2"],
  "trends": {
    "description": "Xu hướng chính trong giai đoạn này",
    "predictions": "Dự đoán diễn biến tiếp theo"
  },
  "actionItems": [
    {
      "priority": "CAO/TRUNG BÌNH/THẤP",
      "action": "Hành động cụ thể cần triển khai",
      "reason": "Lý do cần thực hiện",
      "expectedImpact": "Tác động kỳ vọng sau khi thực hiện"
    }
  ]
}
`;

    const analysis = await GeminiClient.generateJSON(prompt, {
      systemInstruction:
        'You are a senior business analyst for automotive dealerships. Provide actionable insights.',
      periodKey: `${period}_${startDate.toISOString()}_${endDate.toISOString()}`,
    });

    return {
      period,
      dateRange: { start: startDate, end: endDate },
      rawData: businessData,
      aiAnalysis: analysis,
      generatedAt: new Date(),
    };
  }

  // =======================================================================
  // Các hàm còn lại giữ nguyên logic cũ (Analyze Dealer Performance + Market)
  // =======================================================================

  async analyzeDealerPerformance(timeframe: 'month' | 'quarter' | 'year') {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate: Date;

    switch (timeframe) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    const dealers = await prisma.dealer.findMany({
      where: { isActive: true },
      include: {
        region: true,
        users: {
          include: {
            contracts: {
              where: {
                signedAt: { gte: startDate },
                status: { in: ['SIGNED', 'COMPLETED'] },
              },
            },
          },
        },
      },
    });

    const dealerMetrics = dealers.map((dealer) => {
      const contracts = dealer.users.flatMap((u) => u.contracts);
      const totalRevenue = contracts.reduce((sum, c) => sum + Number(c.finalPrice), 0);

      return {
        dealerId: dealer.id,
        dealerName: dealer.name,
        region: dealer.region,
        metrics: {
          totalSales: contracts.length,
          totalRevenue,
          avgDealSize: contracts.length > 0 ? totalRevenue / contracts.length : 0,
          staffCount: dealer.users.length,
          avgSalesPerStaff:
            dealer.users.length > 0 ? contracts.length / dealer.users.length : 0,
        },
      };
    });

    const prompt = `
You are a dealership network analyst.
Analyze dealer performance across regions and provide fair, data-driven insights.

Bạn là chuyên viên phân tích mạng lưới đại lý ô tô.
Hãy đánh giá hiệu suất của các đại lý dựa trên dữ liệu và đưa ra nhận định công bằng, khách quan.

Data:
${JSON.stringify(dealerMetrics, null, 2)}

Return JSON in Vietnamese:
{
  "overallPerformance": "Tổng quan hiệu suất toàn mạng lưới",
  "ranking": [
    {
      "rank": 1,
      "dealerId": "...",
      "dealerName": "...",
      "score": 0-100,
      "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
      "weaknesses": ["điểm yếu 1", "điểm yếu 2"]
    }
  ],
  "bestPractices": ["thực hành tốt 1", "thực hành tốt 2"],
  "strategicRecommendations": [
    {
      "recommendation": "Chiến lược đề xuất",
      "targetDealers": ["tên đại lý"],
      "expectedImpact": "Tác động kỳ vọng",
      "implementation": "Cách triển khai"
    }
  ]
}
`;
    const analysis = await GeminiClient.generateJSON(prompt, {
      systemInstruction:
        'You are a dealership network analyst. Provide fair, data-driven assessments.',
        
    });

    return {
      timeframe,
      dateRange: { start: startDate, end: endDate },
      dealerMetrics,
      aiAnalysis: analysis,
      generatedAt: new Date(),
    };
  }

  async analyzeMarketTrends() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const [contracts, vehicles] = await Promise.all([
      prisma.contract.findMany({
        where: {
          signedAt: { gte: sixMonthsAgo },
          status: 'COMPLETED',
        },
        include: { vehicle: true },
      }),
      prisma.vehicle.findMany({ include: { manufacturer: true } }),
    ]);

    const salesByMonth: Record<string, { count: number; revenue: number }> = {};
    contracts.forEach((c) => {
      if (!c.signedAt) return;
      const key = `${c.signedAt.getFullYear()}-${String(
        c.signedAt.getMonth() + 1
      ).padStart(2, '0')}`;
      if (!salesByMonth[key]) {
        salesByMonth[key] = { count: 0, revenue: 0 };
      }
      salesByMonth[key].count++;
      salesByMonth[key].revenue += Number(c.finalPrice);
    });

    const vehicleSales: Record<string, number> = {};
    contracts.forEach((c) => {
      const key = c.vehicle.model;
      vehicleSales[key] = (vehicleSales[key] || 0) + 1;
    });

    const topVehicles = Object.entries(vehicleSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([model, sales]) => {
        const vehicle = vehicles.find((v) => v.model === model);
        return {
          vehicleName: model,
          sales,
          price: vehicle ? Number(vehicle.retailPrice) : 0,
        };
      });

    const marketData = {
      salesTrend: salesByMonth,
      topVehicles,
      totalSales: contracts.length,
      totalRevenue: contracts.reduce((sum, c) => sum + Number(c.finalPrice), 0),
    };

    const prompt = `
You are a market research analyst for the automotive industry.
Analyze the following sales and vehicle trend data and forecast upcoming changes.

Bạn là chuyên viên nghiên cứu thị trường ngành ô tô.
Hãy phân tích dữ liệu doanh số và xu hướng xe dưới đây để dự báo tình hình trong thời gian tới.

Data:
${JSON.stringify(marketData, null, 2)}

Return JSON in Vietnamese:
{
  "marketSummary": "Tổng quan tình hình thị trường ô tô",
  "growthTrends": {
    "direction": "Tăng trưởng / Ổn định / Suy giảm",
    "rate": "Tốc độ hoặc tỷ lệ phần trăm ước tính",
    "drivers": ["nhân tố thúc đẩy 1", "nhân tố 2"]
  },
  "customerBehavior": {
    "buyingPatterns": "Mẫu hành vi mua hàng",
    "pricePoints": "Phân khúc giá phổ biến",
    "paymentPreferences": "Hình thức thanh toán ưa chuộng",
    "decisionFactors": ["yếu tố ảnh hưởng 1", "yếu tố 2"]
  },
  "vehiclePreferences": {
    "trending": ["loại xe thịnh hành"],
    "declining": ["loại xe giảm nhu cầu"],
    "reasons": "Nguyên nhân chính"
  },
  "opportunities": [
    {
      "opportunity": "Cơ hội tiềm năng",
      "marketSize": "Quy mô ước tính",
      "actionPlan": "Kế hoạch hành động gợi ý",
      "timeline": "Thời gian triển khai"
    }
  ],
  "forecastNext3Months": {
    "salesVolume": "Dự báo sản lượng bán ra",
    "revenue": "Dự báo doanh thu",
    "topProducts": ["mẫu xe nổi bật"],
    "confidence": "Độ tin cậy: CAO / TRUNG BÌNH / THẤP"
  }
}
`;
    const analysis = await GeminiClient.generateJSON(prompt, {
      systemInstruction:
        'You are a market research analyst for automotive industry. Provide data-driven insights.',
    });

    return {
      period: 'Last 6 months',
      marketData,
      aiAnalysis: analysis,
      generatedAt: new Date(),
    };
  }
}
