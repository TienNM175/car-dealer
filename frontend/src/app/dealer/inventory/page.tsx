"use client";
import React, { useState, useEffect } from "react";
import {
  Download,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  ShoppingCart,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
  Filter,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import inventoryApi, {
  UpdateDealerInventoryInput,
  ReserveInventoryInput,
  CompleteSaleInput,
  CancelReservationInput,
  DealerInventory,
} from "@/lib/api/inventoryApi";
import { useAuth } from "@/contexts/AuthContext"; // Adjust path nếu cần
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showCompleteSaleModal, setShowCompleteSaleModal] = useState(false);
  const [showCancelReserveModal, setShowCancelReserveModal] = useState(false);

  const [editForm, setEditForm] = useState<UpdateDealerInventoryInput>({});
  const [reserveForm, setReserveForm] = useState<ReserveInventoryInput>({
    quantity: 0,
  });
  const [saleForm, setSaleForm] = useState<CompleteSaleInput>({ quantity: 0 });
  const [cancelForm, setCancelForm] = useState<CancelReservationInput>({
    quantity: 0,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Thêm states cho search và filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterTotal, setFilterTotal] = useState(""); // Exact number for Tổng
  const [filterReserved, setFilterReserved] = useState(""); // Exact number for Reserved
  const [filterSold, setFilterSold] = useState(""); // Exact number for Sold
  const [filterAvailable, setFilterAvailable] = useState(""); // Exact number for Khả dụng
  const [filterStatus, setFilterStatus] = useState(""); // '', 'low', 'normal', 'high'

  // Kiểm tra auth và role (staff/manager đều được xem, nhưng có thể giới hạn export cho staff)
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

        // API 1: getDealerInventory
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

  // Reset page to 1 when filters or search change
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

  // Pagination logic
  // Lọc dữ liệu dựa trên search và filters
  const filteredData = dealerInventory.filter((item) => {
    // Search theo model
    const matchesSearch = item.vehicle.model
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filter theo Tổng (exact)
    const totalFilter = parseInt(filterTotal) || NaN;
    const matchesTotal = !isNaN(totalFilter)
      ? item.quantity === totalFilter
      : true;

    // Filter theo Reserved (exact)
    const reservedFilter = parseInt(filterReserved) || NaN;
    const matchesReserved = !isNaN(reservedFilter)
      ? item.reserved === reservedFilter
      : true;

    // Filter theo Sold (exact)
    const soldFilter = parseInt(filterSold) || NaN;
    const matchesSold = !isNaN(soldFilter) ? item.sold === soldFilter : true;

    // Filter theo Khả dụng (exact)
    const availableFilter = parseInt(filterAvailable) || NaN;
    const matchesAvailable = !isNaN(availableFilter)
      ? item.available === availableFilter
      : true;

    // Filter theo trạng thái (dựa trên available: low <5, normal 5-20, high >20)
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

  // Thống kê (dựa trên filtered data? No, keep original for stats)
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

  // Xóa bộ lọc
  const clearFilters = () => {
    setFilterTotal("");
    setFilterReserved("");
    setFilterSold("");
    setFilterAvailable("");
    setFilterStatus("");
  };

  // Xem chi tiết (API 2: getDealerInventoryItem)
  const handleViewDetail = async (vehicleId: string) => {
    try {
      const response = await inventoryApi.getDealerInventoryItem(
        user!.dealerId!,
        vehicleId
      );
      setSelectedItem(response.data.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error("Lỗi khi tải chi tiết.");
    }
  };

  // Mở edit modal
  const handleEdit = (item: DealerInventory) => {
    setSelectedItem(item);
    setEditForm({
      quantity: item.quantity,
      reserved: item.reserved,
      sold: item.sold,
      location: item.location,
    });
    setShowEditModal(true);
  };

  // Cập nhật tồn kho (API 3: updateDealerInventory)
  const handleUpdateInventory = async () => {
    if (!selectedItem) return;

    if (editForm.quantity !== undefined && editForm.quantity < 0) {
      toast.error("Số lượng không hợp lệ!");
      return;
    }
    if (editForm.reserved !== undefined && editForm.reserved < 0) {
      toast.error("Reserved không hợp lệ!");
      return;
    }
    if (editForm.sold !== undefined && editForm.sold < 0) {
      toast.error("Sold không hợp lệ!");
      return;
    }
    if (
      (editForm.reserved || 0) + (editForm.sold || 0) >
      (editForm.quantity || 0)
    ) {
      toast.error("Reserved + Sold không được vượt quá quantity!");
      return;
    }

    try {
      await inventoryApi.updateDealerInventory(
        user!.dealerId!,
        selectedItem.vehicleId,
        editForm
      );
      toast.success("Cập nhật thành công!");
      setShowEditModal(false);
      const res = await inventoryApi.getDealerInventory(user!.dealerId!);
      setDealerInventory(res.data.data);
    } catch (err) {
      toast.error("Cập nhật thất bại.");
    }
  };

  // Mở modal đặt trước
  const handleOpenReserve = (item: DealerInventory) => {
    setSelectedItem(item);
    setReserveForm({ quantity: 1 });
    setShowReserveModal(true);
  };

  // Đặt trước (API 4: reserveInventory)
  const handleReserve = async () => {
    if (!reserveForm.quantity || reserveForm.quantity <= 0) {
      toast.error("Số lượng phải > 0!");
      return;
    }
    if (reserveForm.quantity > selectedItem!.available) {
      toast.error("Không đủ hàng khả dụng!");
      return;
    }
    try {
      await inventoryApi.reserveInventory(
        user!.dealerId!,
        selectedItem!.vehicleId,
        reserveForm
      );
      toast.success("Đặt trước thành công!");
      setShowReserveModal(false);
      const res = await inventoryApi.getDealerInventory(user!.dealerId!);
      setDealerInventory(res.data.data);
    } catch (err) {
      toast.error("Đặt trước thất bại.");
    }
  };

  // Mở modal bán hàng
  const handleOpenCompleteSale = (item: DealerInventory) => {
    setSelectedItem(item);
    setSaleForm({ quantity: 1 });
    setShowCompleteSaleModal(true);
  };

  // Hoàn tất bán (API 5: completeSale)
  const handleCompleteSale = async () => {
    if (!saleForm.quantity || saleForm.quantity <= 0) {
      toast.error("Số lượng phải > 0!");
      return;
    }
    if (saleForm.quantity > selectedItem!.available) {
      toast.error("Không đủ hàng khả dụng!");
      return;
    }
    try {
      await inventoryApi.completeSale(
        user!.dealerId!,
        selectedItem!.vehicleId,
        saleForm
      );
      toast.success("Bán hàng thành công!");
      setShowCompleteSaleModal(false);
      const res = await inventoryApi.getDealerInventory(user!.dealerId!);
      setDealerInventory(res.data.data);
    } catch (err) {
      toast.error("Bán hàng thất bại.");
    }
  };

  // Mở modal hủy đặt trước
  const handleOpenCancelReserve = (item: DealerInventory) => {
    setSelectedItem(item);
    setCancelForm({ quantity: 1 });
    setShowCancelReserveModal(true);
  };

  // Hủy đặt trước (API 6: cancelReservation)
  const handleCancelReservation = async () => {
    if (!cancelForm.quantity || cancelForm.quantity <= 0) {
      toast.error("Số lượng phải > 0!");
      return;
    }
    if (cancelForm.quantity > selectedItem!.reserved) {
      toast.error("Số lượng hủy vượt quá reserved!");
      return;
    }
    try {
      await inventoryApi.cancelReservation(
        user!.dealerId!,
        selectedItem!.vehicleId,
        cancelForm
      );
      toast.success("Hủy đặt trước thành công!");
      setShowCancelReserveModal(false);
      const res = await inventoryApi.getDealerInventory(user!.dealerId!);
      setDealerInventory(res.data.data);
    } catch (err) {
      toast.error("Hủy thất bại.");
    }
  };

  // Export CSV (chỉ manager mới export được, staff chỉ xem)
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Đã đặt trước</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {totalReserved.toLocaleString()} xe
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
              {/* ShoppingCart className="w-6 h-6 text-purple-600" */}
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

      {/* Phần Search và Nút Bộ lọc */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          {/* Search */}
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

          {/* Nút Bộ lọc */}
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

        {/* Chi tiết Bộ lọc (xổ xuống) */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Filter Tổng tồn kho (exact) */}
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

              {/* Filter Reserved (exact) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reserved
                </label>
                <input
                  type="number"
                  placeholder="Nhập số lượng"
                  value={filterReserved}
                  onChange={(e) => setFilterReserved(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  min="0"
                />
              </div>

              {/* Filter Sold (exact) */}
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

              {/* Filter Khả dụng (exact) */}
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

              {/* Filter Trạng thái */}
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
                  Reserved
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
                  <td className="px-6 py-4 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    {item.reserved}
                  </td>
                  <td className="px-6 py-4">{item.sold}</td>
                  <td className="px-6 py-4 text-green-600 font-semibold">
                    {item.available}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(item.vehicleId)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenReserve(item)}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenCompleteSale(item)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenCancelReserve(item)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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

      {/* Modals */}
      {/* Chi tiết */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Chi tiết xe</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Model:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {selectedItem.vehicle.model}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Nhà sản xuất:
                  </span>
                  <span className="text-gray-900">
                    {selectedItem.vehicle.manufacturer.name}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Tổng:
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {selectedItem.quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Reserved:
                  </span>
                  <span className="text-lg font-bold text-yellow-800">
                    {selectedItem.reserved}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Sold:
                  </span>
                  <span className="text-lg font-bold text-red-800">
                    {selectedItem.sold}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Khả dụng:
                  </span>
                  <span className="text-lg font-bold text-blue-800">
                    {selectedItem.available}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Vị trí:
                  </span>
                  <span className="text-gray-900">
                    {selectedItem.location || "N/A"}
                  </span>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CloseIcon className="w-4 h-4" />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit (Update) */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">
              Chỉnh sửa - {selectedItem.vehicle.model}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tổng số lượng
                </label>
                <input
                  type="number"
                  value={editForm.quantity ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Đã đặt trước (Reserved)
                </label>
                <input
                  type="number"
                  value={editForm.reserved ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      reserved: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Đã bán (Sold)
                </label>
                <input
                  type="number"
                  value={editForm.sold ?? ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      sold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vị trí
                </label>
                <input
                  type="text"
                  value={editForm.location ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateInventory}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reserve */}
      {showReserveModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">
              Đặt trước - {selectedItem.vehicle.model}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Khả dụng: {selectedItem.available}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số lượng đặt trước
              </label>
              <input
                type="number"
                value={reserveForm.quantity ?? ""}
                onChange={(e) =>
                  setReserveForm({ quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-gray-300 rounded-lg p-2 text-black"
                min="1"
                max={selectedItem.available}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowReserveModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleReserve}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Đặt trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Complete Sale */}
      {showCompleteSaleModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">
              Hoàn tất bán - {selectedItem.vehicle.model}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Khả dụng: {selectedItem.available}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số lượng bán
              </label>
              <input
                type="number"
                value={saleForm.quantity ?? ""}
                onChange={(e) =>
                  setSaleForm({ quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-gray-300 rounded-lg p-2 text-black"
                min="1"
                max={selectedItem.available}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCompleteSaleModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleCompleteSale}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Bán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancel Reservation */}
      {showCancelReserveModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">
              Hủy đặt trước - {selectedItem.vehicle.model}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Đã đặt trước: {selectedItem.reserved}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số lượng hủy
              </label>
              <input
                type="number"
                value={cancelForm.quantity ?? ""}
                onChange={(e) =>
                  setCancelForm({ quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-gray-300 rounded-lg p-2 text-black"
                min="1"
                max={selectedItem.reserved}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCancelReserveModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                onClick={handleCancelReservation}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Hủy đặt trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
