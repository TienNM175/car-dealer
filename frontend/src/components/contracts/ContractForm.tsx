// frontend/src/components/contracts/ContractForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Car,
  DollarSign,
  FileText,
  Calculator,
  CreditCard,
  AlertTriangle,
  ChevronDown,
  Truck,
  Hash,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import {
  Contract,
  CreateContractInput,
  contractApi,
} from "@/lib/api/contractApi";
import { customerApi } from "@/lib/api/customerApi";
import { vehicleApi, Vehicle } from "@/lib/api/vehicleApi";
import { promotionApi } from "@/lib/api/promotionApi";
import { vehicleUnitApi, VehicleUnitSummary } from "@/lib/api/vehicleUnitApi";
import { Quotation } from "@/lib/api/quotationApi";
import { formatMoney } from "@/lib/utils/formatMoney";
import SignaturePad from "@/components/shared/SignaturePad";

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contract: any) => void;
  contract?: Contract | null; // For editing
  selectedVehicle?: Vehicle | null;
  selectedQuotation?: Quotation | null; // For creating contract from quotation
  isNewFromDeposit?: boolean; // Flag để biết đây là HĐ mới tạo từ deposit
  dealerId?: string; // Add dealerId for fetching promotions
  userId?: string; // Add userId to set as staffId
  dealerInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  staffInfo?: {
    firstName: string;
    lastName: string;
  };
}

export default function ContractForm({
  isOpen,
  onClose,
  onSuccess,
  contract,
  selectedVehicle,
  selectedQuotation,
  isNewFromDeposit = false,
  dealerId,
  userId,
  dealerInfo,
  staffInfo,
}: ContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<VehicleUnitSummary[]>([]);
  const [vehicleUnitsLoading, setVehicleUnitsLoading] = useState(false);
  const [vehicleUnitError, setVehicleUnitError] = useState("");
  const [searchVehicle, setSearchVehicle] = useState(""); // For filtering vehicle list
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Customer info (manual input)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [formData, setFormData] = useState<CreateContractInput>({
    customerId: "",
    vehicleId: "",
    vehicleUnitId: "",
    staffId: "", // Required by backend
    quotationId: "",
    promotionId: "",
    basePrice: 0, // Changed from totalAmount
    discount: 0,
    tax: undefined, // Deprecated - không dùng nữa, VAT luôn tự động 10%
    paymentType: "FULL",
    installmentMonths: 24,
    interestRate: 12, // Default 12% annual rate
    deliveryDate: "",
    notes: "",
  });

  // Separate state for promotion selection (UI only)
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailFound, setEmailFound] = useState(false);
  const [foundEmail, setFoundEmail] = useState(""); // Lưu email đã tìm thấy khách hàng

  // Signature state
  const [customerSignature, setCustomerSignature] = useState<string | null>(
    null
  );
  const [dealerSignature, setDealerSignature] = useState<string | null>(null);

  // Calculated values
  const DOWN_PAYMENT_RATE = 0.6; // 60% trả trước bắt buộc khi trả góp
  const FINANCED_RATE = 1 - DOWN_PAYMENT_RATE; // 40% còn lại trả góp
  const priceAfterDiscount = Math.max(
    formData.basePrice - (formData.discount || 0),
    0
  );
  // Tính thuế VAT: 10% cố định trên giá sau giảm giá (theo quy định Việt Nam)
  const taxAmount = priceAfterDiscount * 0.1; // 10% VAT
  const finalPrice = priceAfterDiscount + taxAmount;

  // Proper installment calculation with interest (matching backend logic)
  const calculateMonthlyPayment = () => {
    if (
      formData.paymentType !== "INSTALLMENT" ||
      !formData.installmentMonths ||
      !formData.interestRate
    ) {
      return 0;
    }

    // Calculate on the remaining 40% after applying the 60% down payment
    const principal = finalPrice * FINANCED_RATE;
    const monthlyRate = (Number(formData.interestRate) || 0) / 100 / 12;
    const numberOfPayments = Number(formData.installmentMonths);

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
      ? finalPrice * DOWN_PAYMENT_RATE +
        monthlyPayment * (formData.installmentMonths || 0)
      : finalPrice;

  const downPaymentAmount = finalPrice * DOWN_PAYMENT_RATE;
  const financedAmount = finalPrice * FINANCED_RATE;

  // Close dropdown when click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".vehicle-dropdown-container")) {
        setShowVehicleDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (contract) {
        // Edit mode - populate form
        setFormData({
          customerId: contract.customerId,
          vehicleId: contract.vehicleId,
          vehicleUnitId: contract.vehicleUnitId || "",
          staffId: contract.staffId,
          basePrice: Number(contract.basePrice) || 0,
          discount: Number(contract.discount) || 0,
          tax: contract.tax ? Number(contract.tax) : undefined,
          paymentType: contract.paymentType,
          installmentMonths: contract.installmentMonths || 24,
          interestRate: contract.interestRate || 12,
          deliveryDate: contract.deliveryDate || "",
          notes: contract.notes || "",
        });

        // Fetch customer info for edit mode
        if (contract.customerId) {
          fetchCustomerInfo(contract.customerId);
        }

        // Load signatures from contract
        setCustomerSignature(contract.customerSignature || null);
        setDealerSignature(contract.dealerSignature || null);

        // Reset promotion selection in edit mode
        setSelectedPromotionId("");
      } else if (selectedQuotation) {
        // Create from quotation - populate form with quotation data
        setFormData((prev) => ({
          ...prev,
          customerId: selectedQuotation.customerId,
          vehicleId: selectedQuotation.vehicleId,
          vehicleUnitId: "",
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

        // Fetch customer info from quotation's customerId
        if (selectedQuotation.customerId) {
          // If quotation has customer object, use it directly (but still fetch full info for address)
          if (selectedQuotation.customer) {
            setCustomerInfo({
              firstName: selectedQuotation.customer.firstName || "",
              lastName: selectedQuotation.customer.lastName || "",
              email: selectedQuotation.customer.email || "",
              phone: selectedQuotation.customer.phone || "",
              address: "", // Quotation interface doesn't have address, need to fetch
            });
            // Fetch full customer info to get address
            fetchCustomerInfo(selectedQuotation.customerId);
          } else {
            // Otherwise fetch from API
            fetchCustomerInfo(selectedQuotation.customerId);
          }
        }
      } else {
        // Create mode - set selected vehicle if provided
        setFormData((prev) => ({
          ...prev,
          vehicleId: selectedVehicle?.id || "",
          vehicleUnitId: "",
          staffId: userId || "", // Set from user context
          basePrice: selectedVehicle?.retailPrice
            ? Number(selectedVehicle.retailPrice)
            : 0,
        }));
        setSelectedPromotionId("");
        setEmailFound(false);
        setFoundEmail("");
        setCustomerSignature(null);
        setDealerSignature(null);
      }
    }
  }, [isOpen, contract, selectedVehicle, selectedQuotation]);

  useEffect(() => {
    if (!isOpen) return;

    if (!formData.vehicleId) {
      setVehicleUnits([]);
      setVehicleUnitError("");
      setFormData((prev) =>
        prev.vehicleUnitId ? { ...prev, vehicleUnitId: "" } : prev
      );
      return;
    }

    if (!dealerId) {
      setVehicleUnits([]);
      setVehicleUnitError(
        "Không xác định được đại lý. Vui lòng đăng nhập lại hoặc kiểm tra thông tin người dùng."
      );
      return;
    }

    const currentUnit =
      contract && contract.vehicleId === formData.vehicleId
        ? mapContractVehicleUnit(contract.vehicleUnit)
        : undefined;

    loadVehicleUnits(formData.vehicleId, {
      currentUnit,
      keepSelection: !!(contract?.vehicleUnitId && formData.vehicleUnitId),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.vehicleId, dealerId, isOpen]);

  const fetchCustomerInfo = async (customerId: string) => {
    try {
      console.log("👤 Fetching customer info for:", customerId);
      const customerRes = await customerApi.getCustomerById(customerId);
      console.log("✅ Customer info fetched:", customerRes.data);

      const customer = customerRes.data.data || customerRes.data;
      setCustomerInfo({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    } catch (error) {
      console.error("❌ Error fetching customer info:", error);
    }
  };

  const fetchInitialData = async () => {
    try {
      console.log("🔄 Fetching initial data for ContractForm...");
      console.log("🏢 DealerId from props:", dealerId);

      // Get user's dealerId from props
      const userDealerId = dealerId || "";

      // Fetch vehicles - use dealer vehicles if dealerId exists, otherwise all vehicles
      let vehiclesRes;
      if (userDealerId) {
        console.log("🏢 Fetching dealer vehicles for dealerId:", userDealerId);
        vehiclesRes = await vehicleApi.getDealerVehicles(
          userDealerId,
          {},
          { limit: 100 }
        );
      } else {
        console.log("🌍 Fetching all vehicles (no dealerId)");
        vehiclesRes = await vehicleApi.getAllVehicles({}, { limit: 100 });
      }
      console.log("🚗 Vehicles response:", vehiclesRes);

      const vehiclesData = vehiclesRes.data?.data || vehiclesRes.data || [];
      setVehicles(vehiclesData);
      console.log("✅ Set vehicles:", vehiclesData.length, "items");

      // Fetch promotions only if dealerId exists
      if (userDealerId) {
        try {
          console.log("🎁 Fetching promotions for dealerId:", userDealerId);
          console.log(
            "🎁 Promotion API URL:",
            `/promotions/dealer/${userDealerId}/active`
          );

          const promotionsRes = await promotionApi.getActivePromotions(
            userDealerId
          );
          console.log("🎁 Promotions response:", promotionsRes);
          console.log("🎁 Promotions response type:", typeof promotionsRes);
          console.log(
            "🎁 Promotions response isArray:",
            Array.isArray(promotionsRes)
          );

          // Backend returns array directly, not wrapped in data.data
          const promotionsData = Array.isArray(promotionsRes)
            ? promotionsRes
            : [];
          console.log("🎁 Final promotions data:", promotionsData);
          console.log("🎁 Promotions count:", promotionsData.length);
          setPromotions(promotionsData);
        } catch (promoError: any) {
          console.error("❌ Error fetching promotions:", promoError);
          console.error("❌ Error details:", promoError.response?.data);
          console.error("❌ Error status:", promoError.response?.status);
          setPromotions([]);
        }
      } else {
        console.warn("⚠️ No dealerId provided, skipping promotions fetch");
        console.warn("⚠️ userDealerId value:", userDealerId);
        setPromotions([]);
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);
    }
  };

  const mapContractVehicleUnit = (
    unit: Contract["vehicleUnit"] | null | undefined
  ): VehicleUnitSummary | undefined => {
    if (!unit) return undefined;
    return {
      id: unit.id,
      vin: unit.vin,
      engineNumber: unit.engineNumber,
      batterySerial: unit.batterySerial,
      color: unit.color,
      status: unit.status,
      storageType: unit.storageType,
      dealerId: unit.dealerId,
      reservedAt: unit.reservedAt || undefined,
      deliveredAt: unit.deliveredAt || undefined,
      location: unit.location,
    };
  };

  const loadVehicleUnits = async (
    vehicleId: string,
    options?: {
      currentUnit?: VehicleUnitSummary;
      keepSelection?: boolean;
    }
  ) => {
    if (!dealerId) {
      setVehicleUnits([]);
      setVehicleUnitError(
        "Không xác định được đại lý. Vui lòng đăng nhập lại hoặc kiểm tra thông tin người dùng."
      );
      return;
    }

    setVehicleUnitsLoading(true);
    setVehicleUnitError("");

    try {
      const res = await vehicleUnitApi.getAvailableUnits(vehicleId, dealerId);
      const payload = res.data?.data;
      let units: VehicleUnitSummary[] = Array.isArray(payload) ? payload : [];

      if (options?.currentUnit) {
        const exists = units.some(
          (unit) => unit.id === options.currentUnit!.id
        );
        if (!exists) {
          units = [options.currentUnit, ...units];
        }
      }

      // Remove duplicates by id
      const uniqueMap = new Map<string, VehicleUnitSummary>();
      units.forEach((unit) => {
        if (!uniqueMap.has(unit.id)) {
          uniqueMap.set(unit.id, unit);
        }
      });
      const uniqueUnits = Array.from(uniqueMap.values());
      setVehicleUnits(uniqueUnits);

      setFormData((prev) => {
        if (options?.keepSelection && prev.vehicleUnitId) {
          const stillExists = uniqueUnits.some(
            (unit) => unit.id === prev.vehicleUnitId
          );
          if (stillExists) {
            return prev;
          }
        }

        const firstUnitId = uniqueUnits.length > 0 ? uniqueUnits[0].id : "";
        if (prev.vehicleUnitId === firstUnitId) return prev;
        return {
          ...prev,
          vehicleUnitId: firstUnitId,
        };
      });

      if (uniqueUnits.length === 0) {
        setVehicleUnitError(
          "Không có xe (VIN) nào đang khả dụng tại đại lý này. Vui lòng kiểm tra tồn kho."
        );
      }
    } catch (error: any) {
      console.error("❌ Error loading vehicle units:", error);
      setVehicleUnitError(
        error?.response?.data?.message || "Không thể tải danh sách xe khả dụng."
      );
      setVehicleUnits([]);
    } finally {
      setVehicleUnitsLoading(false);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    const newBasePrice = Number(vehicle.retailPrice || 0);

    // Recalculate discount if promotion is selected
    let newDiscount = Number(formData.discount) || 0;
    if (selectedPromotionId && newBasePrice > 0) {
      const selectedPromotion = promotions.find(
        (p) => p.id === selectedPromotionId
      );
      if (selectedPromotion) {
        const discountValueNum = Number(selectedPromotion.discountValue) || 0;
        if (selectedPromotion.discountType === "PERCENTAGE") {
          newDiscount = (newBasePrice * discountValueNum) / 100;
        } else {
          newDiscount = discountValueNum;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleUnitId: "",
      basePrice: newBasePrice,
      discount: Math.round(newDiscount), // Làm tròn để tránh số thập phân
    }));

    setVehicleUnits([]);
    setVehicleUnitError("");
  };

  const handleVehicleUnitSelect = (vehicleUnitId: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicleUnitId,
    }));
  };

  const handleRefreshVehicleUnits = async () => {
    if (!formData.vehicleId || !dealerId) return;

    const currentSelection = vehicleUnits.find(
      (unit) => unit.id === formData.vehicleUnitId
    );

    await loadVehicleUnits(formData.vehicleId, {
      currentUnit:
        currentSelection ||
        (contract && contract.vehicleId === formData.vehicleId
          ? mapContractVehicleUnit(contract.vehicleUnit)
          : undefined),
      keepSelection: true,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate customer info
    if (!customerInfo.firstName.trim())
      newErrors.firstName = "Vui lòng nhập họ";
    if (!customerInfo.lastName.trim()) newErrors.lastName = "Vui lòng nhập tên";
    if (!customerInfo.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!customerInfo.phone.trim())
      newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{10,11}$/.test(customerInfo.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
    }
    if (!customerInfo.address.trim())
      newErrors.address = "Vui lòng nhập địa chỉ";

    // Validate vehicle and contract info
    if (!formData.vehicleId) newErrors.vehicleId = "Vui lòng chọn xe";
    if (!formData.vehicleUnitId)
      newErrors.vehicleUnitId = "Vui lòng chọn xe (VIN) cụ thể";
    if (!formData.staffId) newErrors.staffId = "Thiếu thông tin nhân viên";
    if (formData.basePrice <= 0) newErrors.basePrice = "Giá xe phải lớn hơn 0";
    // Convert sang number để so sánh chính xác
    const basePriceNum = Number(formData.basePrice) || 0;
    const discountNum = Number(formData.discount) || 0;
    if (discountNum > 0 && discountNum > basePriceNum) {
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

    // Validate promotion minPurchase requirement
    if (selectedPromotionId && formData.basePrice > 0) {
      const selectedPromotion = promotions.find(
        (p) => p.id === selectedPromotionId
      );
      if (
        selectedPromotion?.minPurchase &&
        formData.basePrice < Number(selectedPromotion.minPurchase)
      ) {
        newErrors.promotion = `Đơn hàng tối thiểu: ${formatMoney(
          selectedPromotion.minPurchase
        )}`;
      }
    }

    // Validate signatures: Nếu status là PENDING (SALES) hoặc DEPOSIT, cần có chữ ký
    if (contract) {
      const currentStatus = contract.status;
      const contractType = contract.contractType || "SALES";

      if (
        (currentStatus === "PENDING" && contractType === "SALES") ||
        (contractType === "DEPOSIT" && currentStatus === "DRAFT")
      ) {
        if (!customerSignature && !contract.customerSignature) {
          newErrors.customerSignature = "Vui lòng thêm chữ ký khách hàng";
        }
        if (!dealerSignature && !contract.dealerSignature) {
          newErrors.dealerSignature = "Vui lòng thêm chữ ký đại lý";
        }
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
      let customerId = formData.customerId;

      // Create or Update customer
      if (customerId) {
        // Already have customerId (from quotation or edit mode) - Update customer
        console.log("👤 Updating customer with info:", customerInfo);
        console.log("👤 Customer ID:", customerId);

        try {
          await customerApi.updateCustomer(customerId, customerInfo);
          console.log("✅ Customer updated successfully");
        } catch (error) {
          console.error("❌ Error updating customer:", error);
          // Continue with existing customerId if update fails
        }
      } else {
        // No customerId - Create new customer
        console.log("👤 Creating customer with info:", customerInfo);
        const customerRes = await customerApi.createCustomer(customerInfo);
        console.log("✅ Customer created:", customerRes.data);

        // Backend returns: { success: true, message: '...', data: { id: '...', ... } }
        customerId = customerRes.data.data?.id || customerRes.data.id;

        console.log("👤 Customer ID:", customerId);

        if (!customerId) {
          throw new Error("Không thể tạo khách hàng, vui lòng thử lại");
        }
      }

      // Create/Update contract with customer ID
      const contractData: any = {
        customerId,
        vehicleId: formData.vehicleId,
        vehicleUnitId: formData.vehicleUnitId,
        staffId: formData.staffId,
        basePrice: Number(formData.basePrice),
        discount: Number(formData.discount) || 0,
        // tax: removed - VAT tự động tính 10% ở backend
        paymentType: formData.paymentType,
        installmentMonths: Number(formData.installmentMonths),
        interestRate: Number(formData.interestRate),
        notes: formData.notes || "",
      };

      // Only add optional fields if they have values
      if (formData.quotationId) {
        contractData.quotationId = formData.quotationId;
      }
      if (formData.promotionId) {
        contractData.promotionId = formData.promotionId;
      }
      if (formData.deliveryDate) {
        contractData.deliveryDate = formData.deliveryDate;
      }
      // Chỉ gửi chữ ký khi hợp đồng đã tồn tại và (không phải DRAFT hoặc là HĐ đặt cọc)
      if (
        contract &&
        (contract.contractType === "DEPOSIT" || contract.status !== "DRAFT")
      ) {
        if (customerSignature) {
          contractData.customerSignature = customerSignature;
        }
        if (dealerSignature) {
          contractData.dealerSignature = dealerSignature;
        }
      }

      console.log("📋 Contract Data to submit:", contractData);

      let result;
      let updatedContract: Contract;
      if (contract) {
        // Update existing contract
        console.log("🔄 Updating contract:", contract.id);
        console.log("📋 Update data:", JSON.stringify(contractData, null, 2));
        result = await contractApi.updateContract(contract.id, contractData);
        console.log("✅ Update result:", result.data);
        // Extract contract from response
        updatedContract = result.data?.data || result.data;
        setSuccessMessage("✅ Cập nhật hợp đồng thành công!");
      } else {
        // Create new contract
        console.log(
          "📤 Creating contract with data:",
          JSON.stringify(contractData, null, 2)
        );
        result = await contractApi.createContract(contractData);
        // Extract contract from response
        updatedContract = result.data?.data || result.data;
        setSuccessMessage("✅ Tạo hợp đồng thành công!");
      }

      // Show success popup
      setShowSuccessPopup(true);

      // Refresh list and close modal after delay
      setTimeout(() => {
        setShowSuccessPopup(false);
        onSuccess(updatedContract);
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("❌ Error saving contract:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Có lỗi xảy ra";

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      !searchVehicle ||
      `${v.manufacturer?.name} ${v.model} ${v.variant || ""}`
        .toLowerCase()
        .includes(searchVehicle.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl border-2 border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="text-xl font-bold text-white">
            {isNewFromDeposit
              ? "Hoàn thiện hợp đồng mua"
              : contract
              ? "Chỉnh sửa hợp đồng"
              : selectedQuotation
              ? `Tạo hợp đồng từ báo giá ${selectedQuotation.quoteNumber}`
              : "Tạo hợp đồng mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-8 modal-scrollbar"
        >
          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Contract Header - Giống letterhead */}
          <div className="text-center border-b-2 border-gray-300 pb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              HỢP ĐỒNG MUA BÁN XE ĐIỆN
            </h1>
            <div className="flex justify-center items-center gap-8 text-sm text-gray-600">
              <div>
                <p className="font-medium">Số hợp đồng:</p>
                <p className="text-blue-600 font-bold">
                  {contract ? contract.contractNumber : "Tự động tạo"}
                </p>
              </div>
              <div>
                <p className="font-medium">Ngày tạo:</p>
                <p className="text-black">
                  {contract
                    ? new Date(contract.createdAt).toLocaleDateString("vi-VN")
                    : new Date().toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Thông tin các bên */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              THÔNG TIN CÁC BÊN
            </h2>

            {/* Customer Information - Manual Input */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-800">
                Bên mua (Khách hàng) *
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ *
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập họ..."
                    value={customerInfo.firstName}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên *
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tên..."
                    value={customerInfo.lastName}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={customerInfo.email}
                      onChange={(e) => {
                        const newEmail = e.target.value;

                        // 1. Nếu trước đó đã tìm thấy khách (đang ở trạng thái auto-fill)
                        // và người dùng thay đổi email (dù chỉ 1 ký tự)
                        if (emailFound) {
                          // Reset toàn bộ thông tin về rỗng, chỉ giữ lại email mới đang nhập
                          setCustomerInfo({
                            firstName: "",
                            lastName: "",
                            phone: "",
                            address: "",
                            email: newEmail, // Vẫn phải cập nhật giá trị người dùng đang gõ
                          });

                          // Xóa các trạng thái "đã tìm thấy"
                          setEmailFound(false);
                          setFoundEmail("");

                          // Quan trọng: Xóa customerId để tránh update nhầm vào khách hàng cũ
                          setFormData((prev) => ({
                            ...prev,
                            customerId: "",
                          }));
                        } else {
                          // 2. Nếu chưa tìm thấy gì (nhập bình thường), chỉ update email
                          setCustomerInfo((prev) => ({
                            ...prev,
                            email: newEmail,
                          }));
                        }
                      }}
                      onBlur={async (e) => {
                        const email = e.target.value.trim();
                        if (
                          !email ||
                          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                        ) {
                          // Nếu email không hợp lệ và đang ở chế độ tạo mới, xóa thông tin cũ
                          if (!formData.customerId && !contract && foundEmail) {
                            setCustomerInfo((s) => ({
                              ...s,
                              firstName: "",
                              lastName: "",
                              phone: "",
                              address: "",
                            }));
                            setFormData((prev) => ({
                              ...prev,
                              customerId: "",
                            }));
                            setFoundEmail("");
                            setEmailFound(false);
                          }
                          return;
                        }
                        // Chỉ check nếu chưa có customerId (tạo mới)
                        if (!formData.customerId && !contract) {
                          setCheckingEmail(true);
                          try {
                            const searchRes = await customerApi.searchCustomers(
                              email
                            );
                            const customers =
                              searchRes.data?.data || searchRes.data || [];
                            const foundCustomer = customers.find(
                              (c: any) =>
                                c.email?.toLowerCase() === email.toLowerCase()
                            );
                            if (foundCustomer) {
                              const customerEmail =
                                foundCustomer.email || email;
                              console.log(
                                "✅ Tìm thấy khách hàng, set foundEmail:",
                                customerEmail
                              );
                              // Tự điền thông tin khách hàng
                              setCustomerInfo({
                                firstName: foundCustomer.firstName || "",
                                lastName: foundCustomer.lastName || "",
                                email: customerEmail,
                                phone: foundCustomer.phone || "",
                                address: foundCustomer.address || "",
                              });
                              setFormData((prev) => ({
                                ...prev,
                                customerId: foundCustomer.id,
                              }));
                              setEmailFound(true);
                              setFoundEmail(customerEmail); // Lưu email đã tìm thấy
                            } else {
                              // Không tìm thấy khách hàng → Chỉ xóa nếu đã từng tìm thấy (auto-fill)
                              if (emailFound && foundEmail) {
                                console.log(
                                  "❌ Không tìm thấy khách hàng, xóa thông tin đã auto-fill"
                                );
                                setCustomerInfo((s) => ({
                                  ...s,
                                  firstName: "",
                                  lastName: "",
                                  phone: "",
                                  address: "",
                                }));
                                setFormData((prev) => ({
                                  ...prev,
                                  customerId: "",
                                }));
                                setFoundEmail("");
                                setEmailFound(false);
                              } else {
                                // Chưa từng tìm thấy → giữ nguyên thông tin đã nhập
                                console.log(
                                  "ℹ️ Không tìm thấy khách hàng, giữ nguyên thông tin đã nhập"
                                );
                                setFoundEmail("");
                                setEmailFound(false);
                              }
                            }
                          } catch (error) {
                            console.error("Error checking email:", error);
                            // Nếu có lỗi, chỉ xóa nếu đã từng tìm thấy (auto-fill)
                            if (emailFound && foundEmail) {
                              setCustomerInfo((s) => ({
                                ...s,
                                firstName: "",
                                lastName: "",
                                phone: "",
                                address: "",
                              }));
                              setFormData((prev) => ({
                                ...prev,
                                customerId: "",
                              }));
                            }
                            setFoundEmail("");
                            setEmailFound(false);
                          } finally {
                            setCheckingEmail(false);
                          }
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      </div>
                    )}
                    {emailFound && !checkingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✓ Đã tìm thấy
                        </span>
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                  {emailFound && (
                    <p className="text-green-600 text-sm mt-1">
                      Đã tự động điền thông tin khách hàng từ hệ thống
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    placeholder="0123456789"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Address - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ đầy đủ..."
                  value={customerInfo.address}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Dealer Information - Display Only */}
            {dealerInfo && (
              <div className="space-y-4 mt-6 pt-6 border-t border-gray-300">
                <label className="block text-sm font-semibold text-gray-800">
                  Bên bán (Đại lý)
                </label>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium text-gray-800">
                          Tên đại lý:
                        </span>{" "}
                        {dealerInfo.name}
                      </p>
                      {dealerInfo.address && (
                        <p className="text-gray-600 mt-2">
                          <span className="font-medium text-gray-800">
                            Địa chỉ:
                          </span>{" "}
                          {dealerInfo.address}
                        </p>
                      )}
                    </div>
                    <div>
                      {dealerInfo.phone && (
                        <p className="text-gray-600">
                          <span className="font-medium text-gray-800">
                            SĐT:
                          </span>{" "}
                          {dealerInfo.phone}
                        </p>
                      )}
                      {dealerInfo.email && (
                        <p className="text-gray-600 mt-2">
                          <span className="font-medium text-gray-800">
                            Email:
                          </span>{" "}
                          {dealerInfo.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {staffInfo && (
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <p className="text-gray-600 text-sm">
                        <span className="font-medium text-gray-800">
                          Nhân viên phụ trách:
                        </span>{" "}
                        {staffInfo.firstName} {staffInfo.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vehicle Selection */}
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-300">
              <label className="block text-sm font-semibold text-gray-800">
                <Car className="w-4 h-4 inline mr-2" />
                Đối tượng hợp đồng (Xe) *
              </label>

              {/* Searchable Dropdown */}
              <div className="space-y-2">
                <div className="relative vehicle-dropdown-container">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVehicleDropdown(!showVehicleDropdown);
                    }}
                    className={`w-full px-4 py-3 text-sm rounded-lg text-left flex items-center justify-between transition-all duration-200 ${
                      formData.vehicleId
                        ? "bg-blue-50 border-2 border-blue-200 shadow-md"
                        : "bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      {formData.vehicleId ? (
                        <div>
                          <div className="font-medium text-black truncate">
                            {(() => {
                              const selectedVehicle = vehicles.find(
                                (v) => v.id === formData.vehicleId
                              );
                              return selectedVehicle
                                ? `${selectedVehicle.manufacturer?.name} ${
                                    selectedVehicle.model
                                  }${
                                    selectedVehicle.variant
                                      ? ` - ${selectedVehicle.variant}`
                                      : ""
                                  }`
                                : "Chọn xe...";
                            })()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const selectedVehicle = vehicles.find(
                                (v) => v.id === formData.vehicleId
                              );
                              return selectedVehicle
                                ? `${selectedVehicle.year} • ${formatMoney(
                                    Number(selectedVehicle.retailPrice || 0)
                                  )}`
                                : "";
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Chọn xe...</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        showVehicleDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown list */}
                  {showVehicleDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Search input */}
                      <div className="p-3 border-b border-gray-200">
                        <input
                          type="text"
                          placeholder="Tìm kiếm xe..."
                          value={searchVehicle}
                          onChange={(e) => setSearchVehicle(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        />
                      </div>

                      {/* Vehicle list */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredVehicles.length === 0 ? (
                          <div className="px-4 py-3 text-gray-500 text-sm">
                            {vehicles.length === 0
                              ? "Đang tải xe..."
                              : "Không tìm thấy xe phù hợp"}
                          </div>
                        ) : (
                          filteredVehicles.map((vehicle) => (
                            <div
                              key={vehicle.id}
                              onClick={() => {
                                console.log("🚗 Vehicle selected:", vehicle.id);
                                handleVehicleSelect(vehicle);
                                setShowVehicleDropdown(false);
                                setSearchVehicle("");
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-black">
                                {vehicle.manufacturer?.name} {vehicle.model}
                                {vehicle.variant ? ` - ${vehicle.variant}` : ""}
                              </div>
                              <div className="text-sm text-gray-600">
                                {vehicle.year} •{" "}
                                {formatMoney(Number(vehicle.retailPrice || 0))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-1">
                  Tìm thấy {filteredVehicles.length} xe (tổng: {vehicles.length}
                  )
                </div>
              </div>

              {errors.vehicleId && (
                <p className="text-red-500 text-sm mt-1">{errors.vehicleId}</p>
              )}

              {/* Display selected vehicle info */}
              {formData.vehicleId && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-black mb-2">
                    Thông tin xe đã chọn:
                  </h4>
                  {(() => {
                    const selectedVehicle = vehicles.find(
                      (v) => v.id === formData.vehicleId
                    );
                    return selectedVehicle ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm text-black">
                          <div>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Xe:
                              </span>{" "}
                              <span className="text-black">
                                {selectedVehicle.manufacturer?.name}{" "}
                                {selectedVehicle.model}
                              </span>
                            </p>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Phiên bản:
                              </span>{" "}
                              <span className="text-black">
                                {selectedVehicle.variant || "N/A"}
                              </span>
                            </p>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Năm:
                              </span>{" "}
                              <span className="text-black">
                                {selectedVehicle.year}
                              </span>
                            </p>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Màu:
                              </span>{" "}
                              <span className="text-black">
                                {selectedVehicle.color}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Giá niêm yết:
                              </span>{" "}
                              <span className="text-black">
                                {formatMoney(
                                  Number(selectedVehicle.retailPrice || 0)
                                )}
                              </span>
                            </p>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Dung lượng pin:
                              </span>{" "}
                              <span className="text-black">
                                {selectedVehicle.batteryCapacity} kWh
                              </span>
                            </p>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Tầm hoạt động:
                              </span>{" "}
                              <span className="text-black">
                                {selectedVehicle.range} km
                              </span>
                            </p>
                            <p className="text-black">
                              <span className="font-medium text-black">
                                Công suất:
                              </span>{" "}
                              <span className="text-black">
                                {selectedVehicle.motorPower || "N/A"} kW
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                              <Truck className="w-4 h-4" /> Chọn xe (VIN) *
                            </span>
                            <button
                              type="button"
                              onClick={handleRefreshVehicleUnits}
                              disabled={
                                vehicleUnitsLoading ||
                                !formData.vehicleId ||
                                !dealerId
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                            >
                              {vehicleUnitsLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCcw className="w-4 h-4" />
                              )}
                              Làm mới VIN
                            </button>
                          </div>

                          {vehicleUnitError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                              {vehicleUnitError}
                            </div>
                          )}

                          {vehicleUnitsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                              Đang tải danh sách VIN khả dụng...
                            </div>
                          ) : vehicleUnits.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {vehicleUnits.map((unit) => (
                                <label
                                  key={unit.id}
                                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                    formData.vehicleUnitId === unit.id
                                      ? "border-blue-500 bg-blue-50 shadow-sm"
                                      : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/60"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="vehicle-unit"
                                    value={unit.id}
                                    checked={formData.vehicleUnitId === unit.id}
                                    onChange={() =>
                                      handleVehicleUnitSelect(unit.id)
                                    }
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold text-gray-900">
                                        {unit.vin}
                                      </span>
                                      {(unit.vehicle?.manufacturer?.name ||
                                        unit.vehicle?.model) && (
                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                          {unit.vehicle?.manufacturer?.name}{" "}
                                          {unit.vehicle?.model}
                                        </span>
                                      )}
                                      {unit.color && (
                                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                          Màu: {unit.color}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        Trạng thái: {unit.status}
                                      </span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                                      {unit.engineNumber && (
                                        <p>
                                          <span className="text-gray-500">
                                            Số động cơ:
                                          </span>{" "}
                                          <span className="text-gray-800">
                                            {unit.engineNumber}
                                          </span>
                                        </p>
                                      )}
                                      {unit.batterySerial && (
                                        <p>
                                          <span className="text-gray-500">
                                            PIN:
                                          </span>{" "}
                                          <span className="text-gray-800">
                                            {unit.batterySerial}
                                          </span>
                                        </p>
                                      )}
                                      {unit.location && (
                                        <p>
                                          <span className="text-gray-500">
                                            Vị trí:
                                          </span>{" "}
                                          <span className="text-gray-800">
                                            {unit.location}
                                          </span>
                                        </p>
                                      )}
                                      {unit.reservedAt && (
                                        <p>
                                          <span className="text-gray-500">
                                            Giữ chỗ:
                                          </span>{" "}
                                          <span className="text-gray-800">
                                            {new Date(
                                              unit.reservedAt
                                            ).toLocaleDateString("vi-VN")}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-3 py-3">
                              Không có VIN khả dụng. Vui lòng kiểm tra tồn kho
                              hoặc bổ sung xe.
                            </div>
                          )}

                          {errors.vehicleUnitId && (
                            <p className="text-red-500 text-sm">
                              {errors.vehicleUnitId}
                            </p>
                          )}
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Điều khoản tài chính */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              ĐIỀU KHOẢN TÀI CHÍNH
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Price - Read Only */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Giá niêm yết xe *
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black font-medium">
                  {formatMoney(formData.basePrice)}
                </div>
                <p className="text-xs text-gray-500">
                  Giá được tự động lấy từ thông tin xe đã chọn
                </p>
              </div>

              {/* Promotion Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mã khuyến mãi
                </label>
                <select
                  value={selectedPromotionId || ""}
                  onChange={(e) => {
                    console.log("🎁 Promotion selected:", e.target.value);
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
                    const basePriceNum = Number(formData.basePrice) || 0;
                    if (selectedPromotion && basePriceNum > 0) {
                      const discountValueNum =
                        Number(selectedPromotion.discountValue) || 0;
                      if (selectedPromotion.discountType === "PERCENTAGE") {
                        calculatedDiscount =
                          (basePriceNum * discountValueNum) / 100;
                      } else {
                        calculatedDiscount = discountValueNum;
                      }
                    }

                    setFormData((prev) => ({
                      ...prev,
                      discount: Math.round(calculatedDiscount), // Làm tròn để tránh số thập phân
                    }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Không chọn khuyến mãi</option>
                  {promotions.length === 0 ? (
                    <option value="" disabled>
                      {dealerId
                        ? "Đang tải khuyến mãi..."
                        : "Không có khuyến mãi"}
                    </option>
                  ) : (
                    promotions
                      .filter((promotion) => {
                        // Chỉ hiển thị promotion nếu đủ điều kiện minPurchase
                        if (promotion.minPurchase) {
                          return (
                            formData.basePrice >= Number(promotion.minPurchase)
                          );
                        }
                        return true; // Không có minPurchase thì luôn hiển thị
                      })
                      .map((promotion) => (
                        <option key={promotion.id} value={promotion.id}>
                          {promotion.source === "MANUFACTURER" ? "🏭 " : "🏪 "}
                          {promotion.name} -{" "}
                          {promotion.discountType === "PERCENTAGE"
                            ? `${promotion.discountValue}%`
                            : formatMoney(promotion.discountValue)}
                          {promotion.description &&
                            ` (${promotion.description})`}
                          {promotion.source === "MANUFACTURER"
                            ? " - Hãng cấp"
                            : ""}
                        </option>
                      ))
                  )}
                </select>

                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-1">
                  Tìm thấy{" "}
                  {
                    promotions.filter(
                      (p) =>
                        !p.minPurchase ||
                        formData.basePrice >= Number(p.minPurchase)
                    ).length
                  }{" "}
                  khuyến mãi khả dụng
                  {promotions.length > 0 && (
                    <span className="text-gray-400">
                      {" "}
                      (tổng {promotions.length} khuyến mãi)
                    </span>
                  )}
                </div>
                {selectedPromotionId && (
                  <div className="text-sm">
                    {(() => {
                      const selectedPromotion = promotions.find(
                        (p) => p.id === selectedPromotionId
                      );
                      if (
                        selectedPromotion?.minPurchase &&
                        formData.basePrice <
                          Number(selectedPromotion.minPurchase)
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
                {errors.promotion && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.promotion}
                  </p>
                )}
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Chiết khấu (tự động từ mã khuyến mãi)
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black font-medium">
                  {formatMoney(formData.discount || 0)}
                </div>
                <p className="text-xs text-gray-500">
                  {selectedPromotionId
                    ? "Chiết khấu được tự động tính từ mã khuyến mãi đã chọn"
                    : "Chọn mã khuyến mãi để tự động tính chiết khấu"}
                </p>
                {errors.discount && (
                  <p className="text-red-500 text-sm">{errors.discount}</p>
                )}
              </div>

              {/* Tax - VAT tự động 10% */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Thuế VAT (10% tự động)
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black">
                  {formatMoney(taxAmount)} (10% trên giá sau giảm giá)
                </div>
                <p className="text-xs text-gray-500">
                  Thuế VAT tự động tính theo quy định Việt Nam: 10% trên giá sau
                  giảm giá
                </p>
              </div>

              {/* Final Price Display */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tổng thanh toán
                </label>
                <div className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg bg-blue-50 text-black font-bold text-lg">
                  {formatMoney(finalPrice)}
                </div>
                <p className="text-xs text-gray-500">
                  = Giá sau chiết khấu + Thuế VAT (10% cố định)
                </p>
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
                    <p className="text-sm text-gray-600">
                      Thanh toán từng tháng
                    </p>
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
                      Trả trước (60% bắt buộc)
                    </label>
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black font-medium">
                      {formatMoney(Math.round(downPaymentAmount))}
                    </div>
                    <p className="text-xs text-gray-500">
                      60% của tổng giá trị sau thuế
                    </p>
                  </div>
                </div>

                {/* Payment Calculation */}
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Giá trị hợp đồng (sau thuế):
                    </span>
                    <span className="font-medium text-black">
                      {formatMoney(finalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trả trước (60%):</span>
                    <span className="font-medium text-blue-600">
                      {formatMoney(Math.round(downPaymentAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền còn lại:</span>
                    <span className="font-medium text-black">
                      {formatMoney(Math.round(financedAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lãi suất:</span>
                    <span className="font-medium text-red-600">
                      {Number(formData.interestRate || 0).toFixed(1)}% / năm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trả hàng tháng:</span>
                    <span className="font-bold text-blue-600">
                      {formatMoney(monthlyPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền lãi phải trả:</span>
                    <span className="font-medium text-red-600">
                      {formatMoney(
                        Math.round(totalInstallmentAmount - finalPrice)
                      )}
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
          </div>

          {/* Section 3: Tóm tắt hợp đồng */}
          <div className="bg-white border-2 border-gray-300 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              TÓM TẮT HỢP ĐỒNG
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Giá niêm yết xe:</span>
                <span className="font-medium text-black">
                  {formatMoney(formData.basePrice)}
                </span>
              </div>

              {(formData.discount || 0) > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Chiết khấu/Khuyến mãi:</span>
                  <span className="font-medium text-red-600">
                    - {formatMoney(formData.discount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">
                  Giá sau chiết khấu (căn cứ tính VAT):
                </span>
                <span className="font-medium text-black">
                  {formatMoney(priceAfterDiscount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">
                  Thuế VAT (10% trên giá sau chiết khấu):
                </span>
                <span className="font-medium text-blue-600">
                  {formatMoney(taxAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b-2 border-gray-400">
                <span className="text-lg font-semibold text-gray-800">
                  TỔNG CỘNG PHẢI TRẢ:
                </span>
                <span className="text-lg font-bold text-green-600">
                  {formatMoney(finalPrice)}
                </span>
              </div>

              {formData.paymentType === "INSTALLMENT" && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700">Trả trước (60%):</span>
                    <span className="font-medium text-blue-600">
                      {formatMoney(Math.round(downPaymentAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700">
                      Trả hàng tháng ({formData.installmentMonths} tháng):
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatMoney(monthlyPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-700">
                      Tổng tiền phải trả (bao gồm lãi):
                    </span>
                    <span className="font-medium text-orange-600">
                      {formatMoney(totalInstallmentAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Ghi chú & Điều khoản */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              GHI CHÚ & ĐIỀU KHOẢN
            </h2>

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
          </div>

          {/* Section 5: Xác nhận & Ký kết - Chỉ hiển thị khi HĐ đã tồn tại và không ở trạng thái nháp (trừ HĐ đặt cọc) */}
          {contract &&
            (contract.contractType === "DEPOSIT" ||
              contract.status !== "DRAFT") && (
              <div className="bg-white border-2 border-gray-300 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  XÁC NHẬN & KÝ KẾT
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Bên mua (Khách hàng) *
                      </h4>
                      {/* Chỉ hiển thị SignaturePad nếu chưa có chữ ký */}
                      {!(contract?.customerSignature || customerSignature) ? (
                        <SignaturePad
                          label="Chữ ký khách hàng"
                          onSignatureChange={(dataUrl) => {
                            setCustomerSignature(dataUrl);
                          }}
                        />
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">
                            ✓ Đã có chữ ký từ hợp đồng đặt cọc
                          </p>
                        </div>
                      )}
                      {(customerSignature || contract?.customerSignature) && (
                        <img
                          src={
                            customerSignature ||
                            contract?.customerSignature ||
                            ""
                          }
                          alt="Chữ ký khách hàng"
                          className="mt-2 border border-gray-300 rounded"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                      )}
                      {errors.customerSignature && (
                        <p className="text-red-500 text-sm mt-2">
                          {errors.customerSignature}
                        </p>
                      )}
                      <p className="text-gray-600 mt-2">
                        Ngày: {new Date().toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Bên bán (Đại lý) *
                      </h4>
                      {/* Chỉ hiển thị SignaturePad nếu chưa có chữ ký */}
                      {!(contract?.dealerSignature || dealerSignature) ? (
                        <SignaturePad
                          label="Chữ ký đại lý"
                          onSignatureChange={(dataUrl) => {
                            setDealerSignature(dataUrl);
                          }}
                        />
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">
                            ✓ Đã có chữ ký từ hợp đồng đặt cọc
                          </p>
                        </div>
                      )}
                      {(dealerSignature || contract?.dealerSignature) && (
                        <img
                          src={
                            dealerSignature || contract?.dealerSignature || ""
                          }
                          alt="Chữ ký đại lý"
                          className="mt-2 border border-gray-300 rounded"
                          style={{ maxWidth: "100%", height: "auto" }}
                        />
                      )}
                      {errors.dealerSignature && (
                        <p className="text-red-500 text-sm mt-2">
                          {errors.dealerSignature}
                        </p>
                      )}
                      <p className="text-gray-600 mt-2">
                        Ngày: {new Date().toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Validation Errors */}
          {errors.general && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t-2 border-gray-300">
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
                  {isNewFromDeposit
                    ? "Lưu hợp đồng"
                    : contract
                    ? "Cập nhật hợp đồng"
                    : "Tạo hợp đồng"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Toast Notification */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
