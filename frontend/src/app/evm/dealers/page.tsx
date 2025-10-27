'use client';
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  MapPin, 
  Phone, 
  Edit, 
  Trash2, 
  Eye, 
  Target,
  Building2,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { dealerApi } from '@/lib/api/dealerApi';
import { useAuth } from '@/contexts/AuthContext';
import CreateDealerModal from '@/components/dealers/CreateDealerModal';
import EditDealerModal from '@/components/dealers/EditDealerModal';
import DealerDetailsModal from '@/components/dealers/DealerDetailsModal';
import DealerStaffModal from '@/components/dealers/DealerStaffModal';
import DealerTargetsModal from '@/components/dealers/DealerTargetsModal';
import type { Dealer, Region, DealerFilters } from '@/components/dealers/types';

// Toast Component
function Toast({ message, isVisible, onClose, type = 'success' }: { 
  message: string; 
  isVisible: boolean; 
  onClose: () => void;
  type?: 'success' | 'error' | 'warning';
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600'
  }[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3`}>
        <CheckCircle className="w-5 h-5" />
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
}

// Confirmation Modal Component - CẬP NHẬT với cảnh báo
function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  isDeleting = false,
  hasTargets = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
  isDeleting?: boolean;
  hasTargets?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            {isDeleting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent"></div>
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isDeleting ? 'Đang xóa...' : title}
            </h3>
            <p className="text-sm text-gray-600">
              {isDeleting ? 'Vui lòng chờ trong giây lát...' : message}
            </p>

            {/* Cảnh báo về targets */}
            {hasTargets && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Đại lý có chỉ tiêu</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Đại lý này có chỉ tiêu đang hoạt động. Bạn có chắc bạn muốn xóa không?
                    </p>
                  </div>
                </div>
              </div>
            )}        
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2.5 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg ${
              isDeleting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isDeleting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang xóa...
              </div>
            ) : (
              'Xóa đại lý'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DealersPage() {
  const { user } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning'
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    dealer: null as Dealer | null,
    hasTargets: false
  });

  const [isDeleting, setIsDeleting] = useState(false);

  // State để lưu các dealer đã xóa tạm thời
  const [deletedDealers, setDeletedDealers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDealers();
    loadRegions();
  }, [page, selectedRegion, selectedStatus]);

  const loadDealers = async () => {
    setLoading(true);
    try {
      const filters: DealerFilters = {
        search: searchTerm || undefined,
        regionId: selectedRegion || undefined,
        isActive: selectedStatus === 'all' ? undefined : selectedStatus === 'active',
      };
  
      const pagination = { page, limit: 9 };
      const response = await dealerApi.getAllDealers(filters, pagination);
      
      console.log('Dealers API Response:', response);
      
      if (response.success) {
        const dealersData = response.data || [];
        const meta = response.meta?.pagination;
  
        // Lọc ra các dealer chưa bị xóa tạm thời
        const filteredDealers = dealersData.filter(dealer => !deletedDealers.has(dealer.id));
  
        setDealers(filteredDealers);
        setTotalPages(meta?.totalPages || 1);
        setTotal(meta?.total || dealersData.length);
      } else {
        throw new Error(response.message || 'Failed to load dealers');
      }
    } catch (error: any) {
      console.error('Failed to load dealers:', error);
      showToast(error.message || 'Không thể tải danh sách đại lý', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const response = await dealerApi.getAllRegions();
      if (response.success) {
        setRegions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load regions:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  // Kiểm tra đơn giản xem dealer có targets không (chỉ để hiển thị cảnh báo)
  const checkDealerHasTargets = async (dealer: Dealer): Promise<boolean> => {
    try {
      const targetsResponse = await dealerApi.getDealerTargets(dealer.id);
      return targetsResponse.success && targetsResponse.data && targetsResponse.data.length > 0;
    } catch (error) {
      console.error('Error checking dealer targets:', error);
      return false;
    }
  };

  const handleDelete = async (dealer: Dealer) => {
    // Kiểm tra nhanh xem có targets không để hiển thị cảnh báo
    const hasTargets = await checkDealerHasTargets(dealer);
    
    setConfirmModal({ 
      isOpen: true, 
      dealer,
      hasTargets
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal.dealer) return;

    setIsDeleting(true);

    try {
      console.log('🚀 Attempting to delete dealer:', {
        id: confirmModal.dealer.id,
        name: confirmModal.dealer.name,
        code: confirmModal.dealer.code,
        hasTargets: confirmModal.hasTargets
      });
      
      // Thử xóa thật trên server
      try {
        const response = await dealerApi.deleteDealer(confirmModal.dealer.id);
        
        if (response.success) {
          showToast(response.message || 'Đại lý đã được xóa thành công', 'success');
          loadDealers(); // Reload danh sách từ server
          setConfirmModal({ isOpen: false, dealer: null, hasTargets: false });
          setIsDeleting(false);
          return;
        }
      } catch (serverError: any) {
        console.log('❌ Server deletion failed, falling back to temporary deletion:', serverError);
        
        // Nếu server xóa thất bại, xóa tạm thời trên frontend
        setDeletedDealers(prev => new Set([...prev, confirmModal.dealer!.id]));
        
        // Cập nhật danh sách ngay lập tức
        setDealers(prev => prev.filter(dealer => dealer.id !== confirmModal.dealer!.id));
        
        showToast(
          confirmModal.hasTargets 
            ? 'Đã xóa đại lý khỏi danh sách tạm thời (có chỉ tiêu)'
            : 'Đã xóa đại lý khỏi danh sách tạm thời',
          'warning'
        );
      }
      
      setConfirmModal({ isOpen: false, dealer: null, hasTargets: false });
      
    } catch (error: any) {
      console.error('❌ Delete error details:', error);
      showToast('Có lỗi xảy ra khi xóa đại lý', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadDealers();
  };

  const getRegionName = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    return region?.name || 'Không xác định';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-100 text-red-700 border-red-200';
  };

  // Stats for dashboard
  const stats = {
    total: dealers.length,
    active: dealers.filter(d => d.isActive).length,
    inactive: dealers.filter(d => !d.isActive).length,
    byRegion: regions.map(region => ({
      region: region.name,
      count: dealers.filter(d => d.regionId === region.id).length
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header với cảnh báo */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">Quản lý Đại lý</h2>
                {deletedDealers.size > 0 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {deletedDealers.size} đã xóa tạm
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Quản lý hệ thống đại lý toàn quốc • {stats.total} đại lý ({stats.active} đang hoạt động)
                {deletedDealers.size > 0 && (
                  <span className="text-orange-600 font-medium">
                    • {deletedDealers.size} đại lý đã xóa tạm thời
                  </span>
                )}
              </p>
              
              {/* Cảnh báo về xóa tạm thời */}
              {deletedDealers.size > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Chế độ xóa tạm thời
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {deletedDealers.size} đại lý đã được xóa khỏi danh sách tạm thời. 
                        Dữ liệu sẽ hiển thị lại khi tải lại trang.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Thêm Đại lý
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1.5 text-blue-600" />
                Tìm kiếm đại lý
              </label>
              <input
                type="text"
                placeholder="Tìm theo tên, mã, thành phố..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1.5 text-purple-600" />
                Khu vực
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setPage(1);
                }}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
              >
                <option value="">Tất cả khu vực</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <CheckCircle className="w-4 h-4 inline mr-1.5 text-green-600" />
                Trạng thái
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive');
                  setPage(1);
                }}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Dealers Grid */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4 font-medium">Đang tải danh sách đại lý...</p>
          </div>
        ) : dealers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy đại lý nào
            </p>
            <p className="text-sm text-gray-500">
              Thử thay đổi bộ lọc hoặc thêm đại lý mới
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealers.map((dealer) => (
                <div key={dealer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 border rounded-full text-xs font-semibold ${getStatusColor(dealer.isActive)}`}>
                        {dealer.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === dealer.id ? null : dealer.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>

                        {openMenuId === dealer.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                              <button
                                onClick={() => {
                                  setSelectedDealer(dealer);
                                  setShowDetailsModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                Xem chi tiết
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDealer(dealer);
                                  setShowEditModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDealer(dealer);
                                  setShowStaffModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                              >
                                <Users className="w-4 h-4" />
                                Nhân viên đại lý
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDealer(dealer);
                                  setShowTargetsModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors"
                              >
                                <Target className="w-4 h-4" />
                                Chỉ tiêu
                              </button>
                              <div className="border-t my-2"></div>
                              <button
                                onClick={() => handleDelete(dealer)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa đại lý
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dealer Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{dealer.name}</h3>
                      <p className="text-sm text-gray-500">Mã: {dealer.code}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{getRegionName(dealer.regionId)}</span>
                        {dealer.city && <span>• {dealer.city}</span>}
                      </div>
                      {dealer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {dealer.phone}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{dealer._count?.users || 0}</div>
                        <div className="text-xs text-gray-500">Nhân viên</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{dealer._count?.inventories || 0}</div>
                        <div className="text-xs text-gray-500">Tồn kho</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{dealer._count?.dealerOrders || 0}</div>
                        <div className="text-xs text-gray-500">Đơn hàng</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium">
                  Trang <span className="font-bold text-blue-600">{page}</span> / {totalPages}
                  <span className="text-gray-500 ml-2">(Tổng: {total} đại lý)</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateDealerModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(message?: string) => {
              setShowCreateModal(false);
              loadDealers();
              if (message) showToast(message, 'success');
            }}
          />
        )}

        {showEditModal && selectedDealer && (
          <EditDealerModal
            dealer={selectedDealer}
            onClose={() => {
              setShowEditModal(false);
              setSelectedDealer(null);
            }}
            onSuccess={(message?: string) => {
              setShowEditModal(false);
              setSelectedDealer(null);
              loadDealers();
              if (message) showToast(message, 'success');
            }}
          />
        )}

        {showDetailsModal && selectedDealer && (
          <DealerDetailsModal
            dealer={selectedDealer}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedDealer(null);
            }}
          />
        )}

        {showStaffModal && selectedDealer && (
          <DealerStaffModal
            dealer={selectedDealer}
            onClose={() => {
              setShowStaffModal(false);
              setSelectedDealer(null);
            }}
          />
        )}

        {showTargetsModal && selectedDealer && (
          <DealerTargetsModal
            dealer={selectedDealer}
            onClose={() => {
              setShowTargetsModal(false);
              setSelectedDealer(null);
            }}
            onSuccess={(message?: string) => {
              if (message) showToast(message, 'success');
            }}
          />
        )}

        {/* Confirm Modal với cảnh báo */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, dealer: null, hasTargets: false })}
          onConfirm={confirmDelete}
          title="Xóa Đại lý"
          message={`Bạn có chắc muốn xóa đại lý "${confirmModal.dealer?.name}"?`}
          isDeleting={isDeleting}
          hasTargets={confirmModal.hasTargets}
        />

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => setToast({ ...toast, isVisible: false })}
          type={toast.type}
        />
      </div>
    </div>
  );
}