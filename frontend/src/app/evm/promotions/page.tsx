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
  LogIn,
  X,
  Car,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { promotionApi } from "@/lib/api/promotionApi";
import { vehicleUnitApi } from "@/lib/api/vehicleUnitApi";
import { Promotion, UpdatePromotionDTO } from "@/lib/types/promotion.types";

// Định nghĩa kiểu cho xe
interface VehicleUnit {
  id: string;
  vin: string;
  color?: string | null;  // ← THÊM DẤU ? → BÂY GIỜ LÀ OPTIONAL
  vehicle?: {
    model: string;
    manufacturer?: { name: string };
    variant?: string | null | undefined;
  } | null;
}

export default function PromotionsPage() {
  const router = useRouter();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [vehicles, setVehicles] = useState<VehicleUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [filterDealerId, setFilterDealerId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Tab state
  const [activeTab, setActiveTab] = useState<"list" | "statistics">("list");
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPromotionId, setDeletingPromotionId] = useState<string | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  // Vehicle selection modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
  const [selectedVehicleUnits, setSelectedVehicleUnits] = useState<string[]>([]);

  const [formData, setFormData] = useState<{
    dealerId: string;
    name: string;
    description: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    vehicleUnitIds: string[];
  }>({
    dealerId: "",
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

  // Format functions
  const formatVNDInput = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    return numbers ? Number(numbers).toLocaleString("vi-VN") : "";
  };

  const unformatVND = (value: string): number => {
    return Number(value.replace(/\./g, "")) || 0;
  };

  const formatVND = (v: number) =>
    v.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "N/A";
    const dateString = typeof dateValue === "string" ? dateValue : dateValue.toISOString();
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return "bg-yellow-500";
    if (index === 1) return "bg-gray-400";
    if (index === 2) return "bg-orange-500";
    return "bg-blue-500";
  };

  // Get unique dealers
  const dealers = useMemo(() => {
    const uniqueDealers = new Map<string, { id: string; name: string }>();
    promotions.forEach((p) => {
      if (p.dealer && !uniqueDealers.has(p.dealerId)) {
        uniqueDealers.set(p.dealerId, { id: p.dealerId, name: p.dealer.name });
      }
    });
    return Array.from(uniqueDealers.values());
  }, [promotions]);

  // Filtered vehicles for modal
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

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filterActive !== undefined) params.isActive = filterActive;
      if (searchTerm) params.search = searchTerm;
      if (filterDealerId) params.dealerId = filterDealerId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const response = await promotionApi.getAll(params);
      const promotionsData = Array.isArray(response.data) ? response.data : [];
      setPromotions(promotionsData);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Bạn cần đăng nhập để quản lý khuyến mãi. Vui lòng đăng nhập lại.");
      } else {
        setError(err.response?.data?.message || "Không thể tải dữ liệu");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch vehicles when dealer selected
  const fetchVehicles = async () => {
    if (!formData.dealerId) return;
    try {
      setLoadingVehicles(true);
      const response = await vehicleUnitApi.list({
        dealerId: formData.dealerId,
        status: "IN_STOCK",
        limit: 200,
      });
      setVehicles(response.data.data || []);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Không thể tải danh sách xe");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const data = await promotionApi.getStatistics();
      setStatistics(data);
    } catch (err: any) {
      console.error("Error fetching statistics:", err);
      setError("Không thể tải thống kê");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchPromotions(), 500);
    return () => clearTimeout(timeoutId);
  }, [filterActive, searchTerm, filterDealerId, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    if (activeTab === "statistics") fetchStatistics();
  }, [activeTab]);

  useEffect(() => {
    if (showModal && formData.dealerId) fetchVehicles();
  }, [showModal, formData.dealerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const submitData = {
        ...formData,
        minPurchase: unformatVND(formData.minPurchase),
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
    if (!editingPromotion) return;

    try {
      setError(null);
      const updateData: UpdatePromotionDTO = {
        ...formData,
        minPurchase: unformatVND(formData.minPurchase),
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

  const openDeleteModal = (id: string) => {
    setDeletingPromotionId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingPromotionId) return;
    try {
      setError(null);
      await promotionApi.delete(deletingPromotionId);
      setSuccess("Xóa thành công!");
      setShowDeleteModal(false);
      setDeletingPromotionId(null);
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setError(null);
      await promotionApi.toggleStatus(id);
      setSuccess("Cập nhật trạng thái!");
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingPromotion(null);
    setShowModal(true);
  };

  // ==== THAY ĐỔI ĐOẠN NÀY (khoảng dòng 280‑300) ====
const openEditModal = (promotion: Promotion) => {
  // Hàm tiện ích: luôn trả về string ISO (hoặc "")
  const toIsoString = (d: string | Date | null | undefined): string => {
    if (!d) return "";
    return typeof d === "string" ? d : d.toISOString();
  };

  const startDateStr = toIsoString(promotion.startDate).split("T")[0];
  const endDateStr   = toIsoString(promotion.endDate).split("T")[0];

  setEditingPromotion(promotion);
  setFormData({
    dealerId: promotion.dealerId,
    name: promotion.name,
    description: promotion.description || "",
    discountType: promotion.discountType,
    discountValue: Number(promotion.discountValue),
    minPurchase: promotion.minPurchase
      ? Number(promotion.minPurchase).toLocaleString("vi-VN")
      : "",
    startDate: startDateStr,
    endDate: endDateStr,
    isActive: promotion.isActive,
    vehicleUnitIds:
      promotion.vehicleUnits?.map(vu => vu.vehicleUnit?.id || "").filter(Boolean) || [],
  });
  setSelectedVehicleUnits(
    promotion.vehicleUnits?.map(vu => vu.vehicleUnit?.id || "").filter(Boolean) || []
  );
  setShowModal(true);
};

  const resetForm = () => {
    setFormData({
      dealerId: "",
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
    setEditingPromotion(null);
  };

  const toggleVehicleUnit = (id: string) => {
    setSelectedVehicleUnits(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const confirmVehicleSelection = () => {
    setFormData({ ...formData, vehicleUnitIds: selectedVehicleUnits });
    setShowVehicleModal(false);
  };

  if (loading && promotions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Quản lý Khuyến mãi</h2>
              <p className="text-sm text-gray-500">Tạo và quản lý các chương trình khuyến mãi</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Tạo khuyến mãi mới
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
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
              Danh sách khuyến mãi
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

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">{error}</p>
              </div>
              {error.includes("đăng nhập") && (
                <button
                  onClick={() => router.push("/login")}
                  className="ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Bộ lọc & Tìm kiếm</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1.5 text-blue-600" />
                  Tìm kiếm nhanh
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nhập tên hoặc mô tả..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đại lý
                  </label>
                  <select
                    value={filterDealerId}
                    onChange={(e) => setFilterDealerId(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                  >
                    <option value="">Tất cả đại lý</option>
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={filterActive === undefined ? "all" : filterActive.toString()}
                    onChange={(e) =>
                      setFilterActive(e.target.value === "all" ? undefined : e.target.value === "true")
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                  >
                    <option value="all">Tất cả</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã tạm dừng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sắp xếp theo
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                    >
                      <option value="">Mặc định</option>
                      <option value="name">Tên</option>
                      <option value="startDate">Ngày bắt đầu</option>
                      <option value="endDate">Ngày kết thúc</option>
                      <option value="discountValue">Giá trị giảm</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className={`w-14 h-11 border-2 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                        sortOrder === "asc"
                          ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      {sortOrder === "asc" ? "Up" : "Down"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 sm:w-auto w-full">
                  <button
                    onClick={fetchPromotions}
                    className="flex-1 sm:w-auto sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Làm mới</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterDealerId("");
                      setFilterActive(undefined);
                      setStartDate("");
                      setEndDate("");
                      setSortBy("");
                      setSortOrder("asc");
                    }}
                    className="flex-1 sm:w-auto sm:px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Xóa lọc</span>
                  </button>
                </div>
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
                    <p className="text-3xl font-bold">{statistics.total || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Khuyến mãi</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">Đang hoạt động</h3>
                    <p className="text-3xl font-bold">{statistics.active || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Chương trình</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">Sắp hết hạn</h3>
                    <p className="text-3xl font-bold">
                      {Array.isArray(statistics.expiringSoon) ? statistics.expiringSoon.length : 0}
                    </p>
                    <p className="text-xs opacity-75 mt-1">Trong 7 ngày</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-sm font-medium opacity-90">Đã hết hạn</h3>
                    <p className="text-3xl font-bold">{statistics.expired || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Chương trình</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Phân loại giảm giá</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-purple-700">Phần trăm (%)</p>
                      <p className="text-2xl font-bold text-purple-900 mt-1">
                        {statistics.byType?.PERCENTAGE?.count || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-green-700">Số tiền cố định</p>
                      <p className="text-2xl font-bold text-green-900 mt-1">
                        {statistics.byType?.FIXED?.count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {statistics.topDealers && statistics.topDealers.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top đại lý</h3>
                    <div className="space-y-3">
                      {statistics.topDealers.slice(0, 5).map((dealer: any, index: number) => (
                        <div key={dealer.dealerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${getRankBadgeColor(index)}`}>
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-900">{dealer.dealerName || "N/A"}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{dealer.count} khuyến mãi</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không có dữ liệu thống kê</p>
              </div>
            )}
          </div>
        )}

        {/* Promotions List */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Danh sách khuyến mãi ({promotions.length})
              </h3>
            </div>

            {promotions.length === 0 ? (
              <div className="px-6 pb-6 text-center text-gray-500 py-8">
                Không có khuyến mãi nào
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên & Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại & Giá trị
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotions.map((promotion) => (
                      <tr key={promotion.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{promotion.name}</p>
                          <p className="text-sm text-gray-500">{promotion.description || ""}</p>
                          {promotion.dealer && (
                            <p className="text-xs text-blue-600 mt-1">Đại lý: {promotion.dealer.name}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              promotion.discountType === "PERCENTAGE"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {promotion.discountType}
                          </span>
                          <p className="text-sm font-bold text-gray-900 mt-1">
                            {promotion.discountType === "PERCENTAGE"
                              ? `${promotion.discountValue}%`
                              : formatVND(Number(promotion.discountValue))}
                          </p>
                          {promotion.minPurchase && (
                            <p className="text-xs text-gray-500 mt-1">
                              Min: {formatVND(Number(promotion.minPurchase))}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="text-gray-900">{formatDate(promotion.startDate)}</p>
                          <p className="text-gray-500">→ {formatDate(promotion.endDate)}</p>
                        </td>
                        <td className="px-6 py-4">
                          {promotion.vehicleUnits && promotion.vehicleUnits.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {promotion.vehicleUnits.slice(0, 3).map((vu) => (
                                <span key={vu.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {vu.vehicleUnit?.vehicle?.model} {vu.vehicleUnit?.vin?.slice(-6)}
                                </span>
                              ))}
                              {promotion.vehicleUnits.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{promotion.vehicleUnits.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Tất cả xe</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleToggleStatus(promotion.id)}>
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
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(promotion)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(promotion.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Tag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {editingPromotion ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={editingPromotion ? handleUpdate : handleCreate} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Thông tin cơ bản */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Thông tin cơ bản</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên khuyến mãi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Giảm giá cuối năm..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Nhập mô tả chi tiết..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 resize-none"
                    />
                  </div>
                </div>

                {/* Chi tiết giảm giá */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Chi tiết giảm giá</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại giảm giá <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "PERCENTAGE" | "FIXED" })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                      >
                        <option value="PERCENTAGE">Phần trăm (%)</option>
                        <option value="FIXED">Số tiền cố định (VND)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá trị giảm <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={0}
                          step={formData.discountType === "PERCENTAGE" ? 0.01 : 1000}
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                          placeholder={formData.discountType === "PERCENTAGE" ? "10" : "5000000"}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          {formData.discountType === "PERCENTAGE" ? "%" : "₫"}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đơn hàng tối thiểu (VND)
                      </label>
                      <input
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
                        Nhập số → tự động định dạng (1000000 → 1.000.000)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Đại lý & Thời gian */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Đại lý & Thời gian</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn đại lý <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.dealerId}
                        onChange={(e) => setFormData({ ...formData, dealerId: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                      >
                        <option value="">-- Chọn đại lý --</option>
                        {dealers.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày kết thúc <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Xe áp dụng */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-blue-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Xe áp dụng</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVehicleModal(true)}
                    disabled={!formData.dealerId || loadingVehicles}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-gray-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-between disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      {formData.vehicleUnitIds.length > 0
                        ? `${formData.vehicleUnitIds.length} xe được chọn`
                        : "Áp dụng cho tất cả xe"}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Trạng thái */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-1 h-5 bg-gradient-to-b from-amber-600 to-orange-600 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900">Trạng thái</h4>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                      />
                      <label className="cursor-pointer">
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

                {/* Nút hành động */}
                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
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
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Chọn xe áp dụng</h3>
          <button onClick={() => setShowVehicleModal(false)} className="text-white hover:text-gray-200 transition">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-200px)]">
        <input
          type="text"
          value={vehicleSearchTerm}
          onChange={(e) => setVehicleSearchTerm(e.target.value)}
          placeholder="Tìm theo model hoặc VIN..."
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
        />
        {loadingVehicles ? (
          <p className="text-center py-8 text-gray-700 font-semibold">Đang tải xe...</p>
        ) : filteredVehicles.length === 0 ? (
          <p className="text-center py-8 text-gray-600 font-medium">Không tìm thấy xe nào</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredVehicles.map((v) => (
              <label key={v.id} className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={selectedVehicleUnits.includes(v.id)}
                  onChange={() => toggleVehicleUnit(v.id)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-400 focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">
                    {v.vehicle?.manufacturer?.name} {v.vehicle?.model} {v.vehicle?.variant}
                  </p>
                  <p className="text-sm font-medium text-gray-600 mt-0.5">
                    VIN: <span className="font-mono">{v.vin}</span> | Màu: {v.color}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="pt-4 border-t border-gray-300">
          <p className="text-sm font-bold text-gray-900">
            Đã chọn: <span className="text-blue-600">{selectedVehicleUnits.length}</span> xe
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => setShowVehicleModal(false)}
          className="px-6 py-2.5 border border-gray-400 rounded-lg text-gray-800 font-semibold hover:bg-gray-100 transition"
        >
          Hủy
        </button>
        <button
          onClick={confirmVehicleSelection}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
        >
          Xác nhận
        </button>
      </div>
    </div>
  </div>
)}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Xác nhận xóa</h3>
                    <p className="text-red-100 text-sm mt-1">Hành động này không thể hoàn tác</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-gray-900 font-medium text-center">
                    Bạn có chắc chắn muốn xóa khuyến mãi này không?
                  </p>
                  <p className="text-gray-600 text-sm text-center mt-2">
                    Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteModal(false); setDeletingPromotionId(null); }}
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