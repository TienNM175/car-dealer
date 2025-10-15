"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  Tag,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { promotionApi } from "@/lib/api/promotionApi";
import { Promotion, PromotionStatistics } from "@/lib/types/promotion.types";
import { useAuth } from "@/contexts/AuthContext";

export default function PromotionsPage() {
  const { user } = useAuth(); // Lấy user từ context (dealerId, role)
  const dealerId = user?.dealerId;

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [statistics, setStatistics] = useState<PromotionStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchPromotions = async () => {
    if (!dealerId) {
      setError("Không tìm thấy thông tin đại lý. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        dealerId,
        isActive: filterActive,
        search: searchTerm,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      };

      const response = await promotionApi.getAll(params);
      const promotionsData = Array.isArray(response.data) ? response.data : [];
      setPromotions(promotionsData);
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
      const data = await promotionApi.getStatistics(dealerId);
      setStatistics(data);
    } catch (err: any) {
      console.error("Error fetching statistics:", err);
      setError("Không thể tải thống kê");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPromotions();
    }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterActive, startDate, endDate, sortBy, sortOrder, dealerId]);

  useEffect(() => {
    if (activeTab === "statistics") {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dealerId]);

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
                Xem các chương trình khuyến mãi đang áp dụng cho đại lý
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchPromotions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-md transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="Tên hoặc mô tả..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
                  >
                    <option value="all">Tất cả</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã tạm dừng</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Từ
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Đến
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
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
                    <h3 className="text-sm font-medium opacity-90">Phần trăm</h3>
                    <p className="text-3xl font-bold">{statistics.promotionsByType.PERCENTAGE}</p>
                  </div>
                </div>
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
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Danh sách khuyến mãi ({promotions.length})
              </h3>
            </div>

            {promotions.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Chưa có khuyến mãi nào được áp dụng cho đại lý của bạn.</p>
                <p className="text-sm mt-2">Vui lòng liên hệ EVM để được hỗ trợ.</p>
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
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {promotions.map((promotion) => (
                      <tr key={promotion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{promotion.name}</p>
                            <p className="text-sm text-gray-500">{promotion.description || "Không có mô tả"}</p>
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
                              : formatVND(promotion.discountValue)}
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
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              promotion.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {promotion.isActive ? "Hoạt động" : "Tạm dừng"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}