"use client";
import React, { useState, useEffect } from "react";
import {
  Download,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
  Filter,
  Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import inventoryApi, { DealerInventory } from "@/lib/api/inventoryApi";
import { vehicleUnitApi, VehicleUnitSummary } from "@/lib/api/vehicleUnitApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DealerInventoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dealerInventory, setDealerInventory] = useState<DealerInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DealerInventory | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [vehicleUnits, setVehicleUnits] = useState<VehicleUnitSummary[]>([]);
  const [vehicleUnitsLoading, setVehicleUnitsLoading] = useState(false);
  const [vehicleUnitsError, setVehicleUnitsError] = useState<string | null>(
    null
  );
  const [vinFilter, setVinFilter] = useState<"ALL" | "IN_STOCK" | "RESERVED" | "DELIVERED">("ALL");
  const statusLabelMap: Record<string, string> = {
    IN_STOCK: "Sẵn kho",
    RESERVED: "Đã giữ chỗ",
    DELIVERED: "Đã giao",
    IN_TRANSIT: "Đang vận chuyển",
    RETURNED: "Đã trả",
    DAMAGED: "Hư hỏng",
  };

  const formatDateTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString("vi-VN") : "-";


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search và filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterTotal, setFilterTotal] = useState("");
  const [filterReserved, setFilterReserved] = useState("");
  const [filterSold, setFilterSold] = useState("");
  const [filterAvailable, setFilterAvailable] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || !user.dealerId)) {
      toast.error("Bạn không có quyền truy cập trang này.");
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.dealerId) return;
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1);

        const response = await inventoryApi.getDealerInventory(user.dealerId);
        setDealerInventory(response.data.data);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu tồn kho. Vui lòng thử lại.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.dealerId) fetchData();
  }, [user?.dealerId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterTotal,
    filterReserved,
    filterSold,
    filterAvailable,
    filterStatus,
  ]);

  // Filter data
  const filteredData = dealerInventory.filter((item) => {
    const matchesSearch = item.vehicle.model
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const totalFilter = parseInt(filterTotal) || NaN;
    const matchesTotal = !isNaN(totalFilter)
      ? item.quantity === totalFilter
      : true;

    const reservedFilter = parseInt(filterReserved) || NaN;
    const matchesReserved = !isNaN(reservedFilter)
      ? item.reserved === reservedFilter
      : true;

    const soldFilter = parseInt(filterSold) || NaN;
    const matchesSold = !isNaN(soldFilter) ? item.sold === soldFilter : true;

    const availableFilter = parseInt(filterAvailable) || NaN;
    const matchesAvailable = !isNaN(availableFilter)
      ? item.available === availableFilter
      : true;

    let itemStatus = "";
    if (item.available < 5) itemStatus = "low";
    else if (item.available <= 20) itemStatus = "normal";
    else itemStatus = "high";
    const matchesStatus = !filterStatus || itemStatus === filterStatus;

    return (
      matchesSearch &&
      matchesTotal &&
      matchesReserved &&
      matchesSold &&
      matchesAvailable &&
      matchesStatus
    );
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Stats
  const totalStock = dealerInventory.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalReserved = dealerInventory.reduce(
    (sum, item) => sum + item.reserved,
    0
  );
  const totalSold = dealerInventory.reduce((sum, item) => sum + item.sold, 0);
  const totalAvailable = dealerInventory.reduce(
    (sum, item) => sum + item.available,
    0
  );
  const lowStockCount = dealerInventory.filter(
    (item) => item.available < 5
  ).length;

  // Clear filters
  const clearFilters = () => {
    setFilterTotal("");
    setFilterReserved("");
    setFilterSold("");
    setFilterAvailable("");
    setFilterStatus("");
  };
  const loadVehicleUnits = async (vehicleId: string) => {
    try {
      setVehicleUnitsLoading(true);
      setVehicleUnitsError(null);
      const response = await vehicleUnitApi.list({
        vehicleId,
        dealerId: user?.dealerId,
        limit: 200,
        sortBy: "importedAt",
        sortOrder: "asc",
      });
      const payload = response.data?.data ?? response.data;
      setVehicleUnits(Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      console.error("❌ Error loading dealer VINs:", error);
      setVehicleUnits([]);
      setVehicleUnitsError(
        error?.response?.data?.message || "Không thể tải danh sách VIN."
      );
    } finally {
      setVehicleUnitsLoading(false);
    }
  };

  const handleViewDetail = async (vehicleId: string) => {
    try {
      const response = await inventoryApi.getDealerInventoryItem(
        user!.dealerId!,
        vehicleId
      );
      setSelectedItem(response.data.data);
      setVinFilter("ALL");
      await loadVehicleUnits(vehicleId);
      setShowDetailModal(true);
    } catch (err) {
      toast.error("Lỗi khi tải chi tiết.");
    }
  };

  // Export CSV
  const handleExportReport = () => {
    if (user?.role !== "DEALER_MANAGER") {
      toast.error("Bạn không có quyền xuất báo cáo. Vui lòng liên hệ quản lý.");
      return;
    }

    const csvContent = [
      ["Model", "Tổng", "Reserved", "Sold", "Khả dụng", "Vị trí"],
      ...dealerInventory.map((item) => [
        item.vehicle.model,
        item.quantity,
        item.reserved,
        item.sold,
        item.available,
        item.location || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dealer_inventory_report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Xuất báo cáo thành công!");
  };

  if (authLoading || loading)
    return <div className="text-center py-8">Đang tải...</div>;
  if (error)
    return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Quản lý tồn kho - {user?.dealer?.name || "Đại lý"}
        </h2>
        {user?.role === "DEALER_MANAGER" && (
          <button
            onClick={handleExportReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Tổng tồn kho</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalStock.toLocaleString()} xe
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Đã bán</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {totalSold.toLocaleString()} xe
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            </div>
          </div>
          <p className="text-gray-600 text-sm">Khả dụng</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">
            {totalAvailable.toLocaleString()} xe
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Cảnh báo thấp</p>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {lowStockCount} model
          </p>
        </div>
      </div>

      {/* Search và Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
            {showFilters && <span className="text-xs text-red-500">▲</span>}
            {!showFilters && <span className="text-xs text-red-500">▼</span>}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng tồn kho
                </label>
                <input
                  type="number"
                  placeholder="Nhập số lượng"
                  value={filterTotal}
                  onChange={(e) => setFilterTotal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  min="0"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sold
                </label>
                <input
                  type="number"
                  placeholder="Nhập số lượng"
                  value={filterSold}
                  onChange={(e) => setFilterSold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khả dụng
                </label>
                <input
                  type="number"
                  placeholder="Nhập số lượng"
                  value={filterAvailable}
                  onChange={(e) => setFilterAvailable(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Tất cả</option>
                  <option value="low">Thấp</option>
                  <option value="normal">Bình thường</option>
                  <option value="high">Cao</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md p-6 text-black">
        <h3 className="font-semibold text-lg mb-4">Danh sách tồn kho</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tổng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Khả dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-black">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-semibold">{item.vehicle.model}</span>
                  </td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4">{item.sold}</td>
                  <td className="px-6 py-4 text-green-600 font-semibold">
                    {item.available}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetail(item.vehicleId)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4">
            <p className="text-sm text-gray-700">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)} của{" "}
              {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-lg border ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal - Fixed Header, Scrollable Content */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800">
                  VIN tại đại lý - {selectedItem.vehicle.model}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Theo dõi chi tiết các VIN thuộc kho {user?.dealer?.name}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 border-b border-gray-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Tổng VIN
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {selectedItem.quantity.toLocaleString()}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                  <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">
                    Đang giữ chỗ
                  </p>
                  <p className="text-2xl font-bold text-yellow-800 mt-2">
                    {selectedItem.reserved.toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    Đã bán
                  </p>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {selectedItem.sold.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                    Khả dụng
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {selectedItem.available.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 bg-white flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-600">
                Lọc VIN theo trạng thái:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "ALL", label: `Tất cả (${vehicleUnits.length})` },
                  {
                    key: "IN_STOCK",
                    label: `Sẵn kho (${vehicleUnits.filter(
                      (unit) => unit.status === "IN_STOCK"
                    ).length})`,
                  },
                  {
                    key: "RESERVED",
                    label: `Đã giữ chỗ (${vehicleUnits.filter(
                      (unit) => unit.status === "RESERVED"
                    ).length})`,
                  },
                  {
                    key: "DELIVERED",
                    label: `Đã giao (${vehicleUnits.filter(
                      (unit) => unit.status === "DELIVERED"
                    ).length})`,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() =>
                      setVinFilter(item.key as typeof vinFilter)
                    }
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      vinFilter === item.key
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
              {vehicleUnitsLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang tải danh sách VIN...
                </div>
              ) : vehicleUnitsError ? (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg">
                  {vehicleUnitsError}
                </div>
              ) : vehicleUnits.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl py-12 text-center text-gray-500">
                  Chưa có VIN nào thuộc đại lý này.
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VIN
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cập nhật
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                      {vehicleUnits
                        .filter((unit) => {
                          if (vinFilter === "ALL") return true;
                          return unit.status === vinFilter;
                        })
                        .map((unit) => (
                          <tr key={unit.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              {unit.vin}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {statusLabelMap[unit.status] || unit.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {formatDateTime(unit.updatedAt || unit.createdAt)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}