'use client';
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Send,
  X,
  RefreshCw
} from 'lucide-react';
import { dealerApi } from '@/lib/api/dealerApi';
import type { Dealer } from './types';

interface DebtRecord {
  id: string;
  dealerId: string;
  totalDebt: number;
  paidAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    orderedAt: string;
    deliveredAt?: string;
  };
  dealer?: {
    id: string;
    name: string;
    code: string;
  };
  vehicle?: {
    id: string;
    model: string;
    variant: string;
    manufacturer: {
      name: string;
    };
  };
  staff?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  isOverdue?: boolean;
  daysOverdue?: number;
}

interface DebtTrackerProps {
  dealer: Dealer;
  onClose: () => void;
}

// Payment Modal Component
function PaymentModal({ debt, onClose, onSuccess }: { 
  debt: DebtRecord; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // TODO: Gọi API thực để ghi nhận thanh toán
    // await dealerApi.recordPayment(debt.id, amount, paymentDate);
    
    // Giả lập API call
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1000);
  };

  const remainingDebt = debt.totalDebt - debt.paidAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Ghi nhận Thanh toán</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            Còn nợ: <strong>{formatCurrency(remainingDebt)}</strong>
          </p>
          {debt.order && (
            <p className="text-sm text-yellow-800 mt-1">
              Đơn hàng: <strong>{debt.order.orderNumber}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền thanh toán
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={remainingDebt}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày thanh toán
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl transition-all font-semibold shadow-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DebtTracker({ dealer, onClose }: DebtTrackerProps) {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Base URL cho API - sử dụng localhost:5000 như trong log
  const API_BASE_URL = 'http://localhost:5000/api/v1';

  // Thêm function test API endpoints với base URL đúng
  const testApiEndpoints = async (dealerId: string) => {
    const endpoints = [
      `${API_BASE_URL}/reports/debts?dealerId=${dealerId}&period=all`,
      `${API_BASE_URL}/reports/dealer-debts?dealerId=${dealerId}&period=all`,
      `${API_BASE_URL}/debts/dealers/detail?dealerId=${dealerId}`,
      // Thử thêm các endpoint khác có thể có
      `${API_BASE_URL}/reports/debts/dealers?dealerId=${dealerId}`,
      `${API_BASE_URL}/dealers/${dealerId}/debts`,
      `${API_BASE_URL}/dealers/${dealerId}/debt-details`
    ];
    
    const token = localStorage.getItem('auth_token');
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Endpoint ${endpoint}: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint} works:`, data);
          return { endpoint, data };
        } else if (response.status !== 404) {
          console.log(`⚠️ ${endpoint} returned: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint} failed:`, error);
      }
    }
    
    return null;
  };

  const loadDebts = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 Loading dealer debts for:', dealer.id);

      // Tìm endpoint hoạt động
      const endpointResult = await testApiEndpoints(dealer.id);
      
      if (!endpointResult) {
        // Nếu không tìm thấy endpoint nào, sử dụng fallback data và hiển thị cảnh báo
        console.warn('No API endpoint found, using fallback data');
        setError('Không thể kết nối đến server. Đang hiển thị dữ liệu mẫu.');
        
        // Fallback data chi tiết
        const fallbackDebts: DebtRecord[] = [
          {
            id: 'fallback-1',
            dealerId: dealer.id,
            totalDebt: 75000000,
            paidAmount: 30000000,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'PARTIAL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: {
              id: 'order-1',
              orderNumber: 'DH' + Math.random().toString(36).substr(2, 6).toUpperCase(),
              totalAmount: 75000000,
              status: 'DELIVERED',
              orderedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            dealer: {
              id: dealer.id,
              name: dealer.name,
              code: dealer.code
            },
            vehicle: {
              id: 'vehicle-1',
              model: 'Model S',
              variant: 'Long Range',
              manufacturer: {
                name: 'Tesla'
              }
            },
            staff: {
              firstName: 'Nguyễn Văn',
              lastName: 'A',
              email: 'staff@example.com'
            },
            isOverdue: false,
            daysOverdue: 0
          },
          {
            id: 'fallback-2',
            dealerId: dealer.id,
            totalDebt: 50000000,
            paidAmount: 0,
            dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'OVERDUE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: {
              id: 'order-2',
              orderNumber: 'DH' + Math.random().toString(36).substr(2, 6).toUpperCase(),
              totalAmount: 50000000,
              status: 'DELIVERED',
              orderedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
              deliveredAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
            },
            dealer: {
              id: dealer.id,
              name: dealer.name,
              code: dealer.code
            },
            vehicle: {
              id: 'vehicle-2',
              model: 'Model 3',
              variant: 'Standard',
              manufacturer: {
                name: 'Tesla'
              }
            },
            staff: {
              firstName: 'Trần Thị',
              lastName: 'B',
              email: 'staff2@example.com'
            },
            isOverdue: true,
            daysOverdue: 10
          }
        ];
        
        setDebts(fallbackDebts);
        return;
      }

      const { endpoint, data } = endpointResult;

      console.log('📊 Debt API response:', data);

      if (data.success && data.data) {
        // Xử lý dữ liệu từ API - hỗ trợ nhiều cấu trúc response khác nhau
        let debtsData = [];

        // Case 1: Data từ reports/debts (giống ReportDealer)
        if (data.data.debts && Array.isArray(data.data.debts)) {
          debtsData = data.data.debts.map((debt: any) => ({
            id: debt.id || debt.order?.id || `debt-${Math.random()}`,
            dealerId: dealer.id,
            totalDebt: debt.totalAmount || debt.totalDebt || 0,
            paidAmount: debt.paidAmount || 0,
            dueDate: debt.dueDate || debt.contract?.dueDate || new Date().toISOString(),
            status: debt.status === 'PAID' ? 'PAID' : 
                   debt.status === 'OVERDUE' ? 'OVERDUE' : 
                   (debt.paidAmount || 0) > 0 ? 'PARTIAL' : 'UNPAID',
            createdAt: debt.createdAt || debt.order?.orderedAt || new Date().toISOString(),
            updatedAt: debt.updatedAt || new Date().toISOString(),
            order: debt.order || {
              id: debt.orderId,
              orderNumber: debt.orderNumber,
              totalAmount: debt.totalAmount,
              status: debt.status,
              orderedAt: debt.orderDate,
              deliveredAt: debt.deliveredAt
            },
            dealer: debt.dealer || {
              id: dealer.id,
              name: dealer.name,
              code: dealer.code
            },
            vehicle: debt.vehicle,
            staff: debt.staff,
            isOverdue: debt.isOverdue || false,
            daysOverdue: debt.daysOverdue || 0
          }));
        }
        // Case 2: Data từ reports/dealer-debts (giống ReportEVM)
        else if (data.data.detailedDebts && Array.isArray(data.data.detailedDebts)) {
          debtsData = data.data.detailedDebts.map((debt: any) => ({
            id: debt.id || debt.order?.id || `debt-${Math.random()}`,
            dealerId: dealer.id,
            totalDebt: debt.totalAmount || debt.totalDebt || 0,
            paidAmount: debt.paidAmount || 0,
            dueDate: debt.dueDate || new Date().toISOString(),
            status: debt.status === 'PAID' ? 'PAID' : 
                   debt.status === 'OVERDUE' ? 'OVERDUE' : 
                   debt.paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
            createdAt: debt.order?.orderedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: debt.order,
            dealer: debt.dealer,
            vehicle: debt.vehicle,
            staff: debt.staff,
            isOverdue: debt.isOverdue || false,
            daysOverdue: debt.daysOverdue || 0
          }));
        }
        // Case 3: Data trực tiếp từ API công nợ
        else if (Array.isArray(data.data)) {
          debtsData = data.data.map((debt: any) => ({
            id: debt.id || `debt-${Math.random()}`,
            dealerId: dealer.id,
            totalDebt: debt.totalAmount || debt.totalDebt || 0,
            paidAmount: debt.paidAmount || 0,
            dueDate: debt.dueDate || new Date().toISOString(),
            status: debt.status === 'PAID' ? 'PAID' : 
                   debt.status === 'OVERDUE' ? 'OVERDUE' : 
                   debt.paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
            createdAt: debt.createdAt || new Date().toISOString(),
            updatedAt: debt.updatedAt || new Date().toISOString(),
            order: debt.order,
            dealer: debt.dealer,
            vehicle: debt.vehicle,
            staff: debt.staff,
            isOverdue: debt.isOverdue || false,
            daysOverdue: debt.daysOverdue || 0
          }));
        }

        console.log('📊 Formatted debts:', debtsData);
        setDebts(debtsData);
      } else {
        throw new Error(data.message || 'Failed to load debt data');
      }
    } catch (error: any) {
      console.error('❌ Failed to load debts:', error);
      setError(error.message || 'Không thể tải dữ liệu công nợ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, [dealer.id]);

  const handleRefresh = () => {
    loadDebts(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Đã thanh toán';
      case 'PARTIAL': return 'Thanh toán một phần';
      case 'OVERDUE': return 'Quá hạn';
      default: return 'Chưa thanh toán';
    }
  };

  const calculateRemainingDebt = (debt: DebtRecord) => {
    return debt.totalDebt - debt.paidAmount;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const totalDebt = debts.reduce((sum, debt) => sum + calculateRemainingDebt(debt), 0);
  const overdueDebts = debts.filter(debt => debt.status === 'OVERDUE' || debt.isOverdue);
  const partialDebts = debts.filter(debt => debt.status === 'PARTIAL');
  const unpaidDebts = debts.filter(debt => debt.status === 'UNPAID');

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-700 mt-4 font-medium">Đang tải thông tin công nợ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Theo dõi Công nợ Đại lý</h2>
                <p className="text-sm text-gray-700 font-medium">Đại lý: {dealer.name} ({dealer.code})</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className={`p-4 mb-6 rounded-xl ${
              error.includes('mẫu') 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <AlertTriangle className={`w-5 h-5 mr-2 ${
                  error.includes('mẫu') ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <p className={error.includes('mẫu') ? 'text-yellow-700' : 'text-red-700'}>
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-red-50 rounded-xl p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-red-700">Tổng công nợ</h3>
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(totalDebt)}
              </p>
              <p className="text-sm text-red-600 mt-1">{debts.length} khoản nợ</p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-yellow-700">Công nợ quá hạn</h3>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {formatCurrency(overdueDebts.reduce((sum, debt) => sum + calculateRemainingDebt(debt), 0))}
              </p>
              <p className="text-sm text-yellow-600 mt-1">{overdueDebts.length} khoản quá hạn</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-blue-700">Đang thanh toán</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(partialDebts.reduce((sum, debt) => sum + calculateRemainingDebt(debt), 0))}
              </p>
              <p className="text-sm text-blue-600 mt-1">{partialDebts.length} khoản đang trả</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Chưa thanh toán</h3>
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-600 mt-2">
                {formatCurrency(unpaidDebts.reduce((sum, debt) => sum + calculateRemainingDebt(debt), 0))}
              </p>
              <p className="text-sm text-gray-600 mt-1">{unpaidDebts.length} khoản chưa trả</p>
            </div>
          </div>

          {/* Debt List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Chi tiết công nợ ({debts.length})
              </h3>
              <div className="text-sm text-gray-600">
                Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}
              </div>
            </div>

            {debts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Không có công nợ nào</p>
                <p className="text-sm text-gray-500 mt-2">Đại lý này hiện không có khoản nợ nào với EVM</p>
              </div>
            ) : (
              debts.map((debt) => (
                <div key={debt.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">
                          {debt.order?.orderNumber || `Đơn hàng #${debt.id.slice(-6)}`}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(debt.status)}`}>
                          {getStatusText(debt.status)}
                          {debt.isOverdue && debt.daysOverdue && ` • ${debt.daysOverdue} ngày quá hạn`}
                        </span>
                      </div>
                      
                      {debt.vehicle && (
                        <p className="text-sm text-gray-700 font-medium">
                          {debt.vehicle.manufacturer?.name} {debt.vehicle.model} {debt.vehicle.variant}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        {debt.order?.orderedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Đặt hàng: {formatDate(debt.order.orderedAt)}
                          </div>
                        )}
                        {debt.order?.deliveredAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Giao hàng: {formatDate(debt.order.deliveredAt)}
                          </div>
                        )}
                        {debt.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Hạn thanh toán: {formatDate(debt.dueDate)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <button
                        onClick={() => {
                          setSelectedDebt(debt);
                          setShowPaymentModal(true);
                        }}
                        disabled={debt.status === 'PAID'}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        Ghi nhận thanh toán
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Tổng nợ</label>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(debt.totalDebt)}
                      </p>
                    </div>
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Đã thanh toán</label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(debt.paidAmount)}
                      </p>
                    </div>
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Còn nợ</label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(calculateRemainingDebt(debt))}
                      </p>
                    </div>
                    <div className="text-center">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Tiến độ</label>
                      <p className="text-lg font-bold text-blue-600">
                        {debt.totalDebt > 0 ? Math.round((debt.paidAmount / debt.totalDebt) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Tiến độ thanh toán</span>
                      <span>{debt.totalDebt > 0 ? Math.round((debt.paidAmount / debt.totalDebt) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${debt.totalDebt > 0 ? (debt.paidAmount / debt.totalDebt) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Staff info */}
                  {debt.staff && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Nhân viên đặt hàng: <span className="font-medium">{debt.staff.firstName} {debt.staff.lastName}</span>
                        {debt.staff.email && ` • ${debt.staff.email}`}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <PaymentModal
          debt={selectedDebt}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedDebt(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedDebt(null);
            loadDebts(true); // Refresh data after payment
          }}
        />
      )}
    </div>
  );
}