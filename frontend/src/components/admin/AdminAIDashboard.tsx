import React, { useState } from 'react';
import {
  useAdminAI,
  ExecutiveSummaryResponse,
  DealerPerformanceResponse,
  MarketTrendsResponse,
} from '../../hooks/useAdminAI';

type TabType = 'executive' | 'dealer' | 'market';

const AdminAIDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummaryResponse | null>(null);
  const [dealerPerformance, setDealerPerformance] = useState<DealerPerformanceResponse | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrendsResponse | null>(null);

  const { loading, error, generateExecutiveSummary, analyzeDealerPerformance, analyzeMarketTrends } =
    useAdminAI();

  const handleGenerateExecutiveSummary = async (period: 'daily' | 'weekly' | 'monthly') => {
    const result = await generateExecutiveSummary(period);
    if (result) setExecutiveSummary(result);
  };

  const handleAnalyzeDealerPerformance = async (timeframe: 'month' | 'quarter' | 'year') => {
    const result = await analyzeDealerPerformance(timeframe);
    if (result) setDealerPerformance(result);
  };

  const handleAnalyzeMarketTrends = async () => {
    const result = await analyzeMarketTrends();
    if (result) setMarketTrends(result);
  };

  return (
    <div className="container mx-auto p-6 text-black">
      <h1 className="text-3xl font-bold mb-6">AI Phân Tích</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('executive')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'executive'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Báo cáo điều hành
        </button>
        <button
          onClick={() => setActiveTab('dealer')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'dealer'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Hiệu suất đại lý
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'market'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Xu hướng thị trường
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Executive Summary Tab */}
      {activeTab === 'executive' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6 text-black">
            <h2 className="text-xl font-semibold mb-4">Tạo báo cáo tổng kết điều hành</h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleGenerateExecutiveSummary('daily')}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Báo cáo hàng ngày
              </button>
              <button
                onClick={() => handleGenerateExecutiveSummary('weekly')}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Báo cáo hàng tuần
              </button>
              <button
                onClick={() => handleGenerateExecutiveSummary('monthly')}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Báo cáo hàng tháng
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang phân tích dữ liệu...</p>
            </div>
          )}

          {executiveSummary && !loading && executiveSummary.aiAnalysis && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Tổng quan điều hành</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {executiveSummary.aiAnalysis?.executiveSummary || 'Không có dữ liệu'}
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  Thời gian: {new Date(executiveSummary.dateRange?.start || new Date()).toLocaleDateString('vi-VN')}{' '}
                  - {new Date(executiveSummary.dateRange?.end || new Date()).toLocaleDateString('vi-VN')}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Chỉ số chính</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-700">Tạo khách hàng tiềm năng</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {executiveSummary.aiAnalysis?.keyMetrics?.leadGeneration || 'N/A'}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-700">Tỷ lệ chuyển đổi</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {executiveSummary.aiAnalysis?.keyMetrics?.conversionRate || 'N/A'}
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-700">Hiệu suất doanh thu</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {executiveSummary.aiAnalysis?.keyMetrics?.revenuePerformance || 'N/A'}
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-700">Hài lòng khách hàng</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {executiveSummary.aiAnalysis?.keyMetrics?.customerSatisfaction || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Highlights & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-3 text-green-800">Điểm nổi bật</h3>
                  <ul className="space-y-2">
                    {(executiveSummary.aiAnalysis?.highlights || []).map((highlight, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                    {(!executiveSummary.aiAnalysis?.highlights || executiveSummary.aiAnalysis.highlights.length === 0) && (
                      <li className="text-gray-500 text-sm">Không có dữ liệu</li>
                    )}
                  </ul>
                </div>
                <div className="bg-orange-50 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-3 text-orange-800">Vấn đề cần lưu ý</h3>
                  <ul className="space-y-2">
                    {(executiveSummary.aiAnalysis?.concerns || []).map((concern, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-orange-600 mr-2">!</span>
                        <span className="text-gray-700">{concern}</span>
                      </li>
                    ))}
                    {(!executiveSummary.aiAnalysis?.concerns || executiveSummary.aiAnalysis.concerns.length === 0) && (
                      <li className="text-gray-500 text-sm">Không có dữ liệu</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Trends */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Xu hướng</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700">Mô tả:</h4>
                    <p className="text-gray-600">{executiveSummary.aiAnalysis?.trends?.description || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Dự đoán:</h4>
                    <p className="text-gray-600">{executiveSummary.aiAnalysis?.trends?.predictions || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Hành động đề xuất</h3>
                <div className="space-y-4">
                  {(executiveSummary.aiAnalysis?.actionItems || []).map((item, idx) => (
                    <div
                      key={idx}
                      className={`border-l-4 p-4 rounded ${
                        item.priority === 'CAO'
                          ? 'border-red-500 bg-red-50'
                          : item.priority === 'TRUNG BÌNH'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.priority === 'CAO'
                              ? 'bg-red-200 text-red-800'
                              : item.priority === 'TRUNG BÌNH'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">{item.action}</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Lý do:</strong> {item.reason}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Tác động:</strong> {item.expectedImpact}
                      </p>
                    </div>
                  ))}
                  {(!executiveSummary.aiAnalysis?.actionItems || executiveSummary.aiAnalysis.actionItems.length === 0) && (
                    <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dealer Performance Tab */}
      {activeTab === 'dealer' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Phân tích hiệu suất đại lý</h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleAnalyzeDealerPerformance('month')}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Tháng này
              </button>
              <button
                onClick={() => handleAnalyzeDealerPerformance('quarter')}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Quý này
              </button>
              <button
                onClick={() => handleAnalyzeDealerPerformance('year')}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Năm này
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang phân tích dữ liệu...</p>
            </div>
          )}

          {dealerPerformance && !loading && dealerPerformance.aiAnalysis && (
            <div className="space-y-6">
              {/* Overall Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Tổng quan hiệu suất</h3>
                <p className="text-gray-700">{dealerPerformance.aiAnalysis?.overallPerformance || 'Không có dữ liệu'}</p>
              </div>

              {/* Ranking */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Xếp hạng đại lý</h3>
                <div className="space-y-4">
                  {(dealerPerformance.aiAnalysis?.ranking || []).map((dealer) => (
                    <div
                      key={dealer.dealerId}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-blue-600">#{dealer.rank}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800">{dealer.dealerName}</h4>
                            <span className="text-sm text-gray-500">Điểm: {dealer.score}/100</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-semibold text-green-700 text-sm mb-2">Điểm mạnh</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {(dealer.strengths || []).map((strength, idx) => (
                              <li key={idx}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-orange-700 text-sm mb-2">Điểm yếu</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {(dealer.weaknesses || []).map((weakness, idx) => (
                              <li key={idx}>• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!dealerPerformance.aiAnalysis?.ranking || dealerPerformance.aiAnalysis.ranking.length === 0) && (
                    <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                  )}
                </div>
              </div>

              {/* Best Practices */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Thực hành tốt nhất</h3>
                <ul className="space-y-2">
                  {(dealerPerformance.aiAnalysis?.bestPractices || []).map((practice, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
                      <span className="text-gray-700">{practice}</span>
                    </li>
                  ))}
                  {(!dealerPerformance.aiAnalysis?.bestPractices || dealerPerformance.aiAnalysis.bestPractices.length === 0) && (
                    <li className="text-gray-500 text-sm">Không có dữ liệu</li>
                  )}
                </ul>
              </div>

              {/* Strategic Recommendations */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Đề xuất chiến lược</h3>
                <div className="space-y-4">
                  {(dealerPerformance.aiAnalysis?.strategicRecommendations || []).map((rec, idx) => (
                    <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-800 mb-2">{rec.recommendation}</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Đại lý mục tiêu:</strong> {(rec.targetDealers || []).join(', ')}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Tác động:</strong> {rec.expectedImpact}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Triển khai:</strong> {rec.implementation}
                      </p>
                    </div>
                  ))}
                  {(!dealerPerformance.aiAnalysis?.strategicRecommendations || dealerPerformance.aiAnalysis.strategicRecommendations.length === 0) && (
                    <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Trends Tab */}
      {activeTab === 'market' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Phân tích xu hướng thị trường</h2>
            <button
              onClick={handleAnalyzeMarketTrends}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Phân tích xu hướng (6 tháng gần nhất)
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Đang phân tích dữ liệu...</p>
            </div>
          )}

          {marketTrends && !loading && marketTrends.aiAnalysis && (
            <div className="space-y-6">
              {/* Market Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Tổng quan thị trường</h3>
                <p className="text-gray-700">{marketTrends.aiAnalysis?.marketSummary || 'Không có dữ liệu'}</p>
              </div>

              {/* Growth Trends */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Xu hướng tăng trưởng</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Hướng:</span>
                    <span className="ml-2 text-gray-600">
                      {marketTrends.aiAnalysis?.growthTrends?.direction || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Tốc độ:</span>
                    <span className="ml-2 text-gray-600">
                      {marketTrends.aiAnalysis?.growthTrends?.rate || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Nhân tố thúc đẩy:</span>
                    <ul className="ml-6 mt-2 space-y-1">
                      {(marketTrends.aiAnalysis?.growthTrends?.drivers || []).map((driver, idx) => (
                        <li key={idx} className="text-gray-600">
                          • {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Customer Behavior */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Hành vi khách hàng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Mẫu hình mua hàng</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {marketTrends.aiAnalysis?.customerBehavior?.buyingPatterns || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Phân khúc giá</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {marketTrends.aiAnalysis?.customerBehavior?.pricePoints || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Thanh toán ưa chuộng</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {marketTrends.aiAnalysis?.customerBehavior?.paymentPreferences || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Yếu tố quyết định</h4>
                    <ul className="text-sm text-gray-600 mt-1 space-y-1">
                      {(marketTrends.aiAnalysis?.customerBehavior?.decisionFactors || []).map((factor, idx) => (
                        <li key={idx}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Vehicle Preferences */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Sở thích xe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="bg-green-50 p-4 rounded">
                    <h4 className="font-semibold text-green-700 mb-2">Đang thịnh hành</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {(marketTrends.aiAnalysis?.vehiclePreferences?.trending || []).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                      {(!marketTrends.aiAnalysis?.vehiclePreferences?.trending || marketTrends.aiAnalysis.vehiclePreferences.trending.length === 0) && (
                        <li className="text-gray-500">Không có dữ liệu</li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <h4 className="font-semibold text-red-700 mb-2">Giảm nhu cầu</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {(marketTrends.aiAnalysis?.vehiclePreferences?.declining || []).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                      {(!marketTrends.aiAnalysis?.vehiclePreferences?.declining || marketTrends.aiAnalysis.vehiclePreferences.declining.length === 0) && (
                        <li className="text-gray-500">Không có dữ liệu</li>
                      )}
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Nguyên nhân:</strong> {marketTrends.aiAnalysis?.vehiclePreferences?.reasons || 'N/A'}
                </p>
              </div>

              {/* Opportunities */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Cơ hội kinh doanh</h3>
                <div className="space-y-4">
                  {(marketTrends.aiAnalysis?.opportunities || []).map((opp, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-semibold text-gray-800 mb-2">{opp.opportunity}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Quy mô thị trường:</span>
                          <p className="text-gray-600">{opp.marketSize}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Kế hoạch:</span>
                          <p className="text-gray-600">{opp.actionPlan}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Thời gian:</span>
                          <p className="text-gray-600">{opp.timeline}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!marketTrends.aiAnalysis?.opportunities || marketTrends.aiAnalysis.opportunities.length === 0) && (
                    <p className="text-gray-500 text-sm">Không có dữ liệu</p>
                  )}
                </div>
              </div>

              {/* Forecast */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Dự báo 3 tháng tới</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded">
                      <h4 className="font-semibold text-gray-700">Sản lượng bán</h4>
                      <p className="text-gray-600 mt-1">
                        {marketTrends.aiAnalysis?.forecastNext3Months?.salesVolume || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <h4 className="font-semibold text-gray-700">Doanh thu</h4>
                      <p className="text-gray-600 mt-1">
                        {marketTrends.aiAnalysis?.forecastNext3Months?.revenue || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-semibold text-gray-700 mb-2">Sản phẩm nổi bật</h4>
                    <div className="flex flex-wrap gap-2">
                      {(marketTrends.aiAnalysis?.forecastNext3Months?.topProducts || []).map((product, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {product}
                        </span>
                      ))}
                      {(!marketTrends.aiAnalysis?.forecastNext3Months?.topProducts || marketTrends.aiAnalysis.forecastNext3Months.topProducts.length === 0) && (
                        <span className="text-gray-500 text-sm">Không có dữ liệu</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded">
                    <h4 className="font-semibold text-gray-700">Độ tin cậy</h4>
                    <p className="text-gray-600 mt-1">
                      {marketTrends.aiAnalysis?.forecastNext3Months?.confidence || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Vehicles Data */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top 5 xe bán chạy (6 tháng qua)</h3>
                <div className="space-y-3">
                  {(marketTrends.marketData?.topVehicles || []).map((vehicle, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-400">#{idx + 1}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800">{vehicle.vehicleName}</h4>
                          <p className="text-sm text-gray-500">
                            {vehicle.price?.toLocaleString('vi-VN') || 0} VNĐ
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{vehicle.sales} xe</p>
                        <p className="text-sm text-gray-500">đã bán</p>
                      </div>
                    </div>
                  ))}
                  {(!marketTrends.marketData?.topVehicles || marketTrends.marketData.topVehicles.length === 0) && (
                    <p className="text-gray-500 text-sm text-center py-4">Không có dữ liệu xe bán chạy</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAIDashboard;