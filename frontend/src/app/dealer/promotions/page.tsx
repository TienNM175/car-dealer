"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  Lock,
  Car,
  ChevronDown,
  Check,
} from "lucide-react";
import { promotionApi } from "@/lib/api/promotionApi";
import { vehicleUnitApi } from "@/lib/api/vehicleUnitApi";
import { Promotion, UpdatePromotionDTO, PromotionStatistics, PromotionSource, AvailablePromotionsResponse } from "@/lib/types/promotion.types";
import { VehicleUnitSummary as VehicleUnit } from "@/lib/api/vehicleUnitApi"; // Import type từ vehicleUnitApi
import { useAuth } from "@/contexts/AuthContext";

// Temporary interface for raw API response to avoid TS errors
interface RawPromotionStatistics {
  total: number;
  active: number;
  inactive: number;
  byType?: {
    PERCENTAGE?: {
      count: number;
      avgValue: string;
    };
    FIXED?: {
      count: number;
      avgValue: string;
    };
  };
  avgDiscount?: string;
  expiringSoon?: any[];
}

export default function PromotionsPage() {
  const { user } = useAuth(); // Lấy user từ context (dealerId, role)
  const dealerId = user?.dealerId;
  const isManager = user?.role === "DEALER_MANAGER"; // Kiểm tra role để phân quyền UI
  const canToggle = user?.role === "DEALER_MANAGER" || user?.role === "DEALER_STAFF";
  const [availablePromotions, setAvailablePromotions] = useState<AvailablePromotionsResponse | null>(null);
  const [vehicles, setVehicles] = useState<VehicleUnit[]>([]); // State cho list Vehicle Units
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Tab state
  const [activeTab, setActiveTab] = useState<"list" | "statistics">("list");
  const [activeSourceTab, setActiveSourceTab] = useState<PromotionSource>("DEALER"); // Thêm tab cho source: DEALER (tự tạo) vs MANUFACTURER (từ hãng)
  const [statistics, setStatistics] = useState<PromotionStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Modal states (chỉ dùng cho manager, và chỉ cho DEALER promotions)
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPromotionId, setDeletingPromotionId] = useState<string | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false); // Modal multi-select cho Vehicle Units
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState(""); // Search trong modal xe
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase: string; // Format VND
    startDate: string;
    endDate: string;
    isActive: boolean;
    vehicleUnitIds: string[]; // Thêm mảng ID Vehicle Units
  }>({
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minPurchase: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive: true,
    vehicleUnitIds: [], // Mặc định rỗng (áp dụng cho mọi xe)
  });
  const [discountValueFormatted, setDiscountValueFormatted] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});
  const [selectedVehicleUnits, setSelectedVehicleUnits] = useState<string[]>([]); // Selected IDs trong modal

  // Computed promotions based on activeSourceTab
  const promotions = useMemo(() => {
    if (!availablePromotions) return [];
    return activeSourceTab === "DEALER" 
      ? availablePromotions.dealerPromotions 
      : availablePromotions.manufacturerPromotions;
  }, [availablePromotions, activeSourceTab]);

  // Filtered vehicles cho modal
  const filteredVehicles = useMemo(() => {
  if (!vehicleSearchTerm.trim()) return vehicles;

  const term = vehicleSearchTerm.toLowerCase().trim();

  return vehicles.filter((v) => {
    const manufacturer = v.vehicle?.manufacturer?.name?.toLowerCase() || "";
    const model = v.vehicle?.model?.toLowerCase() || "";
    const variant = v.vehicle?.variant?.toLowerCase() || "";
    const vin = v.vin?.toLowerCase() || "";
    const color = v.color?.toLowerCase() || "";

    return (
      manufacturer.includes(term) ||
      model.includes(term) ||
      variant.includes(term) ||
      vin.includes(term) ||
      color.includes(term)
    );
  });
}, [vehicles, vehicleSearchTerm]);

  // Format functions
  const formatVNDInput = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    return Number(numbers).toLocaleString("vi-VN");
  };

  const unformatVND = (value: string): number => {
    return Number(value.replace(/\./g, "")) || 0;
  };

  const formatVND = (v: number) =>
    v.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "Không giới hạn";
    const dateString = typeof dateValue === "string" ? dateValue : dateValue.toISOString();
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; description?: string } = {};

    if (formData.name.trim().length < 5) {
      errors.name = "Tên khuyến mãi phải có ít nhất 5 ký tự";
    }

    if (formData.description.trim().length > 0 && formData.description.trim().length < 5) {
      errors.description = "Mô tả phải có ít nhất 5 ký tự";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch vehicles (Vehicle Units) available cho dealer
  const fetchVehicles = async () => {
    if (!dealerId) return;
    try {
      setLoadingVehicles(true);
      const response = await vehicleUnitApi.list({
        dealerId,
        status: "IN_STOCK", // Chỉ lấy xe còn hàng
        limit: 100, // Giới hạn để tránh load quá nhiều
      });
      setVehicles(response.data.data);
    } catch (err: any) {
      console.error("Error fetching vehicles:", err);
      setError("Không thể tải danh sách xe");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchPromotions = async () => {
    if (!dealerId) {
      setError("Không tìm thấy thông tin đại lý. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Sử dụng getAvailablePromotions để separate MANUFACTURER & DEALER (include vehicleUnits)
      const response = await promotionApi.getAvailablePromotions(dealerId);
      setAvailablePromotions(response);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setError(err.response?.data?.message || "Không thể tải danh sách khuyến mãi");
      }
      console.error("Error fetching promotions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!dealerId) return;

    try {
      setLoadingStats(true);
      // Filter stats theo activeSourceTab nếu cần (optional)
      const apiData = (await promotionApi.getStatistics(dealerId, activeSourceTab)) as unknown as RawPromotionStatistics;
      
      const mappedStats: PromotionStatistics = {
        totalPromotions: apiData.total || 0,
        activePromotions: apiData.active || 0,
        inactivePromotions: apiData.inactive || 0,
        expiredPromotions: 0,
        promotionsByType: {
          PERCENTAGE: apiData.byType?.PERCENTAGE?.count || 0,
          FIXED: apiData.byType?.FIXED?.count || 0,
        },
      };
      
      setStatistics(mappedStats);
    } catch (err: any) {
      console.error("Error fetching statistics:", err);
      setError("Không thể tải thống kê");
    } finally {
      setLoadingStats(false);
    }
  };

  // CRUD Handlers (chỉ dùng cho manager và chỉ cho DEALER promotions)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError(null);
      const submitData = {
        ...formData,
        minPurchase: unformatVND(formData.minPurchase),
        dealerId, // Gửi dealerId, backend sẽ force nếu cần
        source: "DEALER" as PromotionSource, // Auto-set source=DEALER cho dealer
        vehicleUnitIds: formData.vehicleUnitIds, // Gửi mảng IDs
      };
      await promotionApi.create(submitData);
      setSuccess("Tạo khuyến mãi thành công!");
      setShowModal(false);
      resetForm();
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Tạo thất bại");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!editingPromotion) return;

    // Check if editable (MANUFACTURER không được sửa)
    if (editingPromotion.source === "MANUFACTURER") {
      alert("Không được chỉnh sửa mã khuyến mãi từ hãng!");
      return;
    }

    try {
      setError(null);
      const updateData: UpdatePromotionDTO = {
        ...formData,
        minPurchase: unformatVND(formData.minPurchase),
        vehicleUnitIds: formData.vehicleUnitIds, // Update mảng IDs
      };
      await promotionApi.update(editingPromotion.id, updateData);
      setSuccess("Cập nhật thành công!");
      setShowModal(false);
      resetForm();
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const openDeleteModal = (promotion: Promotion) => {
    // Chỉ cho DEALER promotions
    if (promotion.source === "MANUFACTURER") {
      alert("Không được xóa mã khuyến mãi từ hãng!");
      return;
    }
    setDeletingPromotion(promotion);
    setDeletingPromotionId(promotion.id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingPromotion || !deletingPromotionId) return;

    if (deletingPromotion.source === "MANUFACTURER") {
      alert("Không được xóa mã khuyến mãi từ hãng!");
      setShowDeleteModal(false);
      setDeletingPromotion(null);
      setDeletingPromotionId(null);
      return;
    }

    if (deletingPromotion.isActive) {
      setError("Cannot delete active promotion that has already started");
      setShowDeleteModal(false);
      setDeletingPromotion(null);
      setDeletingPromotionId(null);
      return;
    }

    try {
      setError(null);
      await promotionApi.delete(deletingPromotionId);
      setSuccess("Xóa thành công!");
      setShowDeleteModal(false);
      setDeletingPromotion(null);
      setDeletingPromotionId(null);
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const handleToggleStatus = async (id: string) => {
    const promotion = promotions.find(p => p.id === id);
    if (!promotion) return;

    // Chỉ cho DEALER promotions
    if (promotion.source === "MANUFACTURER") {
      alert("Không được thay đổi trạng thái mã khuyến mãi từ hãng!");
      return;
    }

    try {
      setError(null);
      await promotionApi.toggleStatus(id);
      setSuccess("Cập nhật trạng thái thành công!");
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingPromotion(null);
    setShowModal(true);
  };

  const openEditModal = (promotion: Promotion) => {
    // Chỉ cho DEALER promotions
    if (promotion.source === "MANUFACTURER") {
      alert("Không được chỉnh sửa mã khuyến mãi từ hãng!");
      return;
    }

    const startDateStr =
      typeof promotion.startDate === "string"
        ? promotion.startDate.split("T")[0]
        : new Date(promotion.startDate).toISOString().split("T")[0];

    let endDateStr: string;
    if (!promotion.endDate) {
      endDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    } else if (typeof promotion.endDate === "string") {
      endDateStr = promotion.endDate.split("T")[0];
    } else {
      endDateStr = new Date(promotion.endDate).toISOString().split("T")[0];
    }

    const formattedMinPurchase = promotion.minPurchase ? Number(promotion.minPurchase).toLocaleString("vi-VN") : "";
    const formattedDiscountValue = promotion.discountType === "FIXED" ? Number(promotion.discountValue).toLocaleString("vi-VN") : promotion.discountValue.toString();

    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || "",
      discountType: promotion.discountType,
      discountValue: Number(promotion.discountValue),
      minPurchase: formattedMinPurchase,
      startDate: startDateStr,
      endDate: endDateStr,
      isActive: promotion.isActive,
      vehicleUnitIds: promotion.vehicleUnits?.map(vu => vu.vehicleUnit?.id || '')?.filter(id => id) || [],
    });
    setSelectedVehicleUnits(promotion.vehicleUnits?.map(vu => vu.vehicleUnit?.id || '')?.filter(id => id) || []);
    setDiscountValueFormatted(formattedDiscountValue);
    setFormErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minPurchase: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
      vehicleUnitIds: [],
    });
    setSelectedVehicleUnits([]);
    setDiscountValueFormatted("");
    setFormErrors({});
    setEditingPromotion(null);
  };

  // Handle discount type change
  useEffect(() => {
    if (formData.discountType === "FIXED") {
      setDiscountValueFormatted(Number(formData.discountValue).toLocaleString("vi-VN"));
    } else {
      setDiscountValueFormatted(formData.discountValue.toString());
    }
  }, [formData.discountType, formData.discountValue]);

  // Handle discount value change
  const handleDiscountValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formData.discountType === "FIXED") {
      const formatted = formatVNDInput(e.target.value);
      const unformatted = unformatVND(formatted);
      setDiscountValueFormatted(formatted);
      setFormData({ ...formData, discountValue: unformatted });
    } else {
      setFormData({ ...formData, discountValue: Number(e.target.value) || 0 });
      setDiscountValueFormatted(e.target.value);
    }
  };

  // Handle open vehicle modal
  const openVehicleModal = () => {
    setVehicleSearchTerm("");
    setShowVehicleModal(true);
  };

  // Handle select vehicle units
  const toggleVehicleUnit = (vehicleUnitId: string) => {
    setSelectedVehicleUnits(prev =>
      prev.includes(vehicleUnitId)
        ? prev.filter(id => id !== vehicleUnitId)
        : [...prev, vehicleUnitId]
    );
  };

  // Confirm selection
  const confirmVehicleSelection = () => {
    setFormData({ ...formData, vehicleUnitIds: selectedVehicleUnits });
    setShowVehicleModal(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPromotions();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterActive, startDate, endDate, sortBy, sortOrder, dealerId]); // Filters áp dụng chung, nhưng fetch dùng available (không param, filter ở UI)

  useEffect(() => {
    if (activeTab === "statistics") {
      fetchStatistics();
    }
  }, [activeTab, dealerId, activeSourceTab]); // Refetch stats khi switch source tab

  // Load vehicles khi open modal hoặc khi cần
  useEffect(() => {
    if (showModal && isManager && activeSourceTab === "DEALER") {
      fetchVehicles();
    }
  }, [showModal, isManager, activeSourceTab, dealerId]);

  if (loading && promotions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải khuyến mãi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                Khuyến mãi của bạn
              </h2>
              <p className="text-sm text-gray-500">
                {isManager ? "Quản lý chương trình khuyến mãi cho đại lý của bạn" : "Xem các chương trình khuyến mãi đang áp dụng cho đại lý"}
              </p>
            </div>
            <div className="flex gap-2">
              {isManager && activeSourceTab === "DEALER" && ( // Chỉ show nút tạo cho tab DEALER
                <button
                  onClick={openCreateModal}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Tạo mới
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation - Main Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-all ${
                activeTab === "list"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Danh sách
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`flex-1 px-6 py-4 font-semibold text-sm transition-all ${
                activeTab === "statistics"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Thống kê
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Source Tabs - Chỉ cho List Tab */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveSourceTab("DEALER")}
                className={`flex-1 px-6 py-4 font-semibold text-sm transition-all ${
                  activeSourceTab === "DEALER"
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-b-2 border-green-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Tự tạo ({availablePromotions?.dealerPromotions.length || 0})
              </button>
              <button
                onClick={() => setActiveSourceTab("MANUFACTURER")}
                className={`flex-1 px-6 py-4 font-semibold text-sm transition-all ${
                  activeSourceTab === "MANUFACTURER"
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-b-2 border-purple-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Từ hãng ({availablePromotions?.manufacturerPromotions.length || 0})
              </button>
            </div>
          </div>
        )}

        {/* Filters - Only for List Tab */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Bộ lọc & Tìm kiếm</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Tìm kiếm
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập tên hoặc mô tả khuyến mãi..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-base text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={filterActive === undefined ? "all" : filterActive.toString()}
                    onChange={(e) =>
                      setFilterActive(
                        e.target.value === "all" ? undefined : e.target.value === "true"
                      )
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white text-base text-gray-900"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã tạm dừng</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-base text-gray-900"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-base text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={fetchPromotions}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Làm mới
                </button>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterActive(undefined);
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "statistics" && (
          <div className="space-y-6">
            {loadingStats ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải thống kê...</p>
              </div>
            ) : statistics ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">Tổng số</h3>
                    <p className="text-3xl font-bold">{statistics.totalPromotions}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">Đang hoạt động</h3>
                    <p className="text-3xl font-bold">{statistics.activePromotions}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">Đã hết hạn</h3>
                    <p className="text-3xl font-bold">{statistics.expiredPromotions}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">Giảm theo %</h3>
                    <p className="text-3xl font-bold">
                      {statistics.promotionsByType?.PERCENTAGE ?? 0}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không có dữ liệu thống kê</p>
                <p className="text-sm text-gray-500 mt-2">Hãy kiểm tra xem đại lý có khuyến mãi nào chưa, hoặc liên hệ admin.</p>
              </div>
            )}
          </div>
        )}

        {/* Promotions List */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Danh sách khuyến mãi ({promotions.length})
                {/* Source Badge */}
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  activeSourceTab === "DEALER" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-purple-100 text-purple-800"
                }`}>
                  {activeSourceTab === "DEALER" ? "Tự tạo" : "Từ hãng"}
                </span>
              </h3>
            </div>

            {promotions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Chưa có {activeSourceTab === "DEALER" ? "khuyến mãi tự tạo" : "mã khuyến mãi từ hãng"} nào.</p>
                {isManager && activeSourceTab === "DEALER" ? (
                  <button
                    onClick={openCreateModal}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold mx-auto shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo ngay
                  </button>
                ) : activeSourceTab === "MANUFACTURER" ? (
                  <p className="text-sm mt-2">Vui lòng liên hệ hãng để nhận mã khuyến mãi.</p>
                ) : (
                  <p className="text-sm mt-2">Vui lòng liên hệ quản lý đại lý để được hỗ trợ.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên khuyến mãi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại giảm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Xe áp dụng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      {isManager && activeSourceTab === "DEALER" && ( // Chỉ show cột Thao tác cho DEALER tab
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotions.map((promotion) => (
                      <tr key={promotion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{promotion.name}</p>
                            <p className="text-sm text-gray-500">{promotion.description || "Không có mô tả"}</p>
                            {/* Source & Editable Badge */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                promotion.source === "DEALER" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-purple-100 text-purple-800"
                              }`}>
                                {promotion.source === "DEALER" ? "Tự tạo" : "Từ hãng"}
                              </span>
                              {promotion.source === "MANUFACTURER" && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Lock className="w-3 h-3" />
                                  Không chỉnh sửa
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              promotion.discountType === "PERCENTAGE"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {promotion.discountType === "PERCENTAGE"
                              ? `${promotion.discountValue}%`
                              : formatVND(Number(promotion.discountValue))}
                          </span>
                          {promotion.minPurchase && (
                            <p className="text-xs text-gray-500 mt-1">
                              Min: {formatVND(Number(promotion.minPurchase))}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="text-gray-900">
                            {formatDate(promotion.startDate)}
                          </p>
                          <p className="text-gray-500">→ {formatDate(promotion.endDate)}</p>
                        </td>
                      <td className="px-6 py-4">
  {promotion.vehicleUnits && promotion.vehicleUnits.length > 0 ? (
    <div className="flex flex-wrap gap-1">
      {promotion.vehicleUnits.slice(0, 3).map((vu) => (
        <span key={vu.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {vu.vehicleUnit?.vehicle?.model || 'Unknown'} {vu.vehicleUnit?.vin?.slice(-6) || 'N/A'}
        </span>
      ))}
      {promotion.vehicleUnits.length > 3 && (
        <span className="text-xs text-gray-500">+{promotion.vehicleUnits.length - 3}</span>
      )}
    </div>
  ) : (
    <span className="text-xs text-gray-500">Tất cả xe</span>
  )}
</td>
                        <td className="px-6 py-4">
                          {canToggle ? (
                            <button
                              onClick={() => handleToggleStatus(promotion.id)}
                              className="flex items-center gap-1"
                            >
                              {promotion.isActive ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <ToggleRight className="w-4 h-4 mr-1" />
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                  <ToggleLeft className="w-4 h-4 mr-1" />
                                  Tạm dừng
                                </span>
                              )}
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                promotion.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {promotion.isActive ? "Hoạt động" : "Tạm dừng"}
                            </span>
                          )}
                        </td>
                        {isManager && activeSourceTab === "DEALER" && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(promotion)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(promotion)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal (chỉ show nếu manager và cho DEALER) */}
        {showModal && isManager && activeSourceTab === "DEALER" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform transition-all animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {editingPromotion
                          ? "Chỉnh sửa khuyến mãi"
                          : "Tạo khuyến mãi mới"}
                      </h3>
                      <p className="text-blue-100 text-sm mt-1">
                        {editingPromotion
                          ? "Cập nhật thông tin chương trình khuyến mãi"
                          : "Thêm chương trình khuyến mãi cho đại lý của bạn"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form
                onSubmit={editingPromotion ? handleUpdate : handleCreate}
                className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]"
              >
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Thông tin cơ bản</h4>
                  </div>

                  <div>
                    <label
                      htmlFor="promo-name"
                      className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                    >
                      Tên khuyến mãi <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="promo-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="VD: Giảm giá cuối năm, Ưu đãi mùa hè..."
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900 ${
                        formErrors.name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="promo-description"
                      className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                    >
                      Mô tả
                    </label>
                    <textarea
                      id="promo-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      placeholder="Nhập mô tả chi tiết về chương trình khuyến mãi..."
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 resize-none ${
                        formErrors.description ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {formErrors.description && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>
                    )}
                  </div>
                </div>

                {/* Discount Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Chi tiết giảm giá</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="promo-discount-type"
                        className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                      >
                        Loại giảm giá <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="promo-discount-type"
                        required
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value as "PERCENTAGE" | "FIXED",
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                      >
                        <option value="PERCENTAGE">Phần trăm (%)</option>
                        <option value="FIXED">Số tiền cố định (VND)</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="promo-discount-value"
                        className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                      >
                        Giá trị giảm <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="promo-discount-value"
                          type={formData.discountType === "FIXED" ? "text" : "number"}
                          required
                          min={0}
                          step={formData.discountType === "PERCENTAGE" ? 0.01 : undefined}
                          value={discountValueFormatted}
                          onChange={handleDiscountValueChange}
                          placeholder={formData.discountType === "PERCENTAGE" ? "VD: 10" : "VD: 1.000.000"}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          {formData.discountType === "PERCENTAGE" ? "%" : "₫"}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="promo-min-purchase"
                        className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                      >
                        Đơn hàng tối thiểu (VND)
                      </label>
                      <input
                        id="promo-min-purchase"
                        type="text"
                        value={formData.minPurchase}
                        onChange={(e) => {
                          const formatted = formatVNDInput(e.target.value);
                          setFormData({ ...formData, minPurchase: formatted });
                        }}
                        placeholder="VD: 100.000.000"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Giá trị đơn hàng tối thiểu để áp dụng khuyến mãi (định dạng VND, ví dụ: nhập 1000000 → 1.000.000)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Units Section - Mới thêm */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-blue-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Xe áp dụng</h4>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn xe cụ thể (tùy chọn)
                    </label>
                    <button
                      type="button"
                      onClick={openVehicleModal}
                      disabled={loadingVehicles}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        {formData.vehicleUnitIds.length > 0 
                          ? `${formData.vehicleUnitIds.length} xe được chọn` 
                          : "Áp dụng cho tất cả xe (chọn để giới hạn)"}
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Để khuyến mãi áp dụng cho tất cả xe, để trống. Chọn xe cụ thể để áp dụng riêng.
                    </p>
                  </div>
                </div>

                {/* Dealer & Period Section - Fixed dealer for dealer user */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Đại lý & Thời gian</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800">
                        Đại lý: {user?.dealer?.name || "Đại lý của bạn"}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Khuyến mãi chỉ áp dụng cho đại lý này.</p>
                    </div>

                    <div>
                      <label
                        htmlFor="promo-start-date"
                        className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                      >
                        Ngày bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="promo-start-date"
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="promo-end-date"
                        className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                      >
                        Ngày kết thúc <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="promo-end-date"
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-amber-600 to-orange-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Trạng thái</h4>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <input
                        id="promo-is-active"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="promo-is-active" className="cursor-pointer">
                        <span className="text-sm font-semibold text-gray-900 block">
                          Kích hoạt ngay
                        </span>
                        <span className="text-xs text-gray-600">
                          Khuyến mãi sẽ có hiệu lực ngay sau khi tạo
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    {editingPromotion ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vehicle Selection Modal */}
        {showVehicleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden transform transition-all animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Car className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Chọn xe áp dụng</h3>
                      <p className="text-blue-100 text-sm mt-1">Chọn các xe cụ thể để áp dụng khuyến mãi</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-200px)]">
                {/* Search */}
                <div>
                 <input
  type="text"
  value={vehicleSearchTerm}
  onChange={(e) => setVehicleSearchTerm(e.target.value)}
  placeholder="Tìm kiếm theo hãng, model, VIN, màu..."
  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-base text-gray-900 placeholder-gray-500"
/>
                </div>

                {/* List */}
                {loadingVehicles ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Đang tải danh sách xe...</p>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Không tìm thấy xe nào</p>
                  </div>
                ) : (
                 <div className="space-y-2 max-h-64 overflow-y-auto">
    {filteredVehicles.map((v) => (
      <label key={v.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={selectedVehicleUnits.includes(v.id)}
          onChange={() => toggleVehicleUnit(v.id)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {v.vehicle?.manufacturer?.name} {v.vehicle?.model} {v.vehicle?.variant}
          </p>
          <p className="text-sm text-gray-500 truncate">VIN: {v.vin}</p>
          <p className="text-xs text-gray-400">
            Màu: {v.color || "Không xác định"} | Trạng thái: {v.status}
          </p>
        </div>
      </label>
    ))}
  </div>
                )}

                {/* Summary */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Đã chọn: <span className="font-semibold text-blue-600">{selectedVehicleUnits.length}</span> xe
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmVehicleSelection}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal (chỉ show nếu manager và cho DEALER) */}
        {showDeleteModal && isManager && activeSourceTab === "DEALER" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Xác nhận xóa
                    </h3>
                    <p className="text-red-100 text-sm mt-1">
                      Hành động này không thể hoàn tác
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-gray-900 font-medium text-center">
                    Bạn có chắc chắn muốn xóa khuyến mãi &quot;{deletingPromotion?.name}&quot; không?
                  </p>
                  <p className="text-gray-600 text-sm text-center mt-2">
                    Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletingPromotion(null);
                      setDeletingPromotionId(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    Xóa ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}