"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Loader, AlertTriangle, Info, CreditCard } from "lucide-react";
import dealerOrderApi, {
  DealerOrder,
  CreateDealerOrderInput,
  UpdateDealerOrderInput,
} from "@/lib/api/dealerOrderApi";
import { vehicleApi, Vehicle } from "@/lib/api/vehicleApi";
import { dealerApi, DealerDebtInfo } from "@/lib/api/dealerApi";
import { toast } from "react-hot-toast";
import LoanCalculator from '@/components/calculators/LoanCalculator';
import PromotionManager from '@/components/promotions/PromotionManager';
import DeliveryScheduler from '@/components/delivery/DeliveryScheduler';

interface DealerOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: DealerOrder) => void;
  order?: DealerOrder | null;
  dealerId: string;
  userId: string;
  userRole: 'DEALER_STAFF' | 'DEALER_MANAGER' | 'EVM_STAFF' | 'ADMIN';
  dealerInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  staffInfo: {
    firstName: string;
    lastName: string;
  };
}

// Config - ngưỡng công nợ tối đa (có thể điều chỉnh)
const MAX_DEBT_THRESHOLD = 50000000000; // 1 tỷ VND

export default function DealerOrderForm({
  isOpen,
  onClose,
  onSuccess,
  order,
  dealerId,
  userId,
  userRole,
  dealerInfo,
  staffInfo,
}: DealerOrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dealerDebt, setDealerDebt] = useState<number>(0);
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtInfo, setDebtInfo] = useState<DealerDebtInfo | null>(null);
  const [debtApiAvailable, setDebtApiAvailable] = useState<boolean>(true);
  
  const [formData, setFormData] = useState({
    vehicleId: "",
    quantity: 1,
    notes: "",
    promotionId: "",
    finalPrice: 0,
    installmentMonths: 0,
    monthlyPayment: 0,
    interestRate: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [appliedPromotion, setAppliedPromotion] = useState<{
    promotion: any;
    finalPrice: number;
    profit: number;
  } | null>(null);

  // Fetch available vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await vehicleApi.getAllVehicles(
          { status: "ACTIVE" },
          { limit: 100 }
        );
        const responseData = res.data.data || res.data;
        const vehiclesData = Array.isArray(responseData)
          ? responseData
          : responseData.data || [];
        setVehicles(vehiclesData);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        toast.error("Có lỗi xảy ra khi tải danh sách xe");
      }
    };

    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  // Fetch dealer debt information từ report API
  useEffect(() => {
    const fetchDealerDebt = async () => {
      if (!isOpen || !dealerId) return;
      
      setDebtLoading(true);
      try {
        console.log(`🔄 [DealerOrder] Fetching debt for dealer: ${dealerId}, role: ${userRole}`);
        
        // TRUYỀN userRole VÀO ĐÂY - chỉ sửa dòng này
        const debtData = await dealerApi.getDealerDebt(dealerId, userRole);
        
        setDebtInfo(debtData);
        setDealerDebt(debtData.totalDebt || 0);
        setDebtApiAvailable(true); // Luôn set là true vì dealer manager có quyền
        
        console.log('💰 [DealerOrder] Dealer debt info:', {
          totalDebt: debtData.totalDebt,
          overdueDebt: debtData.overdueDebt,
          creditLimit: debtData.creditLimit,
          availableCredit: debtData.availableCredit
        });
        
        // Hiển thị thông báo nếu vượt công nợ
        if (debtData.totalDebt > MAX_DEBT_THRESHOLD) {
          toast.error(`Đại lý đang vượt quá công nợ cho phép. Vui lòng thanh toán trước khi đặt thêm xe.`, {
            duration: 5000
          });
        }
        
      } catch (err: any) {
        console.error("❌ [DealerOrder] Error fetching dealer debt:", err);
        
        // Đánh dấu API không khả dụng nhưng vẫn cho phép đặt hàng
        setDebtApiAvailable(false);
        setDealerDebt(0);
        setDebtInfo({
          dealerId,
          totalDebt: 0,
          overdueDebt: 0,
          creditLimit: 5000000000,
          availableCredit: 5000000000,
          lastUpdated: new Date().toISOString()
        });
        
        toast("Tạm thời không thể kiểm tra công nợ. Đơn hàng vẫn có thể được tạo.", {
          icon: '⚠️',
          duration: 4000
        });
      } finally {
        setDebtLoading(false);
      }
    };

    fetchDealerDebt();
  }, [isOpen, dealerId, userRole]);

  // Initialize form when editing
  useEffect(() => {
    if (order) {
      setFormData({
        vehicleId: order.vehicleId,
        quantity: order.quantity,
        notes: order.notes || "",
        promotionId: "",
        finalPrice: 0,
        installmentMonths: 0,
        monthlyPayment: 0,
        interestRate: 0,
      });
      // Find and set selected vehicle
      const vehicle = vehicles.find((v) => v.id === order.vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    } else {
      setFormData({
        vehicleId: "",
        quantity: 1,
        notes: "",
        promotionId: "",
        finalPrice: 0,
        installmentMonths: 0,
        monthlyPayment: 0,
        interestRate: 0,
      });
      setSelectedVehicle(null);
      setAppliedPromotion(null);
    }
    setErrors({});
  }, [order, vehicles]);

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    setFormData((prev) => ({ 
      ...prev, 
      vehicleId,
      promotionId: "",
      finalPrice: 0 
    }));
    setAppliedPromotion(null);
  };

  // Kiểm tra xem đại lý có vượt quá công nợ cho phép không
  const isDebtExceeded = () => {
    // Nếu API debt không khả dụng, luôn trả về false để cho phép đặt hàng
    if (!debtApiAvailable) return false;
    return dealerDebt > MAX_DEBT_THRESHOLD;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Chỉ kiểm tra công nợ nếu API khả dụng
    if (debtApiAvailable && isDebtExceeded()) {
      newErrors.debt = `Đại lý đang vượt quá công nợ cho phép (${MAX_DEBT_THRESHOLD.toLocaleString()} VND). Vui lòng thanh toán công nợ trước khi đặt thêm xe.`;
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = "Vui lòng chọn xe";
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (formData.quantity > 100) {
      newErrors.quantity = "Số lượng tối đa là 100 xe";
    }

    // Kiểm tra nếu có áp dụng khuyến mãi mà lợi nhuận âm
    if (appliedPromotion && appliedPromotion.profit < 0) {
      newErrors.promotion = "Không thể áp dụng khuyến mãi này vì lợi nhuận âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        dealerId,
        staffId: userId,
        vehicleId: formData.vehicleId,
        quantity: formData.quantity,
        notes: formData.notes,
        // Chỉ gửi promotionId nếu có (và chỉ áp dụng mã từ hãng)
        ...(formData.promotionId && { promotionId: formData.promotionId }),
        ...(formData.finalPrice > 0 && { finalPrice: formData.finalPrice }),
        ...(formData.installmentMonths > 0 && { installmentMonths: formData.installmentMonths }),
        ...(formData.monthlyPayment > 0 && { monthlyPayment: formData.monthlyPayment }),
        ...(formData.interestRate > 0 && { interestRate: formData.interestRate }),
      };

      let result;
      if (order) {
        // Update existing order
        const loadingToast = toast.loading("Đang cập nhật đơn hàng...");
        const updateData: UpdateDealerOrderInput = {
          quantity: formData.quantity,
          notes: formData.notes,
        };
        result = await dealerOrderApi.updateDealerOrder(order.id, updateData);
        toast.dismiss(loadingToast);
        toast.success("Cập nhật đơn hàng thành công!");
      } else {
        // Create new order
        const loadingToast = toast.loading("Đang tạo đơn hàng...");
        result = await dealerOrderApi.createDealerOrder(
          orderData as CreateDealerOrderInput
        );
        toast.dismiss(loadingToast);
        toast.success("Tạo đơn hàng thành công!");
      }

      const responseData = result.data.data || result.data;
      onSuccess(responseData);
      onClose();
    } catch (err: any) {
      console.error("Error saving order:", err);
      const errorMessage =
        err.response?.data?.message || "Có lỗi xảy ra khi lưu đơn hàng";
      setErrors({ submit: errorMessage });
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedVehicle) return 0;
    return Number(selectedVehicle.wholesalePrice) * formData.quantity;
  };

  const getCurrentRetailPrice = () => {
    if (!selectedVehicle) return 0;
    return appliedPromotion ? appliedPromotion.finalPrice : Number(selectedVehicle.retailPrice);
  };

  // Điều kiện disabled: loading, lợi nhuận âm, hoặc vượt công nợ (chỉ khi API khả dụng)
  const isSubmitDisabled = loading || 
    (appliedPromotion !== null && appliedPromotion.profit < 0) || 
    (debtApiAvailable && isDebtExceeded());

  if (!isOpen) return null;

  // Helper function để format tiền
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
        {/* Header - cố định */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {order ? "Chỉnh sửa đơn hàng" : "Tạo đơn đặt xe mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dealer Info với công nợ - CẢI THIỆN HIỂN THỊ */}
          <div className={`p-4 rounded-lg border ${
            isDebtExceeded() ? 'bg-red-50 border-red-200' : 
            !debtApiAvailable ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className={`w-5 h-5 ${
                isDebtExceeded() ? 'text-red-600' : 
                !debtApiAvailable ? 'text-yellow-600' : 'text-blue-600'
              }`} />
              <h3 className={`font-semibold ${
                isDebtExceeded() ? 'text-red-900' : 
                !debtApiAvailable ? 'text-yellow-900' : 'text-blue-900'
              }`}>
                Thông tin đại lý
              </h3>
              {isDebtExceeded() && <AlertTriangle className="w-5 h-5 text-red-600" />}
              {!debtApiAvailable && <Info className="w-5 h-5 text-yellow-600" />}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={`font-medium ${
                  isDebtExceeded() ? 'text-red-800' : 
                  !debtApiAvailable ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  {dealerInfo.name}
                </p>
                {dealerInfo.address && (
                  <p className={`text-sm ${
                    isDebtExceeded() ? 'text-red-700' : 
                    !debtApiAvailable ? 'text-yellow-700' : 'text-blue-700'
                  }`}>
                    📍 {dealerInfo.address}
                  </p>
                )}
              </div>
              
              {/* <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    isDebtExceeded() ? 'text-red-700' : 
                    !debtApiAvailable ? 'text-yellow-700' : 'text-blue-700'
                  }`}>
                    Công nợ hiện tại:
                  </span>
                  <span className={`font-bold ${
                    isDebtExceeded() ? 'text-red-800' : 
                    !debtApiAvailable ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {debtLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      formatCurrency(dealerDebt)
                    )}
                  </span>
                </div>

                {debtInfo && debtInfo.creditLimit && (
                  <div className="flex justify-between items-center text-sm">
                    <span className={
                      isDebtExceeded() ? 'text-red-600' : 
                      !debtApiAvailable ? 'text-yellow-600' : 'text-blue-600'
                    }>
                      Hạn mức tín dụng:
                    </span>
                    <span className={
                      isDebtExceeded() ? 'text-red-700' : 
                      !debtApiAvailable ? 'text-yellow-700' : 'text-blue-700'
                    }>
                      {formatCurrency(debtInfo.creditLimit)}
                    </span>
                  </div>
                )}
              </div> */}
            </div>
            
            {/* Thông báo trạng thái */}
            <div className="mt-3 pt-3 border-t border-current/20">
              {!debtApiAvailable && (
                <div className="flex items-center gap-2 text-yellow-700 text-sm">
                  <Info className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Hệ thống kiểm tra công nợ tạm thời không khả dụng</p>
                    <p>Đơn hàng vẫn có thể được tạo. Liên hệ EVM nếu cần kiểm tra công nợ.</p>
                  </div>
                </div>
              )}
              
              {isDebtExceeded() && (
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <div>
                    <p className="font-medium">⚠️ Vượt quá công nợ cho phép</p>
                    <p>Giới hạn: {formatCurrency(MAX_DEBT_THRESHOLD)}. Vui lòng thanh toán công nợ trước khi đặt thêm xe.</p>
                  </div>
                </div>
              )}

              {debtApiAvailable && !isDebtExceeded() && dealerDebt > 0 && (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Info className="w-4 h-4" />
                  <p>Đại lý trong hạn mức công nợ cho phép.</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Người tạo đơn</h3>
            <p className="text-gray-800">
              {staffInfo.firstName} {staffInfo.lastName}
            </p>
            <p className="text-gray-600 text-sm mt-1">Vai trò: {userRole}</p>
          </div>

          {/* Lỗi công nợ */}
          {errors.debt && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Không thể tạo đơn hàng</p>
                  <p className="text-sm">{errors.debt}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn xe <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              disabled={!!order || (debtApiAvailable && isDebtExceeded())}
            >
              <option value="">Chọn xe</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.manufacturer?.name} {vehicle.model} {vehicle.variant} -
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(vehicle.wholesalePrice))}
                </option>
              ))}
            </select>
            {errors.vehicleId && (
              <p className="text-red-500 text-sm mt-1">{errors.vehicleId}</p>
            )}
          </div>

          {/* Vehicle Details */}
          {selectedVehicle && (
            <div className="bg-green-50 p-4 rounded-lg text-green-800">
              <h4 className="font-medium text-green-900 mb-2">Thông tin xe</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-green-700">Hãng:</span>{" "}
                  {selectedVehicle.manufacturer?.name}
                </div>
                <div>
                  <span className="text-green-700">Model:</span>{" "}
                  {selectedVehicle.model}
                </div>
                <div>
                  <span className="text-green-700">Phiên bản:</span>{" "}
                  {selectedVehicle.variant}
                </div>
                <div>
                  <span className="text-green-700">Năm:</span>{" "}
                  {selectedVehicle.year}
                </div>
                <div>
                  <span className="text-green-700">Giá sỉ:</span>{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(selectedVehicle.wholesalePrice))}
                </div>
                <div>
                  <span className="text-green-700">Giá lẻ:</span>{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(selectedVehicle.retailPrice))}
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  quantity: parseInt(e.target.value) || 1,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              disabled={debtApiAvailable && isDebtExceeded()}
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Price Calculation */}
          {selectedVehicle && (
            <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800">
              <h4 className="font-medium text-yellow-900 mb-2">
                Tính toán giá
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Đơn giá (sỉ):</span>
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(selectedVehicle.wholesalePrice))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Số lượng:</span>
                  <span>{formData.quantity} xe</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-yellow-200 pt-1">
                  <span className="text-yellow-900">Tổng tiền:</span>
                  <span className="text-yellow-900">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Promotion Manager - CHỈ cho phép khuyến mãi từ hãng */}
          {selectedVehicle && (
            <PromotionManager
              vehicle={{
                id: selectedVehicle.id,
                name: `${selectedVehicle.manufacturer?.name} ${selectedVehicle.model}`,
                retailPrice: Number(selectedVehicle.retailPrice),
                wholesalePrice: Number(selectedVehicle.wholesalePrice)
              }}
              retailPrice={Number(selectedVehicle.retailPrice)}
              wholesalePrice={Number(selectedVehicle.wholesalePrice)}
              userRole={userRole}
              userId={userId}
              userName={`${staffInfo.firstName} ${staffInfo.lastName}`}
              dealerId={dealerId}
              allowedPromotionSources={['MANUFACTURER']}
              onPromotionApplied={(promotion, finalPrice, profit) => {
                setAppliedPromotion({ promotion, finalPrice, profit });
                setFormData(prev => ({
                  ...prev,
                  promotionId: promotion.id,
                  finalPrice: finalPrice,
                }));
              }}
            />
          )}

          {/* Hiển thị khuyến mãi đã áp dụng */}
          {appliedPromotion && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">✅ Khuyến mãi đã áp dụng</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div className="flex justify-between">
                  <span>Mã khuyến mãi:</span>
                  <span className="font-medium">{appliedPromotion.promotion.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nguồn:</span>
                  <span className="font-medium">
                    {appliedPromotion.promotion.source === 'MANUFACTURER' ? 'Từ hãng' : 'Từ đại lý'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá bán cuối:</span>
                  <span className="font-medium">{appliedPromotion.finalPrice.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between">
                  <span>Lợi nhuận dự kiến:</span>
                  <span className={`font-medium ${
                    appliedPromotion.profit >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {appliedPromotion.profit.toLocaleString()} VND
                  </span>
                </div>
              </div>
              {appliedPromotion.profit < 0 && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  ⚠️ Cảnh báo: Lợi nhuận âm! Không thể tạo đơn hàng.
                </p>
              )}
            </div>
          )}

          {/* Lỗi khuyến mãi */}
          {errors.promotion && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errors.promotion}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              placeholder="Thêm ghi chú cho đơn hàng (tùy chọn)..."
              disabled={debtApiAvailable && isDebtExceeded()}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Actions - cố định ở dưới */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200">
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {order ? "Cập nhật" : "Tạo đơn hàng"}
              {isDebtExceeded() && " (Bị chặn)"}
              {!debtApiAvailable && " (Không kiểm tra công nợ)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}