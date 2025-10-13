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
  const [dealerInventories, setDealerInventories] = useState<DealerInventory[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<EVMInventory | null>(null);
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
  const handleEdit = (item: typeof tableData[0]) => {
    setSelectedVehicle(evmInventory.find((inv) => inv.vehicleId === item.vehicleId) || null);
    setEditForm({
      quantity: item.totalStock,
      reserved: selectedVehicle?.reserved || 0, // Sử dụng reserved từ API thay vì tính toán
      location: evmInventory.find((inv) => inv.vehicleId === item.vehicleId)?.location,
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
      await inventoryApi.updateEVMInventory(selectedVehicle.vehicleId, editForm);
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
  const handleOpenTransferModal = (item: typeof tableData[0]) => {
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
    if (!transferForm.fromDealerId || transferForm.fromDealerId === "") {
      toast.error("Vui lòng chọn đại lý nguồn!");
      return;
    }
    if (!transferForm.toDealerId || transferForm.toDealerId === "") {
      toast.error("Vui lòng chọn đại lý đích!");
      return;
    }
    if (transferForm.fromDealerId === transferForm.toDealerId) {
      toast.error("Đại lý nguồn và đích không được giống nhau!");
      return;
    }
    if (transferForm.quantity <= 0) {
      toast.error("Số lượng chuyển giao phải lớn hơn 0!");
      return;
    }
    // Kiểm tra số lượng khả dụng tại đại lý nguồn (giả định cần dữ liệu từ API hoặc state)
    const dealerStock = getDealerStockByVehicle(transferForm.vehicleId);
    if (transferForm.quantity > dealerStock) {
      toast.error("Số lượng chuyển giao vượt quá tồn kho tại đại lý!");
      return;
    }

    try {
      await inventoryApi.transferInventory(transferForm);
      toast.success("Chuyển giao tồn kho thành công!");
      setShowTransferModal(false);
      setTransferForm({ vehicleId: "", fromDealerId: "", toDealerId: "", quantity: 0, notes: "" });
      const dealerResponse = await inventoryApi.getAllDealerInventories();
      setDealerInventories(dealerResponse.data.data);
    } catch (err) {
      toast.error("Lỗi khi chuyển giao tồn kho.");
      console.error("Transfer error:", err);
    }
  };

  // Xuất báo cáo (mock CSV)
  const handleExportReport = () => {
    const csvContent = [
      ["Model", "Tổng tồn kho", "Tại đại lý", "Khả dụng", "Trạng thái"],
      ...tableData.map((item) => [
        item.vehicle,
        item.totalStock,
        item.dealerStock,
        item.available,
        item.available > 100 ? "Dư thừa" : item.available > 50 ? "Bình thường" : "Cần bổ sung",
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
        <h2 className="text-2xl font-bold text-gray-800">Quản lý tồn kho - EVM</h2>
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
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalStock.toLocaleString()} xe</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Sẵn sàng giao</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{readyToDeliver.toLocaleString()} xe</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Đang phân phối</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{inDistribution.toLocaleString()} xe</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm">Cần bổ sung</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{needsReplenish} model</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 text-black">
        <h3 className="font-semibold text-lg mb-4">Chi tiết tồn kho</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tồn kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tại đại lý</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khả dụng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-black">
              {tableData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-semibold">{item.vehicle}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-blue-600">{item.totalStock.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{item.dealerStock.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">{item.available.toLocaleString()}</span>
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
                      {item.available > 100 ? "Dư thừa" : item.available > 50 ? "Bình thường" : "Cần bổ sung"}
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chi tiết */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Chi tiết tồn kho - {selectedVehicle.vehicle.model}</h3>
            <div className="space-y-3 text-gray-700">
              <p><strong>Model:</strong> {selectedVehicle.vehicle.model}</p>
              <p><strong>Nhà sản xuất:</strong> {selectedVehicle.vehicle.manufacturer.name}</p>
              <p><strong>Tổng tồn kho:</strong> {selectedVehicle.quantity.toLocaleString()}</p>
              <p><strong>Đã đặt trước:</strong> {selectedVehicle.reserved.toLocaleString()}</p>
              <p><strong>Khả dụng:</strong> {selectedVehicle.available.toLocaleString()}</p>
              <p><strong>Vị trí:</strong> {selectedVehicle.location || "Không xác định"}</p>
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Chỉnh sửa tồn kho - {selectedVehicle.vehicle.model}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  value={editForm.quantity ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đã đặt trước</label>
                <input
                  type="number"
                  value={editForm.reserved ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, reserved: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-black"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vị trí</label>
                <input
                  type="text"
                  value={editForm.location ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Chuyển giao tồn kho</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Từ đại lý</label>
                <select
                  value={transferForm.fromDealerId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromDealerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 text-black"
                >
                  <option value="">Chọn đại lý</option>
                  {summary?.byDealer.map((d) => (
                    <option key={d.dealer.id} value={d.dealer.id}>
                      {d.dealer.name} ({d.dealer.city || "Không xác định"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đến đại lý</label>
                <select
                  value={transferForm.toDealerId}
                  onChange={(e) => setTransferForm({ ...transferForm, toDealerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 text-black"
                >
                  <option value="">Chọn đại lý</option>
                  {summary?.byDealer.map((d) => (
                    <option key={d.dealer.id} value={d.dealer.id}>
                      {d.dealer.name} ({d.dealer.city || "Không xác định"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200 text-black"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
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