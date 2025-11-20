'use client';
import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Calculator,
  User,
  Shield,
  Loader,
  Edit,
  Building,
  Package // Thêm icon cho giá sỉ
} from 'lucide-react';
import { promotionApi } from '@/lib/api/promotionApi';
import { Promotion, AvailablePromotionsResponse } from '@/lib/types/promotion.types';
import { toast } from 'react-hot-toast';

interface Vehicle {
  id: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
}

interface PromotionManagerProps {
  vehicle?: Vehicle;
  retailPrice: number;
  wholesalePrice: number; // Thêm wholesalePrice
  userRole: 'DEALER_STAFF' | 'DEALER_MANAGER' | 'EVM_STAFF' | 'ADMIN';
  userId: string;
  userName: string;
  dealerId: string;
  allowedPromotionSources?: ('DEALER' | 'MANUFACTURER')[];
  onPromotionApplied?: (promotion: Promotion, finalPrice: number, profit: number) => void;
}

export default function PromotionManager({
  vehicle,
  retailPrice,
  wholesalePrice, // Nhận wholesalePrice từ props
  userRole,
  userId,
  userName,
  dealerId,
  allowedPromotionSources = ['DEALER', 'MANUFACTURER'],
  onPromotionApplied
}: PromotionManagerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dealerPromotions, setDealerPromotions] = useState<Promotion[]>([]);
  const [manufacturerPromotions, setManufacturerPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'dealer' | 'manufacturer'>('all');

  const [calculation, setCalculation] = useState<{
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    profit: number;
    isValid: boolean;
  } | null>(null);

  // Fetch promotions từ API
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        
        const response: AvailablePromotionsResponse = await promotionApi.getAvailablePromotions(dealerId, false);
        
        // Lọc promotions theo nguồn được phép
        const filteredDealerPromotions = filterPromotionsBySource(response.dealerPromotions || []);
        const filteredManufacturerPromotions = filterPromotionsBySource(response.manufacturerPromotions || []);
        const filteredAllPromotions = filterPromotionsBySource(response.allPromotions || []);
        
        setDealerPromotions(filteredDealerPromotions);
        setManufacturerPromotions(filteredManufacturerPromotions);
        setPromotions(filteredAllPromotions);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        toast.error('Lỗi khi tải danh sách khuyến mãi');
        setPromotions([]);
        setDealerPromotions([]);
        setManufacturerPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    if (dealerId) {
      fetchPromotions();
    }
  }, [dealerId, allowedPromotionSources]);

  // Lọc promotions theo allowedPromotionSources
  const filterPromotionsBySource = (promotionsList: Promotion[]) => {
    return promotionsList.filter(promotion => 
      allowedPromotionSources.includes(promotion.source)
    );
  };

  // Lọc promotions theo tab active và nguồn được phép
  const getFilteredPromotions = () => {
    let filtered = [];
    switch (activeTab) {
      case 'dealer':
        filtered = dealerPromotions;
        break;
      case 'manufacturer':
        filtered = manufacturerPromotions;
        break;
      default:
        filtered = promotions;
        break;
    }
    
    return filtered;
  };

  // SỬA LẠI: Tính toán giá và lợi nhuận - GIẢM TRÊN GIÁ SỈ
  const calculatePromotion = async (promotion: Promotion) => {
    try {
      setApplying(true);
      
      let discountAmount = 0;
      
      // SỬA: Tính giảm giá trên wholesalePrice thay vì retailPrice
      if (promotion.discountType === 'PERCENTAGE') {
        discountAmount = wholesalePrice * (promotion.discountValue / 100);
      } else {
        discountAmount = promotion.discountValue;
      }

      // Kiểm tra điều kiện min purchase (vẫn dùng retail price để kiểm tra)
      if (promotion.minPurchase && retailPrice < promotion.minPurchase) {
        toast.error(`Khuyến mãi yêu cầu giá trị đơn hàng tối thiểu ${promotion.minPurchase.toLocaleString()} VND`);
        return;
      }

      // SỬA: Tính giá cuối cùng sau khuyến mãi (trên giá sỉ)
      const finalPrice = wholesalePrice - discountAmount;
      
      // SỬA: Tính lợi nhuận = giá bán lẻ - giá sỉ sau khuyến mãi
      const profit = retailPrice - finalPrice;
      
      const isValid = profit >= 0;

      setCalculation({
        originalPrice: wholesalePrice, // Hiển thị giá sỉ gốc
        discountAmount,
        finalPrice,
        profit,
        isValid
      });

      setSelectedPromotion(promotion);
    } catch (error) {
      console.error('Error calculating promotion:', error);
      toast.error('Lỗi khi tính toán khuyến mãi');
    } finally {
      setApplying(false);
    }
  };

  // Staff tạo khuyến mãi mới - CHỈ cho phép tạo khuyến mãi dealer nếu được phép
  const handleCreatePromotion = async (formData: any) => {
    try {
      // Kiểm tra xem có được phép tạo khuyến mãi dealer không
      if (!allowedPromotionSources.includes('DEALER')) {
        toast.error('Bạn không được phép tạo khuyến mãi từ đại lý');
        return;
      }

      const promotionData = {
        ...formData,
        dealerId,
        source: 'DEALER', // Luôn là DEALER khi staff tạo
        isActive: userRole === 'DEALER_MANAGER' || userRole === 'ADMIN' || userRole === 'EVM_STAFF'
      };

      const newPromotion = await promotionApi.create(promotionData);
      
      setPromotions(prev => [...prev, newPromotion]);
      setDealerPromotions(prev => [...prev, newPromotion]);
      
      setShowForm(false);
      toast.success('Tạo khuyến mãi thành công!');

      if (userRole === 'DEALER_MANAGER' || userRole === 'ADMIN' || userRole === 'EVM_STAFF') {
        calculatePromotion(newPromotion);
      }
    } catch (error: any) {
      console.error('Error creating promotion:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tạo khuyến mãi');
    }
  };

  // Manager duyệt/ từ chối (toggle status)
  const handleTogglePromotion = async (promotionId: string) => {
    try {
      const updatedPromotion = await promotionApi.toggleStatus(promotionId);
      
      const updatePromotions = (prev: Promotion[]) => 
        prev.map(p => p.id === promotionId ? updatedPromotion : p);
      
      setPromotions(updatePromotions);
      setDealerPromotions(updatePromotions);
      setManufacturerPromotions(updatePromotions);
      
      toast.success(`Đã ${updatedPromotion.isActive ? 'kích hoạt' : 'vô hiệu hóa'} khuyến mãi`);
    } catch (error: any) {
      console.error('Error toggling promotion:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật khuyến mãi');
    }
  };

  // Áp dụng khuyến mãi
  const handleApplyPromotion = () => {
    if (selectedPromotion && calculation) {
      onPromotionApplied?.(selectedPromotion, calculation.finalPrice, calculation.profit);
      toast.success(`Đã áp dụng khuyến mãi ${selectedPromotion.name}`);
    }
  };

  const canCreatePromotion = (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER' || userRole === 'ADMIN' || userRole === 'EVM_STAFF') && 
                            allowedPromotionSources.includes('DEALER');
  const canTogglePromotion = userRole === 'DEALER_MANAGER' || userRole === 'ADMIN' || userRole === 'EVM_STAFF';
  const canEditPromotion = (promotion: Promotion) => 
    promotion.source === 'DEALER' && (userRole === 'DEALER_MANAGER' || userRole === 'ADMIN' || userRole === 'EVM_STAFF');

  // Kiểm tra xem tab có bị disable không
  const isTabDisabled = (tab: 'dealer' | 'manufacturer') => {
    if (tab === 'dealer' && !allowedPromotionSources.includes('DEALER')) return true;
    if (tab === 'manufacturer' && !allowedPromotionSources.includes('MANUFACTURER')) return true;
    return false;
  };

  const filteredPromotions = getFilteredPromotions();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Đang tải khuyến mãi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-800">Quản lý khuyến mãi</h3>
          {/* Hiển thị thông tin về nguồn khuyến mãi được phép */}
          {allowedPromotionSources.length === 1 && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
              Chỉ {allowedPromotionSources[0] === 'MANUFACTURER' ? 'khuyến mãi từ hãng' : 'khuyến mãi từ đại lý'}
            </span>
          )}
        </div>
        {canCreatePromotion && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Tạo khuyến mãi
          </button>
        )}
      </div>

      {/* Thông báo khi không có khuyến mãi nào được phép */}
      {allowedPromotionSources.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Không có khuyến mãi nào được phép áp dụng</span>
          </div>
        </div>
      )}

      {/* Danh sách khuyến mãi */}
      <div className="space-y-4">
        {filteredPromotions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có khuyến mãi nào</p>
            {activeTab !== 'all' && (
              <p className="text-sm mt-1">Thử chọn tab "Tất cả" để xem tất cả khuyến mãi</p>
            )}
          </div>
        ) : (
          filteredPromotions.map((promotion) => (
            <div
              key={promotion.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPromotion?.id === promotion.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              } ${
                !promotion.isActive ? 'bg-gray-50 border-gray-300 opacity-60' : ''
              }`}
              onClick={() => promotion.isActive && calculatePromotion(promotion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{promotion.name}</span>
                    {promotion.code && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-mono">
                        {promotion.code}
                      </span>
                    )}
                    {promotion.source === 'MANUFACTURER' ? (
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">Từ hãng</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-600">Từ đại lý</span>
                      </div>
                    )}
                    {!promotion.isActive && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        Đã vô hiệu
                      </span>
                    )}
                    {promotion.source === 'DEALER' && promotion.isEditable && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        Có thể chỉnh sửa
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="font-medium">
                      {promotion.discountType === 'PERCENTAGE' 
                        ? `Giảm ${promotion.discountValue}%`
                        : `Giảm ${promotion.discountValue.toLocaleString()} VND`
                      }
                    </span>
                    {promotion.minPurchase && (
                      <span>Đơn tối thiểu: {promotion.minPurchase.toLocaleString()} VND</span>
                    )}
                  </div>

                  {promotion.description && (
                    <p className="text-sm text-gray-600 mb-2">{promotion.description}</p>
                  )}

                  {/* Hiển thị vehicle units nếu có */}
                  {promotion.vehicleUnits && promotion.vehicleUnits.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Áp dụng cho:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {promotion.vehicleUnits.slice(0, 3).map((unit: any) => (
                          <span
                            key={unit.id}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                          >
                            {unit.vehicleUnit?.vehicle?.manufacturer?.name} {unit.vehicleUnit?.vehicle?.model}
                          </span>
                        ))}
                        {promotion.vehicleUnits.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{promotion.vehicleUnits.length - 3} xe khác
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Hiệu lực: {new Date(promotion.startDate).toLocaleDateString('vi-VN')}</span>
                    {promotion.endDate && (
                      <span>Hết hạn: {new Date(promotion.endDate).toLocaleDateString('vi-VN')}</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      promotion.source === 'MANUFACTURER' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {promotion.source === 'MANUFACTURER' ? 'Từ hãng' : 'Từ đại lý'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {canTogglePromotion && promotion.source === 'DEALER' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePromotion(promotion.id);
                      }}
                      className={`px-3 py-1 text-sm rounded ${
                        promotion.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {promotion.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                    </button>
                  )}
                  
                  {canEditPromotion(promotion) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast('Tính năng chỉnh sửa sẽ được triển khai sau');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  {promotion.isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        calculatePromotion(promotion);
                      }}
                      disabled={applying}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {applying ? '...' : 'Áp dụng'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Kết quả tính toán */}
      {calculation && selectedPromotion && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Kết quả tính toán
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Giá sỉ gốc:</span>
              <p className="font-semibold text-gray-900">{calculation.originalPrice.toLocaleString()} VND</p>
            </div>
            <div>
              <span className="text-gray-600">Giảm giá:</span>
              <p className="font-semibold text-red-600">-{calculation.discountAmount.toLocaleString()} VND</p>
            </div>
            <div>
              <span className="text-gray-600">Giá sỉ sau KM:</span>
              <p className="font-semibold text-green-600">{calculation.finalPrice.toLocaleString()} VND</p>
            </div>
            <div>
              <span className="text-gray-600">Lợi nhuận:</span>
              <p className={`font-semibold ${
                calculation.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculation.profit.toLocaleString()} VND
                {calculation.profit >= 0 ? (
                  <TrendingUp className="w-4 h-4 inline ml-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 inline ml-1" />
                )}
              </p>
            </div>
          </div>

          {!calculation.isValid && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Cảnh báo: Lợi nhuận âm!</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Giá sỉ sau khuyến mãi thấp hơn giá nhập từ hãng. 
                Không thể áp dụng khuyến mãi này.
              </p>
            </div>
          )}

          {calculation.isValid && (
            <button
              onClick={handleApplyPromotion}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Áp dụng khuyến mãi
            </button>
          )}
        </div>
      )}

      {/* Form tạo khuyến mãi */}
      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Tạo khuyến mãi mới</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center py-8 text-gray-500">
                <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Tính năng đang phát triển</p>
                <p className="text-sm">Form tạo khuyến mãi sẽ được triển khai ở phiên bản tiếp theo</p>
                <p className="text-sm mt-1">Hiện tại bạn có thể sử dụng các khuyến mãi có sẵn</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}