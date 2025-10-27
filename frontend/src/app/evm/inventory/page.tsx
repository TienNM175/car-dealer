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
  Truck,
  Filter,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import inventoryApi, {
  InventoryFilters,
  InventorySummary,
  LowStockAlerts,
  EVMInventory,
  DealerInventory,
  UpdateEVMInventoryInput,
  TransferInventoryInput,
} from "@/lib/api/inventoryApi";

export default function InventoryPage() {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [evmInventory, setEvmInventory] = useState<EVMInventory[]>([]);
  const [dealerInventories, setDealerInventories] = useState<DealerInventory[]>(
    []
  );
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlerts | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<EVMInventory | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editForm, setEditForm] = useState<UpdateEVMInventoryInput>({});
  const [transferForm, setTransferForm] = useState<TransferInventoryInput>({
    vehicleId: "",
    fromDealerId: "",
    toDealerId: "",
    quantity: 0,
    notes: "",
  });

  // Thêm states cho search và filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterTotalStock, setFilterTotalStock] = useState(""); // Exact number
  const [filterDealerStock, setFilterDealerStock] = useState(""); // Exact number
  const [filterAvailable, setFilterAvailable] = useState(""); // Exact number
  const [filterStatus, setFilterStatus] = useState(""); // '', 'excess', 'normal', 'low'

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const summaryResponse = await inventoryApi.getInventorySummary();
        setSummary(summaryResponse.data.data);

        const evmResponse = await inventoryApi.getEVMInventory();
        setEvmInventory(evmResponse.data.data);

        const dealerResponse = await inventoryApi.getAllDealerInventories();
        setDealerInventories(dealerResponse.data.data);

        const alertsResponse = await inventoryApi.getLowStockAlerts(5);
        setLowStockAlerts(alertsResponse.data.data);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu tồn kho. Vui lòng thử lại.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    filterTotalStock,
    filterDealerStock,
    filterAvailable,
    filterStatus,
  ]);

  // Tính dealerStock cho từng vehicle
  const getDealerStockByVehicle = (vehicleId: string): number => {
    return dealerInventories
      .filter((item) => item.vehicleId === vehicleId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Kết hợp dữ liệu cho bảng
  const tableData = evmInventory.map((item) => ({
    id: item.id,
    vehicle: item.vehicle.model || item.vehicle.id,
    totalStock: item.quantity,
    dealerStock: getDealerStockByVehicle(item.vehicleId),
    available: item.available,
    vehicleId: item.vehicleId,
  }));

  // Lọc dữ liệu dựa trên search và filters
  const filteredTableData = tableData.filter((item) => {
    // Search theo model
    const matchesSearch = item.vehicle
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filter theo tổng tồn kho (exact)
    const totalFilter = parseInt(filterTotalStock) || NaN;
    const matchesTotalStock = !isNaN(totalFilter)
      ? item.totalStock === totalFilter
      : true;

    // Filter theo tại đại lý (exact)
    const dealerFilter = parseInt(filterDealerStock) || NaN;
    const matchesDealerStock = !isNaN(dealerFilter)
      ? item.dealerStock === dealerFilter
      : true;

    // Filter theo khả dụng (exact)
    const availableFilter = parseInt(filterAvailable) || NaN;
    const matchesAvailable = !isNaN(availableFilter)
      ? item.available === availableFilter
      : true;

    // Filter theo trạng thái
    let itemStatus = "";
    if (item.available > 100) itemStatus = "excess";
    else if (item.available > 50) itemStatus = "normal";
    else itemStatus = "low";
    const matchesStatus = !filterStatus || itemStatus === filterStatus;

    return (
      matchesSearch &&
      matchesTotalStock &&
      matchesDealerStock &&
      matchesAvailable &&
      matchesStatus
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTableData.length / limit);
  const paginatedData = filteredTableData.slice(
    (page - 1) * limit,
    page * limit
  );

  // Tính thống kê
  const totalStock = summary?.evm.totalQuantity || 0;
  const readyToDeliver = summary?.evm.totalAvailable || 0;
  const inDistribution = summary?.evm.totalReserved || 0;
  const needsReplenish = lowStockAlerts?.summary.evmCount || 0;

  // Xem chi tiết
  const handleViewDetail = async (vehicleId: string) => {
    try {
      const response = await inventoryApi.getEVMInventoryByVehicle(vehicleId);
      setSelectedVehicle(response.data.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error("Lỗi khi tải chi tiết tồn kho.");
      console.error("Detail fetch error:", err);
    }
  };

  // Mở modal chỉnh sửa
  const handleEdit = (item: (typeof tableData)[0]) => {
    setSelectedVehicle(
      evmInventory.find((inv) => inv.vehicleId === item.vehicleId) || null
    );
    setEditForm({
      quantity: item.totalStock,
      reserved: selectedVehicle?.reserved || 0, // Sử dụng reserved từ API thay vì tính toán
      location: evmInventory.find((inv) => inv.vehicleId === item.vehicleId)
        ?.location,
    });
    setShowEditModal(true);
  };

  // Cập nhật tồn kho
  const handleUpdateInventory = async () => {
    if (!selectedVehicle) return;

    // Validation
    if (editForm.quantity === undefined || editForm.quantity < 0) {
      toast.error("Số lượng phải là số nguyên không âm!");
      return;
    }
    if (editForm.reserved === undefined || editForm.reserved < 0) {
      toast.error("Số lượng đã đặt trước phải là số nguyên không âm!");
      return;
    }
    if (editForm.reserved > editForm.quantity) {
      toast.error("Số lượng đã đặt trước không được vượt quá tổng tồn kho!");
      return;
    }
    if (!editForm.location || editForm.location.trim() === "") {
      toast.error("Vị trí không được để trống!");
      return;
    }

    try {
      await inventoryApi.updateEVMInventory(
        selectedVehicle.vehicleId,
        editForm
      );
      toast.success("Cập nhật tồn kho thành công!");
      setShowEditModal(false);
      const evmResponse = await inventoryApi.getEVMInventory();
      setEvmInventory(evmResponse.data.data);
    } catch (err) {
      toast.error("Lỗi khi cập nhật tồn kho.");
      console.error("Update error:", err);
    }
  };

  // Mở modal chuyển giao
  const handleOpenTransferModal = (item: (typeof tableData)[0]) => {
    // Tìm selectedVehicle từ evmInventory
    const vehicle = evmInventory.find(
      (inv) => inv.vehicleId === item.vehicleId
    );
    console.log("🔍 Debug Transfer Modal:");
    console.log("- Item vehicleId:", item.vehicleId);
    console.log("- EVM Inventory length:", evmInventory.length);
    console.log("- Found vehicle:", vehicle);
    console.log("- Vehicle quantity:", vehicle?.quantity);

    setSelectedVehicle(vehicle || null);

    setTransferForm({
      ...transferForm,
      vehicleId: item.vehicleId,
      quantity: 1,
    });
    setShowTransferModal(true);
  };

  // Chuyển giao tồn kho
  const handleTransferInventory = async () => {
    // Validation
    if (!transferForm.toDealerId || transferForm.toDealerId === "") {
      toast.error("Vui lòng chọn đại lý đích!");
      return;
    }
    if (transferForm.quantity <= 0) {
      toast.error("Số lượng chuyển giao phải lớn hơn 0!");
      return;
    }
    // Kiểm tra số lượng khả dụng tại EVM
    const evmStock = selectedVehicle?.quantity || 0;
    if (transferForm.quantity > evmStock) {
      toast.error(
        `Số lượng chuyển giao vượt quá tồn kho EVM (${evmStock} xe)!`
      );
      return;
    }

    try {
      await inventoryApi.transferInventory(transferForm);
      toast.success("Chuyển giao tồn kho thành công!");
      setShowTransferModal(false);
      setTransferForm({
        vehicleId: "",
        fromDealerId: "",
        toDealerId: "",
        quantity: 0,
        notes: "",
      });

      // Refresh tất cả data
      const [evmResponse, dealerResponse, summaryResponse] = await Promise.all([
        inventoryApi.getEVMInventory(),
        inventoryApi.getAllDealerInventories(),
        inventoryApi.getInventorySummary(),
      ]);

      setEvmInventory(evmResponse.data.data);
      setDealerInventories(dealerResponse.data.data);
      setSummary(summaryResponse.data.data);
    } catch (err) {
      toast.error("Lỗi khi chuyển giao tồn kho.");
      console.error("Transfer error:", err);
    }
  };

  // Xuất báo cáo (mock CSV)
  const handleExportReport = () => {
    const csvContent = [
      ["Model", "Tổng tồn kho", "Tại đại lý", "Khả dụng", "Trạng thái"],
      ...filteredTableData.map((item) => [
        item.vehicle,
        item.totalStock,
        item.dealerStock,
        item.available,
        item.available > 100
          ? "Dư thừa"
          : item.available > 50
          ? "Bình thường"
          : "Cần bổ sung",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Đã xuất báo cáo thành công!");
  };

  // Xóa bộ lọc
  const clearFilters = () => {
    setFilterTotalStock("");
    setFilterDealerStock("");
    setFilterAvailable("");
    setFilterStatus("");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Quản lý tồn kho - EVM
        </h2>
        <button
          onClick={handleExportReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>

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
          <p className="text-gray-600 text-sm">Sẵn sàng giao</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {readyToDeliver.toLocaleString()} xe
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Đang phân phối</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {inDistribution.toLocaleString()} xe
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Cần bổ sung</p>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {needsReplenish} model
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filter Tổng tồn kho (exact) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng tồn kho
                </label>
                <input
                  type="number"
                  placeholder="Nhập số lượng"
                  value={filterTotalStock}
                  onChange={(e) => setFilterTotalStock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500"
                  min="0"
                />
              </div>

              {/* Filter Tại đại lý (exact) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tại đại lý
                </label>
                <input
                  type="number"
                  placeholder="Nhập số lượng"
                  value={filterDealerStock}
                  onChange={(e) => setFilterDealerStock(e.target.value)}
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
                  <option value="excess">Dư thừa</option>
                  <option value="normal">Bình thường</option>
                  <option value="low">Cần bổ sung</option>
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

      <div className="bg-white rounded-xl shadow-md p-6 text-black">
        <h3 className="font-semibold text-lg mb-4">Chi tiết tồn kho</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tổng tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tại đại lý
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Khả dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
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
                    <span className="font-semibold">{item.vehicle}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-blue-600">
                      {item.totalStock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">
                      {item.dealerStock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">
                      {item.available.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        item.available > 100
                          ? "bg-green-100 text-green-700"
                          : item.available > 50
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.available > 100
                        ? "Dư thừa"
                        : item.available > 50
                        ? "Bình thường"
                        : "Cần bổ sung"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(item.vehicleId)}
                        aria-label={`Xem chi tiết ${item.vehicle}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        aria-label={`Chỉnh sửa ${item.vehicle}`}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenTransferModal(item)}
                        aria-label={`Chuyển giao ${item.vehicle}`}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(paginatedData.length === 0 && filteredTableData.length > 0) ||
              filteredTableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700">
                <span className="font-medium">
                  Hiển thị{" "}
                  <span className="font-semibold">
                    {(page - 1) * limit + 1}
                  </span>{" "}
                  đến{" "}
                  <span className="font-semibold">
                    {Math.min(page * limit, filteredTableData.length)}
                  </span>{" "}
                  của{" "}
                  <span className="font-semibold">
                    {filteredTableData.length}
                  </span>{" "}
                  kết quả
                </span>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Chi tiết tồn kho - {selectedVehicle.vehicle.model}
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Model:</strong> {selectedVehicle.vehicle.model}
              </p>
              <p>
                <strong>Nhà sản xuất:</strong>{" "}
                {selectedVehicle.vehicle.manufacturer.name}
              </p>
              <p>
                <strong>Tổng tồn kho:</strong>{" "}
                {selectedVehicle.quantity.toLocaleString()}
              </p>
              <p>
                <strong>Đã đặt trước:</strong>{" "}
                {selectedVehicle.reserved.toLocaleString()}
              </p>
              <p>
                <strong>Khả dụng:</strong>{" "}
                {selectedVehicle.available.toLocaleString()}
              </p>
              <p>
                <strong>Vị trí:</strong>{" "}
                {selectedVehicle.location || "Không xác định"}
              </p>
              {selectedVehicle.vehicle.images.length > 0 && (
                <img
                  src={selectedVehicle.vehicle.images[0].url}
                  alt={selectedVehicle.vehicle.model}
                  className="mt-4 w-full h-48 object-cover rounded-lg border border-gray-200"
                />
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa */}
      {showEditModal && selectedVehicle && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Chỉnh sửa tồn kho - {selectedVehicle.vehicle.model}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số lượng
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
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Đã đặt trước
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
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-black"
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
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-black"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateInventory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chuyển giao */}
      {showTransferModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Chuyển giao tồn kho
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Từ kho EVM
                </label>
                <div className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-600">
                  EVM Inventory - {selectedVehicle?.quantity || 0} xe có sẵn
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Đến đại lý
                </label>
                <select
                  value={transferForm.toDealerId}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      toDealerId: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 text-black"
                >
                  <option value="">Chọn đại lý</option>
                  {summary?.byDealer
                    ?.filter((d) => d.dealer.name !== "Cà Mau")
                    .map((d) => (
                      <option key={d.dealer.id} value={d.dealer.id}>
                        {d.dealer.name} ({d.dealer.city || "Không xác định"})
                      </option>
                    )) || []}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số lượng
                </label>
                <input
                  type="number"
                  value={transferForm.quantity}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 text-black"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ghi chú
                </label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 h-20 resize-none text-black"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleTransferInventory}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                Chuyển giao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
