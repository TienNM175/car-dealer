// frontend/src/components/contracts/ContractForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Car,
  DollarSign,
  Calendar,
  FileText,
  Calculator,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import {
  Contract,
  CreateContractInput,
  contractApi,
} from "@/lib/api/contractApi";
import { customerApi, Customer } from "@/lib/api/customerApi";
import { vehicleApi, Vehicle } from "@/lib/api/vehicleApi";
import { promotionApi } from "@/lib/api/promotionApi";
import { quotationApi, Quotation } from "@/lib/api/quotationApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contract: any) => void;
  contract?: Contract | null; // For editing
  selectedCustomer?: Customer | null;
  selectedVehicle?: Vehicle | null;
  selectedQuotation?: Quotation | null; // For creating contract from quotation
  dealerId?: string; // Add dealerId for fetching promotions
  userId?: string; // Add userId to set as staffId
}

export default function ContractForm({
  isOpen,
  onClose,
  onSuccess,
  contract,
  selectedCustomer,
  selectedVehicle,
  selectedQuotation,
  dealerId,
  userId,
}: ContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");

  const [formData, setFormData] = useState<CreateContractInput>({
    customerId: "",
    vehicleId: "",
    staffId: "", // Required by backend
    quotationId: "",
    promotionId: "",
    basePrice: 0, // Changed from totalAmount
    discount: 0,
    paymentType: "FULL",
    installmentMonths: 24,
    interestRate: 12, // Default 12% annual rate
    deliveryDate: "",
    notes: "",
  });

  // Separate state for promotion selection (UI only)
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculated values
  const finalPrice = formData.basePrice - (formData.discount || 0);

  // Proper installment calculation with interest (matching backend logic)
  const calculateMonthlyPayment = () => {
    if (
      formData.paymentType !== "INSTALLMENT" ||
      !formData.installmentMonths ||
      !formData.interestRate
    ) {
      return 0;
    }

    const principal = finalPrice;
    const monthlyRate = (formData.interestRate || 0) / 100 / 12;
    const numberOfPayments = formData.installmentMonths;

    if (monthlyRate === 0) return principal / numberOfPayments;

    // Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return Math.round(monthlyPayment * 100) / 100;
  };

  const monthlyPayment = calculateMonthlyPayment();
  const totalInstallmentAmount =
    formData.paymentType === "INSTALLMENT"
      ? monthlyPayment * (formData.installmentMonths || 0)
      : finalPrice;

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (contract) {
        // Edit mode - populate form
        setFormData({
          customerId: contract.customerId,
          vehicleId: contract.vehicleId,
          staffId: contract.staffId,
          basePrice: contract.basePrice,
          discount: contract.discount || 0,
          paymentType: contract.paymentType,
          installmentMonths: contract.installmentMonths || 24,
          interestRate: contract.interestRate || 12,
          deliveryDate: contract.deliveryDate || "",
          notes: contract.notes || "",
        });
        // Reset promotion selection in edit mode
        setSelectedPromotionId("");
      } else if (selectedQuotation) {
        // Create from quotation - populate form with quotation data
        setFormData((prev) => ({
          ...prev,
          customerId: selectedQuotation.customerId,
          vehicleId: selectedQuotation.vehicleId,
          staffId: userId || selectedQuotation.staffId,
          quotationId: selectedQuotation.id,
          promotionId: "",
          basePrice: selectedQuotation.basePrice,
          discount: selectedQuotation.discount,
          paymentType: selectedQuotation.paymentType,
          installmentMonths: selectedQuotation.installmentMonths || 24,
          interestRate: 12, // Default rate, can be updated
          deliveryDate: "",
          notes:
            selectedQuotation.notes ||
            `Tạo từ báo giá ${selectedQuotation.quoteNumber}`,
        }));
        setSelectedPromotionId("");
      } else {
        // Create mode - set selected customer/vehicle
        setFormData((prev) => ({
          ...prev,
          customerId: selectedCustomer?.id || "",
          vehicleId: selectedVehicle?.id || "",
          staffId: userId || "", // Set from user context
          basePrice: selectedVehicle?.retailPrice
            ? Number(selectedVehicle.retailPrice)
            : 0,
        }));
        setSelectedPromotionId("");
      }
    }
  }, [isOpen, contract, selectedCustomer, selectedVehicle, selectedQuotation]);

  const fetchInitialData = async () => {
    try {
      // Get user's dealerId from props
      const userDealerId = dealerId || "";

      const [customersRes, vehiclesRes, promotionsRes] = await Promise.all([
        customerApi.getAllCustomers({}, { limit: 100 }),
        vehicleApi.getAllVehicles({}, { limit: 100 }),
        promotionApi.getActivePromotions(userDealerId),
      ]);

      setCustomers(customersRes.data?.data || []);
      setVehicles(vehiclesRes.data?.data || []);
      setPromotions(promotionsRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData((prev) => ({ ...prev, customerId: customer.id }));
    setSearchCustomer(`${customer.firstName} ${customer.lastName}`);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    const newBasePrice = Number(vehicle.retailPrice || 0);

    // Recalculate discount if promotion is selected
    let newDiscount = formData.discount;
    if (selectedPromotionId && newBasePrice > 0) {
      const selectedPromotion = promotions.find(
        (p) => p.id === selectedPromotionId
      );
      if (selectedPromotion) {
        if (selectedPromotion.discountType === "PERCENTAGE") {
          newDiscount = (newBasePrice * selectedPromotion.discountValue) / 100;
        } else {
          newDiscount = selectedPromotion.discountValue;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      basePrice: newBasePrice, // Changed from totalAmount
      discount: newDiscount,
    }));
    setSearchVehicle(
      `${vehicle.manufacturer?.name} ${vehicle.model} ${vehicle.variant || ""}`
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) newErrors.customerId = "Vui lòng chọn khách hàng";
    if (!formData.vehicleId) newErrors.vehicleId = "Vui lòng chọn xe";
    if (!formData.staffId) newErrors.staffId = "Thiếu thông tin nhân viên";
    if (formData.basePrice <= 0) newErrors.basePrice = "Giá xe phải lớn hơn 0";
    if (formData.discount && formData.discount >= formData.basePrice) {
      newErrors.discount = "Chiết khấu không thể lớn hơn giá xe";
    }
    if (formData.paymentType === "INSTALLMENT") {
      if (!formData.installmentMonths || formData.installmentMonths < 1) {
        newErrors.installmentMonths = "Số tháng phải lớn hơn 0";
      }
      if (
        !formData.interestRate ||
        formData.interestRate < 0 ||
        formData.interestRate > 100
      ) {
        newErrors.interestRate = "Lãi suất phải từ 0% đến 100%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let result;
      if (contract) {
        // Update existing contract
        result = await contractApi.updateContract(contract.id, formData);
      } else {
        // Create new contract
        result = await contractApi.createContract(formData);
      }

      onSuccess(result.data);
      onClose();
    } catch (error: any) {
      console.error("Error saving contract:", error);
      setErrors({ general: error.response?.data?.message || "Có lỗi xảy ra" });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      !searchCustomer ||
      `${c.firstName} ${c.lastName} ${c.email}`
        .toLowerCase()
        .includes(searchCustomer.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(
    (v) =>
      !searchVehicle ||
      `${v.manufacturer?.name} ${v.model} ${v.variant || ""}`
        .toLowerCase()
        .includes(searchVehicle.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border-2 border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {contract
                ? "Chỉnh sửa hợp đồng"
                : selectedQuotation
                ? `Tạo hợp đồng từ báo giá ${selectedQuotation.quoteNumber}`
                : "Tạo hợp đồng mới"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <User className="w-4 h-4 inline mr-2" />
              Khách hàng *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
              {searchCustomer && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between text-black"
                    >
                      <div>
                        <p className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.email}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {customer.phone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.customerId && (
              <p className="text-red-500 text-sm">{errors.customerId}</p>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Car className="w-4 h-4 inline mr-2" />
              Xe *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm xe..."
                value={searchVehicle}
                onChange={(e) => setSearchVehicle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
              {searchVehicle && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => handleVehicleSelect(vehicle)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between text-black"
                    >
                      <div>
                        <p className="font-medium">
                          {vehicle.manufacturer?.name} {vehicle.model}
                        </p>
                        <p className="text-sm text-gray-600">
                          {vehicle.variant}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {formatMoney(Number(vehicle.retailPrice || 0))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.vehicleId && (
              <p className="text-red-500 text-sm">{errors.vehicleId}</p>
            )}
          </div>

          {/* Pricing Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Giá xe *
              </label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    basePrice: Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                min="0"
              />
              {errors.basePrice && (
                <p className="text-red-500 text-sm">{errors.basePrice}</p>
              )}
            </div>

            {/* Promotion Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Mã khuyến mãi
              </label>
              <select
                value={selectedPromotionId || ""}
                onChange={(e) => {
                  const promotionId = e.target.value;
                  setSelectedPromotionId(promotionId);

                  // Update formData with promotionId
                  setFormData((prev) => ({
                    ...prev,
                    promotionId: promotionId,
                  }));

                  const selectedPromotion = promotions.find(
                    (p) => p.id === promotionId
                  );

                  let calculatedDiscount = 0;
                  if (selectedPromotion && formData.basePrice > 0) {
                    if (selectedPromotion.discountType === "PERCENTAGE") {
                      calculatedDiscount =
                        (formData.basePrice * selectedPromotion.discountValue) /
                        100;
                    } else {
                      calculatedDiscount = selectedPromotion.discountValue;
                    }
                  }

                  setFormData((prev) => ({
                    ...prev,
                    discount: calculatedDiscount,
                  }));
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">Không chọn khuyến mãi</option>
                {promotions.map((promotion) => (
                  <option key={promotion.id} value={promotion.id}>
                    {promotion.name} -{" "}
                    {promotion.discountType === "PERCENTAGE"
                      ? `${promotion.discountValue}%`
                      : formatMoney(promotion.discountValue)}
                  </option>
                ))}
              </select>
              {selectedPromotionId && (
                <div className="text-sm">
                  {(() => {
                    const selectedPromotion = promotions.find(
                      (p) => p.id === selectedPromotionId
                    );
                    if (
                      selectedPromotion?.minPurchase &&
                      formData.basePrice < selectedPromotion.minPurchase
                    ) {
                      return (
                        <p className="text-red-600">
                          ⚠️ Đơn hàng tối thiểu:{" "}
                          {formatMoney(selectedPromotion.minPurchase)}
                        </p>
                      );
                    }
                    return (
                      <p className="text-green-600">
                        ✅ Đã áp dụng mã khuyến mãi
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Chiết khấu (tự động từ mã khuyến mãi)
              </label>
              <input
                type="number"
                value={formData.discount || 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    discount: Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                min="0"
                max={formData.basePrice}
                readOnly={!!selectedPromotionId} // Read-only when promotion is selected
              />
              {errors.discount && (
                <p className="text-red-500 text-sm">{errors.discount}</p>
              )}
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Hình thức thanh toán *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentType"
                  value="FULL"
                  checked={formData.paymentType === "FULL"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentType: e.target.value as "FULL" | "INSTALLMENT",
                    }))
                  }
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-black">Trả thẳng</p>
                  <p className="text-sm text-gray-600">Thanh toán một lần</p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentType"
                  value="INSTALLMENT"
                  checked={formData.paymentType === "INSTALLMENT"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentType: e.target.value as "FULL" | "INSTALLMENT",
                    }))
                  }
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-black">Trả góp</p>
                  <p className="text-sm text-gray-600">Thanh toán từng tháng</p>
                </div>
              </label>
            </div>
          </div>

          {/* Installment Details */}
          {formData.paymentType === "INSTALLMENT" && (
            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Chi tiết trả góp
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Installment Months */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Số tháng trả góp *
                  </label>
                  <select
                    value={formData.installmentMonths || 24}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        installmentMonths: Number(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value={12}>12 tháng</option>
                    <option value={18}>18 tháng</option>
                    <option value={24}>24 tháng</option>
                    <option value={36}>36 tháng</option>
                    <option value={48}>48 tháng</option>
                    <option value={60}>60 tháng</option>
                  </select>
                  {errors.installmentMonths && (
                    <p className="text-red-500 text-sm">
                      {errors.installmentMonths}
                    </p>
                  )}
                </div>

                {/* Down Payment */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Trả trước
                  </label>
                  <input
                    type="number"
                    value={0}
                    onChange={(e) => {
                      // Down payment logic can be added here if needed
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    min="0"
                    max={finalPrice}
                  />
                </div>
              </div>

              {/* Payment Calculation */}
              <div className="bg-white p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền cần trả góp:</span>
                  <span className="font-medium text-black">
                    {formatMoney(finalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trả hàng tháng:</span>
                  <span className="font-bold text-blue-600">
                    {formatMoney(monthlyPayment)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Tổng tiền phải trả:</span>
                  <span className="font-bold text-green-600">
                    {formatMoney(totalInstallmentAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ghi chú
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Ghi chú về hợp đồng..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">Tóm tắt hợp đồng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Giá xe:</span>
                <span>{formatMoney(formData.basePrice)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Chiết khấu:</span>
                <span>-{formatMoney(formData.discount || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Thành tiền:</span>
                <span className="text-green-600">
                  {formatMoney(finalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {contract ? "Cập nhật hợp đồng" : "Tạo hợp đồng"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
