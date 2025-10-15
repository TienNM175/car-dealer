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
  const [selectedItem, setSelectedItem] = useState<DealerInventory | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showCompleteSaleModal, setShowCompleteSaleModal] = useState(false);
  const [showCancelReserveModal, setShowCancelReserveModal] = useState(false);

  const [editForm, setEditForm] = useState<UpdateDealerInventoryInput>({});
  const [reserveForm, setReserveForm] = useState<ReserveInventoryInput>({ quantity: 0 });
  const [saleForm, setSaleForm] = useState<CompleteSaleInput>({ quantity: 0 });
  const [cancelForm, setCancelForm] = useState<CancelReservationInput>({ quantity: 0 });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Kiểm tra auth
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

  // Pagination logic
  const totalItems = dealerInventory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = dealerInventory.slice(startIndex, endIndex);

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

  // Thống kê
  const totalStock = dealerInventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalReserved = dealerInventory.reduce((sum, item) => sum + item.reserved, 0);
  const totalSold = dealerInventory.reduce((sum, item) => sum + item.sold, 0);
  const totalAvailable = dealerInventory.reduce((sum, item) => sum + item.available, 0);
  const lowStockCount = dealerInventory.filter(item => item.available < 5).length;

  // Xem chi tiết (API 2: getDealerInventoryItem)
  const handleViewDetail = async (vehicleId: string) => {
    try {
      const response = await inventoryApi.getDealerInventoryItem(user!.dealerId!, vehicleId);
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
    if ((editForm.reserved || 0) + (editForm.sold || 0) > (editForm.quantity || 0)) {
      toast.error("Reserved + Sold không được vượt quá quantity!");
      return;
    }

    try {
      await inventoryApi.updateDealerInventory(user!.dealerId!, selectedItem.vehicleId, editForm);
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
      await inventoryApi.reserveInventory(user!.dealerId!, selectedItem!.vehicleId, reserveForm);
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
      await inventoryApi.completeSale(user!.dealerId!, selectedItem!.vehicleId, saleForm);
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
      await inventoryApi.cancelReservation(user!.dealerId!, selectedItem!.vehicleId, cancelForm);
      toast.success("Hủy đặt trước thành công!");
      setShowCancelReserveModal(false);
      const res = await inventoryApi.getDealerInventory(user!.dealerId!);
      setDealerInventory(res.data.data);
    } catch (err) {
      toast.error("Hủy thất bại.");
    }
  };

  // Export CSV
  const handleExportReport = () => {
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

  if (authLoading || loading) return <div className="text-center py-8">Đang tải...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý tồn kho - {user?.dealer?.name || "Đại lý"}</h2>
        <button
          onClick={handleExportReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </button>
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
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalStock.toLocaleString()} xe</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Đã đặt trước</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{totalReserved.toLocaleString()} xe</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Đã bán</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{totalSold.toLocaleString()} xe</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Khả dụng</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{totalAvailable.toLocaleString()} xe</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Cảnh báo thấp</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{lowStockCount} model</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md p-6 text-black">
        <h3 className="font-semibold text-lg mb-4">Danh sách tồn kho</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khả dụng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-black">
  {paginatedData.map((item) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-6 py-4"><span className="font-semibold">{item.vehicle.model}</span></td>
      <td className="px-6 py-4">{item.quantity}</td>
      {/* Sửa lỗi ở đây: thay classClock bằng className, thêm icon Clock nếu muốn */}
      <td className="px-6 py-4 flex items-center gap-1">
        <Clock className="w-4 h-4 text-yellow-600" />
        {item.reserved}
      </td>
      <td className="px-6 py-4">{item.sold}</td>
      <td className="px-6 py-4 text-green-600 font-semibold">{item.available}</td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button onClick={() => handleViewDetail(item.vehicleId)} className="text-blue-600 hover:text-blue-700">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => handleEdit(item)} className="text-green-600 hover:text-green-700">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleOpenReserve(item)} className="text-yellow-600 hover:text-yellow-700">
            <Clock className="w-4 h-4" />
          </button>
          <button onClick={() => handleOpenCompleteSale(item)} className="text-purple-600 hover:text-purple-700">
            <CheckSquare className="w-4 h-4" />
          </button>
          <button onClick={() => handleOpenCancelReserve(item)} className="text-red-600 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4">
            <p className="text-sm text-gray-700">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)} của {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {getPageNumbers().map((page) => (
                <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-1 rounded-lg border ${currentPage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Chi tiết */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Chi tiết - {selectedItem.vehicle.model}</h3>
            <div className="space-y-2">
              <p><strong>Nhà sản xuất:</strong> {selectedItem.vehicle.manufacturer.name}</p>
              <p><strong>Tổng:</strong> {selectedItem.quantity}</p>
              <p><strong>Reserved:</strong> {selectedItem.reserved}</p>
              <p><strong>Sold:</strong> {selectedItem.sold}</p>
              <p><strong>Khả dụng:</strong> {selectedItem.available}</p>
              <p><strong>Vị trí:</strong> {selectedItem.location || "N/A"}</p>
            </div>
            <button onClick={() => setShowDetailModal(false)} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">Đóng</button>
          </div>
        </div>
      )}

            {/* Modal Edit (Update) */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">Chỉnh sửa - {selectedItem.vehicle.model}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tổng số lượng</label>
                <input
                  type="number"
                  value={editForm.quantity ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đã đặt trước (Reserved)</label>
                <input
                  type="number"
                  value={editForm.reserved ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, reserved: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đã bán (Sold)</label>
                <input
                  type="number"
                  value={editForm.sold ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, sold: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vị trí</label>
                <input
                  type="text"
                  value={editForm.location ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-black"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Hủy
              </button>
              <button onClick={handleUpdateInventory} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
            <h3 className="text-xl font-bold mb-4">Đặt trước - {selectedItem.vehicle.model}</h3>
            <p className="text-sm text-gray-600 mb-4">Khả dụng: {selectedItem.available}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số lượng đặt trước</label>
              <input
                type="number"
                value={reserveForm.quantity ?? ""}
                onChange={(e) => setReserveForm({ quantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg p-2 text-black"
                min="1"
                max={selectedItem.available}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowReserveModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Hủy
              </button>
              <button onClick={handleReserve} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
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
            <h3 className="text-xl font-bold mb-4">Hoàn tất bán - {selectedItem.vehicle.model}</h3>
            <p className="text-sm text-gray-600 mb-4">Khả dụng: {selectedItem.available}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số lượng bán</label>
              <input
                type="number"
                value={saleForm.quantity ?? ""}
                onChange={(e) => setSaleForm({ quantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg p-2 text-black"
                min="1"
                max={selectedItem.available}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCompleteSaleModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Hủy
              </button>
              <button onClick={handleCompleteSale} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
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
            <h3 className="text-xl font-bold mb-4">Hủy đặt trước - {selectedItem.vehicle.model}</h3>
            <p className="text-sm text-gray-600 mb-4">Đã đặt trước: {selectedItem.reserved}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số lượng hủy</label>
              <input
                type="number"
                value={cancelForm.quantity ?? ""}
                onChange={(e) => setCancelForm({ quantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg p-2 text-black"
                min="1"
                max={selectedItem.reserved}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCancelReserveModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Hủy
              </button>
              <button onClick={handleCancelReservation} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Hủy đặt trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}