'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { promotionApi } from '@/lib/api/promotionApi';
import { Promotion } from '@/lib/types/promotion.types';

import { 
  Plus, 
  Edit, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Search,
  Filter,
  Percent,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function PromotionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isManager = user?.role === 'DEALER_MANAGER';

  // Fetch promotions
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const storedDealerId = typeof window !== 'undefined' ? localStorage.getItem('dealerId') : null;
      const dealerId = storedDealerId || (user as any)?.dealerId;
      
      if (!dealerId) throw new Error('Không tìm thấy thông tin đại lý. Vui lòng đăng nhập lại.');

      const data = await promotionApi.getByDealerId(dealerId, isManager);
      setPromotions(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khuyến mãi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter promotions
  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (promo.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' ||
                         (filterActive === 'active' && promo.isActive) ||
                         (filterActive === 'inactive' && !promo.isActive);

    return matchesSearch && matchesFilter;
  });

  // Handle toggle status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isManager) return;
    
    try {
      setTogglingId(id);
      await promotionApi.toggleStatus(id);
      setPromotions(prev => prev.map(p => 
        p.id === id ? { ...p, isActive: !currentStatus } : p
      ));
    } catch (err) {
      alert('Không thể thay đổi trạng thái khuyến mãi');
    } finally {
      setTogglingId(null);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!isManager || !confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;

    try {
      setDeletingId(id);
      await promotionApi.delete(id);
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Không thể xóa khuyến mãi');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper: Format tiền Việt Nam với dấu chấm phân cách nghìn và ₫
  const formatVND = (value: number) => {
    // Xử lý thủ công để đảm bảo dấu chấm
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${parts.join('.')} ₫`;
  };

  // Format discount display
  const formatDiscount = (promo: Promotion) => {
    if (promo.discountType === 'PERCENTAGE') {
      return `${promo.discountValue}%`;
    }
    // FIXED: Format VND với dấu chấm và ₫
    return formatVND(promo.discountValue);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  // Check if promotion is active based on dates
  const isDateActive = (start: string | Date, end?: string | Date | null) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    return startDate <= now && (!endDate || endDate >= now);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mã Khuyến Mãi</h1>
            <p className="text-gray-700 mt-1">Quản lý các chương trình khuyến mãi của đại lý</p>
          </div>
          
          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Tạo khuyến mãi
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm khuyến mãi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-600"
              />
            </div>
            
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>
        </div>

        {/* Promotions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Percent className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-700">Không có khuyến mãi nào</p>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Tạo khuyến mãi đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPromotions.map((promo) => {
              const dateActive = isDateActive(promo.startDate, promo.endDate);
              const canActivate = promo.isActive && dateActive;
              
              return (
                <div
                  key={promo.id}
                  className={`bg-white rounded-lg shadow-sm border ${
                    canActivate ? 'border-green-200' : 'border-gray-200'
                  } p-6 hover:shadow-md transition`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{promo.name}</h3>
                      {promo.description && (
                        <p className="text-sm text-gray-700 mt-1">{promo.description}</p>
                      )}
                    </div>
                    
                    {canActivate && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Đang áp dụng
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      {promo.discountType === 'PERCENTAGE' ? (
                        <Percent className="w-4 h-4 text-gray-500" />
                      ) : (
                        <span className="text-gray-500 font-bold">₫</span>
                      )}
                      <span className="font-medium text-gray-900">{formatDiscount(promo)}</span>
                      <span className="text-gray-700">
                        ({promo.discountType === 'PERCENTAGE' ? 'Giảm phần trăm' : 'Giảm số tiền cố định'})
                      </span>
                    </div>
                    
                    {promo.minPurchase && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-gray-500 font-bold">₫</span>
                        <span>Tối thiểu: {formatVND(promo.minPurchase)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(promo.startDate)}</span>
                      {promo.endDate && (
                        <> - {formatDate(promo.endDate)}</>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-medium ${
                      promo.isActive ? 'text-green-600' : 'text-gray-700'
                    }`}>
                      {promo.isActive ? 'Đã kích hoạt' : 'Đã tắt'}
                    </span>
                    
                    {isManager && (
                      <button
                        onClick={() => handleToggleStatus(promo.id, promo.isActive)}
                        disabled={togglingId === promo.id}
                        className="disabled:opacity-50"
                      >
                        {togglingId === promo.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : promo.isActive ? (
                          <ToggleRight className="w-8 h-8 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  {isManager && (
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => router.push(`/dealer/promotions/edit/${promo.id}`)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                      >
                        <Edit className="w-4 h-4" />
                        Sửa
                      </button>
                      
                      <button
                        onClick={() => handleDelete(promo.id)}
                        disabled={deletingId === promo.id}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                      >
                        {deletingId === promo.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Tạo khuyến mãi mới</h2>
            <p className="text-gray-600 mb-4">
              Tính năng tạo khuyến mãi sẽ được triển khai ở phiên bản tiếp theo.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}