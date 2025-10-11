// src/components/admin/AdminAIDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  useAdminAI,
  ExecutiveSummaryResponse,
  DealerPerformanceResponse,
  MarketTrendsResponse,
} from '../../hooks/useAdminAI';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, 
  Calendar, Users, DollarSign, Target, Award, Activity 
} from 'lucide-react';

type TabType = 'executive' | 'dealer' | 'market';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminAIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummaryResponse | null>(null);
  const [dealerPerformance, setDealerPerformance] = useState<DealerPerformanceResponse | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrendsResponse | null>(null);
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

  const { loading, error, generateExecutiveSummary, analyzeDealerPerformance, analyzeMarketTrends } =
    useAdminAI();

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 Executive Summary State Updated:', executiveSummary);
  }, [executiveSummary]);

  const handleGenerateExecutiveSummary = async (period: 'daily' | 'weekly' | 'monthly') => {
  console.log('🚀 Calling generateExecutiveSummary with period:', period);
  
  // ✅ Clear state cũ để tránh hiển thị data không đúng\
  setActivePeriod(period);
  setExecutiveSummary(null);
  
  const result = await generateExecutiveSummary(period);
  console.log('📥 Received result:', result);
  
  if (result) {
    console.log('✅ Setting executiveSummary state');
    setExecutiveSummary(result);
  }
};

const handleAnalyzeDealerPerformance = async (timeframe: 'month' | 'quarter' | 'year') => {
  // ✅ Tương tự cho dealer performance
  setDealerPerformance(null);
  
  const result = await analyzeDealerPerformance(timeframe);
  if (result) setDealerPerformance(result);
};

const handleAnalyzeMarketTrends = async () => {
  // ✅ Tương tự cho market trends
  setMarketTrends(null);
  
  const result = await analyzeMarketTrends();
  if (result) setMarketTrends(result);
};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Phân Tích Doanh Nghiệp</h1>
        <p className="text-gray-600">Phân tích thông minh cho quyết định chiến lược</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('executive')}
            className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'executive'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-5 h-5" />
            Báo cáo điều hành
          </button>
          <button
            onClick={() => setActiveTab('dealer')}
            className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'dealer'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-5 h-5" />
            Hiệu suất đại lý
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-6 py-4 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'market'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Xu hướng thị trường
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">AI đang phân tích dữ liệu của bạn...</p>
          </div>
        </div>
      )}

      {/* Executive Summary Tab */}
      {activeTab === 'executive' && !loading && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => handleGenerateExecutiveSummary(p)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    activePeriod === p
                      ? 'bg-blue-600 text-white shadow-lg' // ✅ Highlight button đang chọn
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {p === 'daily' ? 'Hàng ngày' : p === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                </button>
              ))}
            </div>
          </div>

          {executiveSummary && executiveSummary.aiAnalysis && (
            <>
              {/* AI Summary Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-start gap-3 mb-4">
                  <Activity className="w-6 h-6 mt-1" />
                  <div>
                    <h2 className="text-xl font-bold mb-2">AI Executive Summary</h2>
                    <p className="text-blue-100 text-sm">
                      {new Date(executiveSummary.dateRange?.start || '').toLocaleDateString('vi-VN')} - {new Date(executiveSummary.dateRange?.end || '').toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <p className="text-lg leading-relaxed">{executiveSummary.aiAnalysis?.executiveSummary || 'Không có dữ liệu'}</p>
              </div>

              {/* Key Metrics Grid with Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">{executiveSummary.rawData?.metrics?.newLeads || 0}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Khách hàng mới</h3>
                  <p className="text-sm text-gray-600">{executiveSummary.aiAnalysis?.keyMetrics?.leadGeneration || 'N/A'}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-8 h-8 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">{executiveSummary.rawData?.metrics?.testDrives?.total || 0}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Lái thử</h3>
                  <p className="text-sm text-gray-600">
                    {executiveSummary.rawData?.metrics?.testDrives?.completed || 0} hoàn thành, {executiveSummary.rawData?.metrics?.testDrives?.noShows || 0} vắng mặt
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-8 h-8 text-orange-600" />
                    <span className="text-2xl font-bold text-gray-900">{executiveSummary.rawData?.metrics?.sales?.total || 0}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Hợp đồng</h3>
                  <p className="text-sm text-gray-600">{executiveSummary.aiAnalysis?.keyMetrics?.conversionRate || 'N/A'}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {((executiveSummary.rawData?.metrics?.sales?.revenue || 0) / 1000000000).toFixed(2)} tỷ
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Doanh thu (VNĐ)</h3>
                  <p className="text-sm text-gray-600">{executiveSummary.aiAnalysis?.keyMetrics?.revenuePerformance || 'N/A'}</p>
                </div>
              </div>

              {/* Highlights & Concerns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900">Điểm nổi bật</h3>
                  </div>
                  <ul className="space-y-3">
                    {(executiveSummary.aiAnalysis?.highlights || []).map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">•</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-gray-900">Vấn đề cần lưu ý</h3>
                  </div>
                  <ul className="space-y-3">
                    {(executiveSummary.aiAnalysis?.concerns || []).map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span className="text-gray-700">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Hành động ưu tiên</h3>
                <div className="space-y-4">
                  {(executiveSummary.aiAnalysis?.actionItems || []).map((item, idx) => (
                    <div
                      key={idx}
                      className={`border-l-4 pl-4 py-3 ${
                        item.priority === 'CAO' || item.priority === 'HIGH'
                          ? 'border-red-500 bg-red-50'
                          : item.priority === 'TRUNG BÌNH' || item.priority === 'MEDIUM'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            item.priority === 'CAO' || item.priority === 'HIGH'
                              ? 'bg-red-600 text-white'
                              : item.priority === 'TRUNG BÌNH' || item.priority === 'MEDIUM'
                              ? 'bg-orange-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {item.priority}
                        </span>
                        <h4 className="font-bold text-gray-900">{item.action}</h4>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{item.reason}</p>
                      <p className="text-sm text-gray-600 italic">💡 {item.expectedImpact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dealer Performance Tab */}
      {activeTab === 'dealer' && !loading && (
        <div className="space-y-6">
          {/* Timeframe Selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div className="flex gap-2">
              {['month', 'quarter', 'year'].map(t => (
                <button
                  key={t}
                  onClick={() => handleAnalyzeDealerPerformance(t as any)}
                  className="px-4 py-2 rounded-lg font-medium capitalize bg-blue-600 text-white hover:bg-blue-700"
                >
                  {t === 'month' ? 'Tháng' : t === 'quarter' ? 'Quý' : 'Năm'}
                </button>
              ))}
            </div>
          </div>

          {dealerPerformance && dealerPerformance.aiAnalysis && (
            <>
              {/* AI Analysis Summary */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-3">AI Performance Analysis</h2>
                <p className="text-lg leading-relaxed">{dealerPerformance.aiAnalysis?.overallPerformance || 'Không có dữ liệu'}</p>
              </div>

              {/* Performance Metrics Chart */}
              {dealerPerformance.dealerMetrics && dealerPerformance.dealerMetrics.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">So sánh hiệu suất</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dealerPerformance.dealerMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dealerName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="metrics.totalSales" fill="#3b82f6" name="Tổng doanh số" />
                      <Bar dataKey="metrics.avgSalesPerStaff" fill="#10b981" name="Doanh số/nhân viên" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Dealer Ranking with Pie Charts */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-xl">Xếp hạng đại lý</h3>
                <div className="space-y-4">
                  {(dealerPerformance.aiAnalysis?.ranking || []).map((dealer) => (
                    <div key={dealer.dealerId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-2xl font-bold w-10 h-10 rounded-full flex items-center justify-center ${
                              dealer.rank === 1
                                ? 'bg-yellow-100 text-yellow-700'
                                : dealer.rank === 2
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            #{dealer.rank}
                          </span>
                          <div>
                            <h4 className="font-bold text-gray-900">{dealer.dealerName}</h4>
                            <p className="text-sm text-gray-600">Điểm: {dealer.score}/100</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-24 h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { value: dealer.score },
                                    { value: 100 - dealer.score }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={40}
                                  dataKey="value"
                                >
                                  <Cell fill="#3b82f6" />
                                  <Cell fill="#e5e7eb" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Điểm mạnh:</p>
                          <ul className="space-y-1">
                            {(dealer.strengths || []).map((s, idx) => (
                              <li key={idx} className="text-sm text-green-700 flex items-start gap-1">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Cần cải thiện:</p>
                          <ul className="space-y-1">
                            {(dealer.weaknesses || []).map((w, idx) => (
                              <li key={idx} className="text-sm text-orange-700 flex items-start gap-1">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Practices */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Thực hành tốt nhất</h3>
                <ul className="space-y-3">
                  {(dealerPerformance.aiAnalysis?.bestPractices || []).map((practice, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Award className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{practice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* Market Trends Tab */}
      {activeTab === 'market' && !loading && (
        <div className="space-y-6">
          {/* Refresh Button */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-end">
            <button
              onClick={handleAnalyzeMarketTrends}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Phân tích xu hướng
            </button>
          </div>

          {marketTrends && marketTrends.aiAnalysis && (
            <>
              {/* AI Market Summary */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-3">AI Market Analysis</h2>
                <p className="text-lg leading-relaxed mb-4">{marketTrends.aiAnalysis?.marketSummary || 'Không có dữ liệu'}</p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-white mb-1">Hướng tăng trưởng</p>
                    <p className="text-lg font-bold text-white">{marketTrends.aiAnalysis?.growthTrends?.direction || 'N/A'}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-white mb-1">Tốc độ</p>
                    <p className="text-lg font-bold text-white">{marketTrends.aiAnalysis?.growthTrends?.rate || 'N/A'}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-white mb-1">Độ tin cậy</p>
                    <p className="text-lg font-bold text-white">{marketTrends.aiAnalysis?.forecastNext3Months?.confidence || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Sales Trend Chart */}
              {marketTrends.marketData?.salesTrend && Object.keys(marketTrends.marketData.salesTrend).length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Xu hướng doanh số 6 tháng</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={Object.entries(marketTrends.marketData.salesTrend).map(([month, data]: [string, any]) => ({
                      month: month.slice(5),
                      sales: data.count,
                      revenue: data.revenue / 1000000000
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#3b82f6" name="Số xe bán" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name="Doanh thu (tỷ VNĐ)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <TrendingUp className="inline w-4 h-4 text-green-600 mr-1" />
                      <strong>AI Insight:</strong> {(marketTrends.aiAnalysis?.growthTrends?.drivers || [])[0] || 'Đang phân tích...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Top Vehicles */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Xe bán chạy nhất</h3>
                <div className="space-y-3">
                  {(marketTrends.marketData?.topVehicles || []).map((vehicle, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                        <div>
                          <h4 className="font-bold text-gray-900">{vehicle.vehicleName}</h4>
                          <p className="text-sm text-gray-600">{vehicle.price?.toLocaleString('vi-VN') || 0} VNĐ</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{vehicle.sales}</p>
                        <p className="text-sm text-gray-600">xe đã bán</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle Preferences */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Xu hướng sở thích xe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-bold text-green-900">Đang thịnh hành</h4>
                    </div>
                    <ul className="space-y-2">
                      {(marketTrends.aiAnalysis?.vehiclePreferences?.trending || []).map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600">▲</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <h4 className="font-bold text-red-900">Giảm nhu cầu</h4>
                    </div>
                    <ul className="space-y-2">
                      {(marketTrends.aiAnalysis?.vehiclePreferences?.declining || []).map((item, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-600">▼</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Nguyên nhân:</strong> {marketTrends.aiAnalysis?.vehiclePreferences?.reasons || 'N/A'}
                  </p>
                </div>
              </div>

              {/* 3-Month Forecast */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Dự báo 3 tháng tới</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-white mb-1">Sản lượng bán</p>
                    <p className="text-lg font-bold text-white">{marketTrends.aiAnalysis?.forecastNext3Months?.salesVolume?.split('(')[0] || 'N/A'}</p>
                    <p className="text-xs text-white/80 mt-1">{marketTrends.aiAnalysis?.forecastNext3Months?.salesVolume?.split('(')[1]?.replace(')', '') || ''}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-white mb-1">Doanh thu</p>
                    <p className="text-lg font-bold text-white">{marketTrends.aiAnalysis?.forecastNext3Months?.revenue || 'N/A'}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-white mb-1">Độ tin cậy</p>
                    <p className="text-lg font-bold text-white">{marketTrends.aiAnalysis?.forecastNext3Months?.confidence || 'N/A'}</p>
                  </div>
                  <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-white mb-1">Sản phẩm hàng đầu</p>
                    <p className="text-lg font-bold text-white">{(marketTrends.aiAnalysis?.forecastNext3Months?.topProducts || []).length} mẫu</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-white mb-2">Xe bán chạy dự kiến:</p>
                  <div className="flex flex-wrap gap-2">
                    {(marketTrends.aiAnalysis?.forecastNext3Months?.topProducts || []).map((product, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-sm text-white">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Cơ hội chiến lược</h3>
                <div className="space-y-4">
                  {(marketTrends.aiAnalysis?.opportunities || []).map((opp, idx) => (
                    <div key={idx} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50">
                      <h4 className="font-bold text-gray-900 mb-2">{opp.opportunity}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="font-medium text-gray-700">Quy mô: </span>
                          <span className="text-gray-600">{opp.marketSize}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Timeline: </span>
                          <span className="text-gray-600">{opp.timeline}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Ưu tiên: </span>
                          <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">CAO</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>Kế hoạch:</strong> {opp.actionPlan}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Behavior Insights */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Insights hành vi khách hàng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Mẫu hình mua hàng</h4>
                    <p className="text-gray-700 mb-4">{marketTrends.aiAnalysis?.customerBehavior?.buyingPatterns || 'N/A'}</p>
                    <h4 className="font-medium text-gray-900 mb-3">Thanh toán ưa chuộng</h4>
                    <p className="text-gray-700">{marketTrends.aiAnalysis?.customerBehavior?.paymentPreferences || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Yếu tố quyết định chính</h4>
                    <ul className="space-y-2">
                      {(marketTrends.aiAnalysis?.customerBehavior?.decisionFactors || []).map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">{idx + 1}.</span>
                          <span className="text-gray-700">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAIDashboard;