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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { promotionApi } from "@/lib/api/promotionApi";
import { Promotion, UpdatePromotionDTO } from "@/lib/types/promotion.types";

export default function PromotionsPage() {
  const router = useRouter();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );
  const [formData, setFormData] = useState<{
    dealerId: string;
    name: string;
    description: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minPurchase: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>({
    dealerId: "",
    name: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minPurchase: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    isActive: true,
  });

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
      // Ensure we get an array from the response
      const promotionsData = Array.isArray(response.data) ? response.data : [];
      setPromotions(promotionsData);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(
          "Bạn cần đăng nhập để quản lý khuyến mãi. Vui lòng đăng nhập lại."
        );
      } else {
        setError(err.response?.data?.message || "Failed to fetch promotions");
      }
      console.error("Error fetching promotions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchPromotions();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive, searchTerm, filterDealerId, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    if (activeTab === "statistics") {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchStatistics = async () => {
    try {
      setLoadingStats(true);
      const data = await promotionApi.getStatistics();
      setStatistics(data);
    } catch (err: any) {
      console.error("Error fetching statistics:", err);
      setError("Failed to load statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await promotionApi.create(formData);
      setSuccess("Promotion created successfully!");
      setShowModal(false);
      resetForm();
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create promotion");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;

    try {
      setError(null);
      const updateData: UpdatePromotionDTO = { ...formData };
      await promotionApi.update(editingPromotion.id, updateData);
      setSuccess("Promotion updated successfully!");
      setShowModal(false);
      resetForm();
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update promotion");
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
      setSuccess("Khuyến mãi đã được xóa thành công!");
      setShowDeleteModal(false);
      setDeletingPromotionId(null);
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete promotion");
      setShowDeleteModal(false);
      setDeletingPromotionId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setError(null);
      await promotionApi.toggleStatus(id);
      setSuccess("Promotion status updated!");
      fetchPromotions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingPromotion(null);
    setShowModal(true);
  };

  const openEditModal = (promotion: Promotion) => {
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

    setEditingPromotion(promotion);
    setFormData({
      dealerId: promotion.dealerId,
      name: promotion.name,
      description: promotion.description || "",
      discountType: promotion.discountType,
      discountValue: Number(promotion.discountValue),
      minPurchase: Number(promotion.minPurchase) || 0,
      startDate: startDateStr,
      endDate: endDateStr,
      isActive: promotion.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      dealerId: "",
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minPurchase: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      isActive: true,
    });
    setEditingPromotion(null);
  };

  const formatVND = (v: number) =>
    v.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "N/A";
    const dateString =
      typeof dateValue === "string" ? dateValue : dateValue.toISOString();
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return "bg-yellow-500";
    if (index === 1) return "bg-gray-400";
    if (index === 2) return "bg-orange-500";
    return "bg-blue-500";
  };

  // Get unique dealers from promotions
  const dealers = useMemo(() => {
    const uniqueDealers = new Map<string, { id: string; name: string }>();
    promotions.forEach((p) => {
      if (p.dealer && !uniqueDealers.has(p.dealerId)) {
        uniqueDealers.set(p.dealerId, { id: p.dealerId, name: p.dealer.name });
      }
    });
    return Array.from(uniqueDealers.values());
  }, [promotions]);

  // Use promotions directly (filtering is done server-side)
  const filteredPromotions = promotions;

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
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                Quản lý Khuyến mãi
              </h2>
              <p className="text-sm text-gray-500">
                Tạo và quản lý các chương trình khuyến mãi
              </p>
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
              📊 Thống kê
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
            {/* Main Search */}
            <div className="mb-6">
              <label htmlFor="search-input" className="block text-sm font-semibold text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1.5 text-blue-600" />
                Tìm kiếm nhanh
              </label>
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập tên hoặc mô tả khuyến mãi..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Dealer Filter */}
              <div>
                <label htmlFor="dealer-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Filter className="w-3.5 h-3.5 inline mr-1 text-purple-600" />
                  Đại lý
                </label>
                <select
                  id="dealer-filter"
                  value={filterDealerId}
                  onChange={(e) => setFilterDealerId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                >
                  <option value="">🏢 Tất cả đại lý</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  <ToggleRight className="w-3.5 h-3.5 inline mr-1 text-green-600" />
                  Trạng thái
                </label>
                <select
                  id="status-filter"
                  value={
                    filterActive === undefined ? "all" : filterActive.toString()
                  }
                  onChange={(e) =>
                    setFilterActive(
                      e.target.value === "all"
                        ? undefined
                        : e.target.value === "true"
                    )
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                >
                  <option value="all">📋 Tất cả</option>
                  <option value="true">✅ Đang hoạt động</option>
                  <option value="false">⏸️ Đã tạm dừng</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="start-date" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                  Từ ngày
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                />
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="end-date" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                  Đến ngày
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900"
                />
              </div>
            </div>

            {/* Sort & Actions Row */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
              {/* Sort Controls */}
              <div className="flex-1">
                <label htmlFor="sort-by" className="block text-sm font-semibold text-gray-700 mb-2">
                  🔄 Sắp xếp theo
                </label>
                <div className="flex gap-2">
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                  >
                    <option value="">Mặc định</option>
                    <option value="name">📝 Tên</option>
                    <option value="startDate">📅 Ngày bắt đầu</option>
                    <option value="endDate">📅 Ngày kết thúc</option>
                    <option value="discountValue">💰 Giá trị giảm</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className={`w-14 h-11 border-2 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                      sortOrder === "asc" 
                        ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" 
                        : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                    title={sortOrder === "asc" ? "Tăng dần (A→Z)" : "Giảm dần (Z→A)"}
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:w-auto w-full">
                <button
                  onClick={fetchPromotions}
                  className="flex-1 sm:w-auto sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
                <button
                  type="button"
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
                  title="Xóa tất cả bộ lọc"
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
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Tổng số</h3>
                      <Tag className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold">{statistics.total || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Khuyến mãi</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Đang hoạt động</h3>
                      <ToggleRight className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold">{statistics.active || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Chương trình</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Sắp hết hạn</h3>
                      <AlertCircle className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold">
                      {Array.isArray(statistics.expiringSoon) ? statistics.expiringSoon.length : 0}
                    </p>
                    <p className="text-xs opacity-75 mt-1">Trong 7 ngày</p>
                  </div>

                  <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium opacity-90">Đã hết hạn</h3>
                      <ToggleLeft className="w-5 h-5 opacity-75" />
                    </div>
                    <p className="text-3xl font-bold">{statistics.expired || 0}</p>
                    <p className="text-xs opacity-75 mt-1">Chương trình</p>
                  </div>
                </div>

                {/* Discount Type Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    📊 Phân loại giảm giá
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-700">Phần trăm (%)</p>
                          <p className="text-2xl font-bold text-purple-900 mt-1">
                            {statistics.byType?.PERCENTAGE?.count || 0}
                          </p>
                        </div>
                        <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📊</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700">Số tiền cố định</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {statistics.byType?.FIXED?.count || 0}
                          </p>
                        </div>
                        <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                          <span className="text-2xl">💰</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Dealers */}
                {statistics.topDealers && statistics.topDealers.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      🏆 Top đại lý có nhiều khuyến mãi
                    </h3>
                    <div className="space-y-3">
                      {statistics.topDealers.slice(0, 5).map((dealer: any, index: number) => (
                        <div
                          key={dealer.dealerId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${getRankBadgeColor(index)}`}
                            >
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-900">
                              {dealer.dealerName || "N/A"}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-blue-600">
                            {dealer.count} khuyến mãi
                          </span>
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
              Danh sách khuyến mãi ({filteredPromotions.length})
            </h3>
          </div>

          {filteredPromotions.length === 0 ? (
            <div className="px-6 pb-6">
              <p className="text-center text-gray-500 py-8">
                Không có khuyến mãi nào
              </p>
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
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPromotions.map((promotion) => (
                    <tr
                      key={promotion.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {promotion.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {promotion.description || ''}
                          </p>
                          {promotion.dealer && (
                            <p className="text-xs text-blue-600 mt-1">
                              Đại lý: {promotion.dealer?.name || 'N/A'}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
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
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(promotion.startDate)}
                          </p>
                          <p className="text-gray-500">
                            đến {formatDate(promotion.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
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
                            onClick={() => openDeleteModal(promotion.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        : "Thêm chương trình khuyến mãi cho đại lý"}
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                  />
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 resize-none"
                  />
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
                      <option value="PERCENTAGE">📊 Phần trăm (%)</option>
                      <option value="FIXED">💰 Số tiền cố định (VND)</option>
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
                        type="number"
                        required
                        min={0}
                        step={formData.discountType === "PERCENTAGE" ? 0.01 : 1000}
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountValue: Number(e.target.value),
                          })
                        }
                        placeholder={formData.discountType === "PERCENTAGE" ? "VD: 10" : "VD: 5000000"}
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
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.minPurchase}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minPurchase: Number(e.target.value),
                        })
                      }
                      placeholder="VD: 100000000 (Để trống nếu không yêu cầu)"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Giá trị đơn hàng tối thiểu để áp dụng khuyến mãi này
                    </p>
                  </div>
                </div>
              </div>

              {/* Dealer & Period Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="w-1 h-5 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                  <h4 className="font-semibold text-gray-900">Đại lý & Thời gian</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="promo-dealer-id"
                      className="block text-sm font-medium text-gray-700 subpixel-antialiased mb-2"
                    >
                      Chọn đại lý <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="promo-dealer-id"
                      name="promo-dealer-id"
                      required
                      value={formData.dealerId}
                      onChange={(e) =>
                        setFormData({ ...formData, dealerId: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-900 bg-white"
                    >
                      <option value="">-- Chọn đại lý --</option>
                      {dealers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
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
                    <label
                      htmlFor="promo-is-active"
                      className="cursor-pointer"
                    >
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
                  {editingPromotion ? "💾 Cập nhật" : "✨ Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                  Bạn có chắc chắn muốn xóa khuyến mãi này không?
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
                  🗑️ Xóa ngay
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
