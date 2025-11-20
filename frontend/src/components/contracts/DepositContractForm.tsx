"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Save,
  User,
  Car,
  DollarSign,
  ChevronDown,
  Truck,
  FileText,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Contract,
  contractApi,
  CreateContractInput,
} from "@/lib/api/contractApi";
import { customerApi } from "@/lib/api/customerApi";
import { vehicleApi, type Vehicle } from "@/lib/api/vehicleApi";
import {
  vehicleUnitApi,
  type VehicleUnitSummary,
} from "@/lib/api/vehicleUnitApi";
import { formatMoney } from "@/lib/utils/formatMoney";
import SignaturePad from "@/components/shared/SignaturePad";
import { Loader2 } from "lucide-react";

interface DepositContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contract: Contract) => void;
  contract?: Contract | null; // For editing
  dealerId: string;
  userId: string; // staffId
}

export default function DepositContractForm({
  isOpen,
  onClose,
  onSuccess,
  contract,
  dealerId,
  userId,
}: DepositContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailFound, setEmailFound] = useState(false);
  const [foundEmail, setFoundEmail] = useState(""); // Lưu email đã tìm thấy khách hàng

  // Customer info giống ContractForm
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  // Dữ liệu xe + dropdown giống ContractForm
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchVehicle, setSearchVehicle] = useState("");
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  // VIN khả dụng
  const [vehicleUnits, setVehicleUnits] = useState<VehicleUnitSummary[]>([]);
  const [vehicleUnitsLoading, setVehicleUnitsLoading] = useState(false);
  const [vehicleUnitError, setVehicleUnitError] = useState("");

  // Form đặt cọc
  const [form, setForm] = useState<{
    vehicleId: string;
    vehicleUnitId: string;
    customerId?: string; // Thêm customerId để track khi tìm thấy từ email
    method?: "CASH" | "BANK_TRANSFER";
    validUntil?: string;
    paymentType: "FULL" | "INSTALLMENT";
    notes?: string;
  }>({
    vehicleId: "",
    vehicleUnitId: "",
    method: "CASH",
    paymentType: "FULL",
  });

  // Signature state
  const [customerSignature, setCustomerSignature] = useState<string | null>(
    null
  );
  const [dealerSignature, setDealerSignature] = useState<string | null>(null);

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          !searchVehicle ||
          `${v.manufacturer?.name} ${v.model} ${v.variant || ""}`
            .toLowerCase()
            .includes(searchVehicle.toLowerCase())
      ),
    [vehicles, searchVehicle]
  );

  // Tính tiền cọc tự động 10% giá niêm yết
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === form.vehicleId),
    [vehicles, form.vehicleId]
  );
  const retailPrice = Number(selectedVehicle?.retailPrice || 0);
  const computedDepositAmount =
    retailPrice > 0 ? Math.ceil(retailPrice * 0.1) : 0;

  // Populate form khi edit mode
  useEffect(() => {
    if (isOpen && contract) {
      // Edit mode - populate form với data từ contract
      setForm({
        vehicleId: contract.vehicleId,
        vehicleUnitId: contract.vehicleUnitId || "",
        method: "CASH", // Default, có thể lấy từ deposit nếu có
        validUntil: "", // Có thể lấy từ deposit nếu có
        notes: contract.notes || "",
        paymentType: contract.paymentType,
      });

      // Fetch customer info
      if (contract.customerId) {
        customerApi
          .getCustomerById(contract.customerId)
          .then((res) => {
            const customer = res.data?.data || res.data;
            setCustomerInfo({
              firstName: customer.firstName || "",
              lastName: customer.lastName || "",
              email: customer.email || "",
              phone: customer.phone || "",
              address: customer.address || "",
            });
          })
          .catch(() => {});
      }

      // Load signatures from contract
      setCustomerSignature(contract.customerSignature || null);
      setDealerSignature(contract.dealerSignature || null);
    } else if (isOpen) {
      // Create mode - reset form
      setForm({
        vehicleId: "",
        vehicleUnitId: "",
        method: "CASH",
        paymentType: "FULL",
      });
      setCustomerInfo({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
      });
      setEmailFound(false);
      setFoundEmail("");
      setCustomerSignature(null);
      setDealerSignature(null);
    }
  }, [isOpen, contract]);

  // Load vehicles theo dealer
  useEffect(() => {
    if (!isOpen) return;

    const loadVehicles = async () => {
      try {
        let res;
        if (dealerId) {
          res = await vehicleApi.getDealerVehicles(
            dealerId,
            {},
            { limit: 100 }
          );
        } else {
          res = await vehicleApi.getAllVehicles({}, { limit: 100 });
        }
        const data = res.data?.data || res.data || [];
        setVehicles(data);
      } catch {
        setVehicles([]);
      }
    };

    loadVehicles();
  }, [isOpen, dealerId]);

  // Load VIN khả dụng
  useEffect(() => {
    if (!isOpen) return;

    const loadUnits = async () => {
      if (!form.vehicleId || !dealerId) {
        setVehicleUnits([]);
        setVehicleUnitError("");
        setForm((s) => (s.vehicleUnitId ? { ...s, vehicleUnitId: "" } : s));
        return;
      }
      setVehicleUnitsLoading(true);
      setVehicleUnitError("");
      try {
        const res = await vehicleUnitApi.getAvailableUnits(
          form.vehicleId,
          dealerId
        );
        const payload = res.data?.data;
        const units: VehicleUnitSummary[] = Array.isArray(payload)
          ? payload
          : [];
        setVehicleUnits(units);
        if (units.length > 0) {
          setForm((s) =>
            s.vehicleUnitId ? s : { ...s, vehicleUnitId: units[0].id }
          );
        } else {
          setVehicleUnitError("Không có VIN khả dụng tại đại lý.");
        }
      } catch (err: any) {
        setVehicleUnitError(
          err?.response?.data?.message || "Không thể tải VIN khả dụng."
        );
        setVehicleUnits([]);
      } finally {
        setVehicleUnitsLoading(false);
      }
    };

    loadUnits();
  }, [isOpen, form.vehicleId, dealerId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerInfo.firstName.trim()) e.firstName = "Vui lòng nhập họ";
    if (!customerInfo.lastName.trim()) e.lastName = "Vui lòng nhập tên";
    if (!customerInfo.email.trim()) e.email = "Vui lòng nhập email";
    if (!customerInfo.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    if (!customerInfo.address.trim()) e.address = "Vui lòng nhập địa chỉ";
    if (!form.vehicleId) e.vehicleId = "Vui lòng chọn xe";
    if (!form.vehicleUnitId) e.vehicleUnitId = "Vui lòng chọn VIN";
    if (retailPrice <= 0)
      e.depositAmount = "Không xác định được giá niêm yết để tính tiền cọc";
    const requiresSignature = !contract || contract.status === "DRAFT";
    if (requiresSignature) {
      if (!customerSignature) {
        e.customerSignature = "Vui lòng ký xác nhận của khách hàng";
      }
      if (!dealerSignature) {
        e.dealerSignature = "Vui lòng ký xác nhận của đại lý";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let customerId = contract?.customerId || form.customerId || "";

      // Create or Update customer
      if (customerId) {
        // Edit mode - Update customer
        try {
          await customerApi.updateCustomer(customerId, customerInfo);
        } catch (error) {
          // Continue with existing customerId if update fails
        }
      } else {
        // Create mode - Create new customer
        const customerRes = await customerApi.createCustomer({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
        });
        customerId = customerRes.data?.data?.id || customerRes.data?.id;
        if (!customerId) {
          throw new Error("Không thể tạo khách hàng, vui lòng thử lại");
        }
      }

      // Create or Update contract
      const payload: Partial<CreateContractInput> = {
        customerId,
        vehicleId: form.vehicleId,
        vehicleUnitId: form.vehicleUnitId,
        staffId: userId,
        basePrice: retailPrice,
        discount: 0,
        paymentType: form.paymentType,
        installmentMonths: form.paymentType === "INSTALLMENT" ? 24 : undefined,
        interestRate: form.paymentType === "INSTALLMENT" ? 12 : undefined,
        notes: form.notes || "",
        contractType: "DEPOSIT",
        depositAmount: computedDepositAmount,
        customerSignature: customerSignature || undefined,
        dealerSignature: dealerSignature || undefined,
      };

      let result;
      if (contract) {
        // Update existing contract
        result = await contractApi.updateContract(contract.id, payload);
        toast.success("Cập nhật hợp đồng đặt cọc thành công!");
      } else {
        // Create new contract
        const res = await contractApi.createContract(
          payload as CreateContractInput
        );
        result = res;
        toast.success("Tạo hợp đồng đặt cọc thành công!");
      }

      const created: Contract = result.data?.data || result.data;
      onSuccess(created);
      onClose();
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.message || err?.message || "Có lỗi xảy ra";
      setErrors({ general: backendMsg });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl border-2 border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700">
          <h3 className="text-xl font-bold text-white">
            {contract ? "Cập nhật hợp đồng đặt cọc" : "Tạo hợp đồng đặt cọc"}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto p-6 space-y-8 modal-scrollbar"
        >
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {errors.general}
            </div>
          )}

          {/* Header giống ContractForm */}
          <div className="text-center border-b-2 border-gray-300 pb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              HỢP ĐỒNG ĐẶT CỌC XE ĐIỆN
            </h1>
          </div>

          {/* Thông tin khách hàng */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              THÔNG TIN KHÁCH HÀNG
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ *
                  </label>
                  <input
                    value={customerInfo.firstName}
                    onChange={(e) =>
                      setCustomerInfo((s) => ({
                        ...s,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                    placeholder="Nhập họ..."
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên *
                  </label>
                  <input
                    value={customerInfo.lastName}
                    onChange={(e) =>
                      setCustomerInfo((s) => ({
                        ...s,
                        lastName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                    placeholder="Nhập tên..."
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
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
                          setForm((s) => ({
                            ...s,
                            customerId: undefined,
                          }));
                        } else {
                          // 2. Nếu chưa tìm thấy gì (nhập bình thường), chỉ update email
                          setCustomerInfo((s) => ({
                            ...s,
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
                          if (!contract?.customerId && foundEmail) {
                            setCustomerInfo((s) => ({
                              ...s,
                              firstName: "",
                              lastName: "",
                              phone: "",
                              address: "",
                            }));
                            setForm((s) => ({
                              ...s,
                              customerId: undefined,
                            }));
                            setFoundEmail("");
                            setEmailFound(false);
                          }
                          return;
                        }
                        // Chỉ check nếu chưa có customerId (tạo mới)
                        if (!contract?.customerId) {
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
                              setForm((s) => ({
                                ...s,
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
                                setForm((s) => ({
                                  ...s,
                                  customerId: undefined,
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
                            if (
                              emailFound &&
                              foundEmail &&
                              !contract?.customerId
                            ) {
                              setCustomerInfo((s) => ({
                                ...s,
                                firstName: "",
                                lastName: "",
                                phone: "",
                                address: "",
                              }));
                              setForm((s) => ({
                                ...s,
                                customerId: undefined,
                              }));
                            }
                            setFoundEmail("");
                            setEmailFound(false);
                          } finally {
                            setCheckingEmail(false);
                          }
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                      placeholder="example@email.com"
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      </div>
                    )}
                    {emailFound && !checkingEmail && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          Đã tìm thấy
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo((s) => ({ ...s, phone: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                    placeholder="0123456789"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ *
                </label>
                <input
                  value={customerInfo.address}
                  onChange={(e) =>
                    setCustomerInfo((s) => ({ ...s, address: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                  placeholder="Nhập địa chỉ đầy đủ..."
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin xe + VIN giống style ContractForm */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              THÔNG TIN XE
            </h2>

            {/* Dropdown chọn xe */}
            <div className="space-y-2">
              <div className="relative vehicle-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowVehicleDropdown((s) => !s)}
                  className={`w-full px-4 py-3 text-sm rounded-lg text-left flex items-center justify-between transition-all duration-200 ${
                    form.vehicleId
                      ? "bg-indigo-50 border-2 border-indigo-200 shadow-md"
                      : "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {form.vehicleId ? (
                      <div>
                        <div className="font-medium text-black truncate">
                          {(() => {
                            const v = vehicles.find(
                              (item) => item.id === form.vehicleId
                            );
                            return v
                              ? `${v.manufacturer?.name} ${v.model}${
                                  v.variant ? ` - ${v.variant}` : ""
                                }`
                              : "Chọn xe...";
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(() => {
                            const v = vehicles.find(
                              (item) => item.id === form.vehicleId
                            );
                            return v
                              ? `${v.year} • ${formatMoney(
                                  Number(v.retailPrice || 0)
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
                {showVehicleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Tìm kiếm xe..."
                        value={searchVehicle}
                        onChange={(e) => setSearchVehicle(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredVehicles.length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          {vehicles.length === 0
                            ? "Đang tải xe..."
                            : "Không tìm thấy xe phù hợp"}
                        </div>
                      ) : (
                        filteredVehicles.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setForm((s) => ({
                                ...s,
                                vehicleId: v.id,
                                vehicleUnitId: "",
                              }));
                              setVehicleUnits([]);
                              setVehicleUnitError("");
                              setShowVehicleDropdown(false);
                              setSearchVehicle("");
                            }}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-black">
                              {v.manufacturer?.name} {v.model}
                              {v.variant ? ` - ${v.variant}` : ""}
                            </div>
                            <div className="text-sm text-gray-600">
                              {v.year} •{" "}
                              {formatMoney(Number(v.retailPrice || 0))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.vehicleId && (
                <p className="text-red-500 text-sm mt-1">{errors.vehicleId}</p>
              )}
            </div>

            {/* VIN */}
            {form.vehicleId && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Truck className="w-4 h-4" /> Chọn xe (VIN) *
                  </span>
                </div>

                {vehicleUnitError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {vehicleUnitError}
                  </div>
                )}

                {vehicleUnitsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    Đang tải danh sách VIN khả dụng...
                  </div>
                ) : vehicleUnits.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {vehicleUnits.map((unit) => (
                      <label
                        key={unit.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          form.vehicleUnitId === unit.id
                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                            : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="vehicle-unit"
                          value={unit.id}
                          checked={form.vehicleUnitId === unit.id}
                          onChange={() =>
                            setForm((s) => ({ ...s, vehicleUnitId: unit.id }))
                          }
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {unit.vin}
                            </span>
                            {unit.color && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                Màu: {unit.color}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Trạng thái: {unit.status}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-3 py-3">
                    Không có VIN khả dụng. Vui lòng kiểm tra tồn kho hoặc bổ
                    sung xe.
                  </div>
                )}
                {errors.vehicleUnitId && (
                  <p className="text-red-500 text-sm">{errors.vehicleUnitId}</p>
                )}
              </div>
            )}
          </div>

          {/* Thông tin đặt cọc */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              THÔNG TIN ĐẶT CỌC
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Số tiền cọc (tự động 10% giá niêm yết)
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black font-medium">
                  {retailPrice > 0
                    ? `${new Intl.NumberFormat("vi-VN").format(
                        computedDepositAmount
                      )} VND`
                    : "Chọn xe để tính cọc"}
                </div>
                {errors.depositAmount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.depositAmount}
                  </p>
                )}
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <input
                  value={form.notes || ""}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, notes: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                  placeholder="Ghi chú đặt cọc (tuỳ chọn)"
                />
              </div>
            </div>
          </div>

          {/* Xác nhận & Ký kết */}
          <div className="bg-white border-2 border-gray-300 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              XÁC NHẬN & KÝ KẾT
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Bên mua (Khách hàng)
                  </h4>
                  <SignaturePad
                    label="Chữ ký khách hàng"
                    onSignatureChange={(dataUrl) => {
                      setCustomerSignature(dataUrl);
                    }}
                  />
                  {customerSignature && (
                    <img
                      src={customerSignature}
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
                    Bên bán (Đại lý)
                  </h4>
                  <SignaturePad
                    label="Chữ ký đại lý"
                    onSignatureChange={(dataUrl) => {
                      setDealerSignature(dataUrl);
                    }}
                  />
                  {dealerSignature && (
                    <img
                      src={dealerSignature}
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
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {contract ? "Cập nhật hợp đồng" : "Tạo hợp đồng đặt cọc"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
