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
import { Contract, CreateContractInput, contractApi } from "@/lib/api/contractApi";
import { customerApi, Customer } from "@/lib/api/customerApi";
import { vehicleApi, Vehicle } from "@/lib/api/vehicleApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contract: any) => void;
  contract?: Contract | null; // For editing
  selectedCustomer?: Customer | null;
  selectedVehicle?: Vehicle | null;
}

export default function ContractForm({
  isOpen,
  onClose,
  onSuccess,
  contract,
  selectedCustomer,
  selectedVehicle,
}: ContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");
  
  const [formData, setFormData] = useState<CreateContractInput>({
    customerId: "",
    vehicleId: "",
    totalAmount: 0,
    discount: 0,
    paymentType: "FULL",
    installmentMonths: 24,
    downPayment: 0,
    notes: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculated values
  const finalAmount = formData.totalAmount - (formData.discount || 0);
  const monthlyPayment = formData.paymentType === "INSTALLMENT" && formData.installmentMonths 
    ? finalAmount / formData.installmentMonths 
    : 0;
  const totalInstallmentAmount = formData.paymentType === "INSTALLMENT" 
    ? monthlyPayment * (formData.installmentMonths || 0)
    : finalAmount;

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (contract) {
        // Edit mode - populate form
        setFormData({
          customerId: contract.customerId,
          vehicleId: contract.vehicleId,
          totalAmount: contract.totalAmount,
          discount: contract.discount || 0,
          paymentType: contract.paymentType,
          installmentMonths: contract.installmentMonths || 24,
          downPayment: contract.downPayment || 0,
          notes: contract.notes || "",
        });
      } else {
        // Create mode - set selected customer/vehicle
        setFormData(prev => ({
          ...prev,
          customerId: selectedCustomer?.id || "",
          vehicleId: selectedVehicle?.id || "",
          totalAmount: selectedVehicle?.retailPrice ? Number(selectedVehicle.retailPrice) : 0,
        }));
      }
    }
  }, [isOpen, contract, selectedCustomer, selectedVehicle]);

  const fetchInitialData = async () => {
    try {
      const [customersRes, vehiclesRes] = await Promise.all([
        customerApi.getAllCustomers({}, { limit: 100 }),
        vehicleApi.getAllVehicles({}, { limit: 100 }),
      ]);

      setCustomers(customersRes.data?.data || []);
      setVehicles(vehiclesRes.data?.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({ ...prev, customerId: customer.id }));
    setSearchCustomer(`${customer.firstName} ${customer.lastName}`);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setFormData(prev => ({
      ...prev,
      vehicleId: vehicle.id,
      totalAmount: Number(vehicle.retailPrice || 0),
    }));
    setSearchVehicle(`${vehicle.manufacturer?.name} ${vehicle.model} ${vehicle.variant || ""}`);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) newErrors.customerId = "Vui lòng chọn khách hàng";
    if (!formData.vehicleId) newErrors.vehicleId = "Vui lòng chọn xe";
    if (formData.totalAmount <= 0) newErrors.totalAmount = "Giá xe phải lớn hơn 0";
    if (formData.discount && formData.discount >= formData.totalAmount) {
      newErrors.discount = "Chiết khấu không thể lớn hơn giá xe";
    }
    if (formData.paymentType === "INSTALLMENT") {
      if (!formData.installmentMonths || formData.installmentMonths < 1) {
        newErrors.installmentMonths = "Số tháng phải lớn hơn 0";
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {contract ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng mới"}
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
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      <span className="text-xs text-gray-500">{customer.phone}</span>
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
                        <p className="text-sm text-gray-600">{vehicle.variant}</p>
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
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalAmount: Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                min="0"
              />
              {errors.totalAmount && (
                <p className="text-red-500 text-sm">{errors.totalAmount}</p>
              )}
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Chiết khấu
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
                max={formData.totalAmount}
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
                    <p className="text-red-500 text-sm">{errors.installmentMonths}</p>
                  )}
                </div>

                {/* Down Payment */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Trả trước
                  </label>
                  <input
                    type="number"
                    value={formData.downPayment || 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        downPayment: Number(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    min="0"
                    max={finalAmount}
                  />
                </div>
              </div>

              {/* Payment Calculation */}
              <div className="bg-white p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền cần trả góp:</span>
                  <span className="font-medium text-black">
                    {formatMoney(finalAmount - (formData.downPayment || 0))}
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
                    {formatMoney(totalInstallmentAmount + (formData.downPayment || 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
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
                <span>{formatMoney(formData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Chiết khấu:</span>
                <span>-{formatMoney(formData.discount || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Thành tiền:</span>
                <span className="text-green-600">{formatMoney(finalAmount)}</span>
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
