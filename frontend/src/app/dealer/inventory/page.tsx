"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Download,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import inventoryApi, {
  InventoryFilters,
  DealerInventory,
  UpdateDealerInventoryInput,
  ReserveInventoryInput,
  CompleteSaleInput,
  CancelReservationInput,
} from "@/lib/api/inventoryApi";
import axiosClient from "@/lib/utils/axiosClient";

// Giả định cập nhật kiểu User với dealerId
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN";
  dealerId?: string; // Thêm dealerId tùy chọn
}

export default function DealerInventoryPage() {
  const router = useRouter();
  const { user } = useAuth() as { user: User }; // Ép kiểu tạm thời
  const [inventories, setInventories] = useState<DealerInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DealerInventory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editForm, setEditForm] = useState<UpdateDealerInventoryInput>({});
  const [reserveForm, setReserveForm] = useState<ReserveInventoryInput>({ quantity: 0 });
  const [saleForm, setSaleForm] = useState<CompleteSaleInput>({ quantity: 0 });
  const [cancelForm, setCancelForm] = useState<CancelReservationInput>({ quantity: 0 });

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        setLoading(true);
        setError(null);

        let dealerIds: string[] = [];
        if (user?.role?.startsWith("DEALER")) {
          if (user.dealerId) {
            dealerIds = [user.dealerId];
          } else {
            setError("Không tìm thấy thông tin đại lý của bạn.");
            return;
          }
        } else if (user?.role === "ADMIN" || user?.role?.startsWith("EVM")) {
          const dealersResponse = await axiosClient.get<{ data: { id: string }[] }>("/api/dealers");
          dealerIds = dealersResponse.data.data.map((dealer: { id: string }) => dealer.id); // Sửa lại để trích xuất data
          if (dealerIds.length === 0) {
            setError("Không tìm thấy danh sách đại lý.");
            return;
          }
        } else {
          setError("Bạn không có quyền truy cập trang này.");
          return;
        }

        const allInventories = await Promise.all(
          dealerIds.map((dealerId) =>
            inventoryApi.getDealerInventory(dealerId, {}).then((res) => {
              if (Array.isArray(res.data)) {
                return res.data;
              }
              return [];
            })
          )
        );
        setInventories(allInventories.flat());
      } catch (err) {
        setError("Lỗi khi tải dữ liệu tồn kho. Vui lòng thử lại.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventories();
  }, [user]);

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

  const handleUpdateInventory = async () => {
    if (!selectedItem) return;

    if (editForm.quantity === undefined || editForm.quantity < 0) {
      toast.error("Số lượng phải là số nguyên không âm!");
      return;
    }
    if (editForm.reserved === undefined || editForm.reserved < 0) {
      toast.error("Số lượng đặt trước phải là số nguyên không âm!");
      return;
    }
    if (editForm.sold === undefined || editForm.sold < 0) {
      toast.error("Số lượng đã bán phải là số nguyên không âm!");
      return;
    }
    if (editForm.reserved + editForm.sold > editForm.quantity) {
      toast.error("Tổng đặt trước và đã bán không được vượt quá số lượng!");
      return;
    }
    if (!editForm.location || editForm.location.trim() === "") {
      toast.error("Vị trí không được để trống!");
      return;
    }

    try {
      await inventoryApi.updateDealerInventory(selectedItem.dealerId, selectedItem.vehicleId, editForm);
      toast.success("Cập nhật tồn kho thành công!");
      setShowEditModal(false);
      const updatedInventories = await Promise.all(
        inventories.map((inv) =>
          inventoryApi.getDealerInventory(inv.dealerId, {}).then((res) => {
            if (Array.isArray(res.data)) {
              return res.data;
            }
            return [];
          })
        )
      );
      setInventories(updatedInventories.flat());
    } catch (err) {
      toast.error("Lỗi khi cập nhật tồn kho.");
      console.error("Update error:", err);
    }
  };

  const handleReserve = (item: DealerInventory) => {
    setSelectedItem(item);
    setReserveForm({ quantity: 0 });
    setShowReserveModal(true);
  };

  const handleReserveInventory = async () => {
    if (!selectedItem) return;

    if (!reserveForm.quantity || reserveForm.quantity <= 0) {
      toast.error("Số lượng đặt trước phải lớn hơn 0!");
      return;
    }
    if (reserveForm.quantity > selectedItem.available) {
      toast.error("Số lượng đặt trước vượt quá số lượng khả dụng!");
      return;
    }

    try {
      await inventoryApi.reserveInventory(selectedItem.dealerId, selectedItem.vehicleId, reserveForm);
      toast.success("Đặt trước thành công!");
      setShowReserveModal(false);
      const updatedInventories = await Promise.all(
        inventories.map((inv) =>
          inventoryApi.getDealerInventory(inv.dealerId, {}).then((res) => {
            if (Array.isArray(res.data)) {
              return res.data;
            }
            return [];
          })
        )
      );
      setInventories(updatedInventories.flat());
    } catch (err) {
      toast.error("Lỗi khi đặt trước.");
      console.error("Reserve error:", err);
    }
  };

  const handleCompleteSale = (item: DealerInventory) => {
    setSelectedItem(item);
    setSaleForm({ quantity: 0 });
    setShowSaleModal(true);
  };

  const handleCompleteSaleInventory = async () => {
    if (!selectedItem) return;

    if (!saleForm.quantity || saleForm.quantity <= 0) {
      toast.error("Số lượng bán phải lớn hơn 0!");
      return;
    }
    if (saleForm.quantity > selectedItem.available) {
      toast.error("Số lượng bán vượt quá số lượng khả dụng!");
      return;
    }

    try {
      await inventoryApi.completeSale(selectedItem.dealerId, selectedItem.vehicleId, saleForm);
      toast.success("Hoàn tất bán hàng thành công!");
      setShowSaleModal(false);
      const updatedInventories = await Promise.all(
        inventories.map((inv) =>
          inventoryApi.getDealerInventory(inv.dealerId, {}).then((res) => {
            if (Array.isArray(res.data)) {
              return res.data;
            }
            return [];
          })
        )
      );
      setInventories(updatedInventories.flat());
    } catch (err) {
      toast.error("Lỗi khi hoàn tất bán hàng.");
      console.error("Sale error:", err);
    }
  };

  const handleCancelReservation = (item: DealerInventory) => {
    setSelectedItem(item);
    setCancelForm({ quantity: 0 });
    setShowCancelModal(true);
  };

  const handleCancelReservationInventory = async () => {
    if (!selectedItem) return;

    if (!cancelForm.quantity || cancelForm.quantity <= 0) {
      toast.error("Số lượng hủy phải lớn hơn 0!");
      return;
    }
    if (cancelForm.quantity > selectedItem.reserved) {
      toast.error("Số lượng hủy vượt quá số lượng đã đặt trước!");
      return;
    }

    try {
      await inventoryApi.cancelReservation(selectedItem.dealerId, selectedItem.vehicleId, cancelForm);
      toast.success("Hủy đặt trước thành công!");
      setShowCancelModal(false);
      const updatedInventories = await Promise.all(
        inventories.map((inv) =>
          inventoryApi.getDealerInventory(inv.dealerId, {}).then((res) => {
            if (Array.isArray(res.data)) {
              return res.data;
            }
            return [];
          })
        )
      );
      setInventories(updatedInventories.flat());
    } catch (err) {
      toast.error("Lỗi khi hủy đặt trước.");
      console.error("Cancel error:", err);
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      ["Dealer", "Model", "Tổng tồn kho", "Đã đặt trước", "Đã bán", "Khả dụng", "Vị trí"],
      ...inventories.map((item) => [
        item.dealerId,
        item.vehicle.model,
        item.quantity.toLocaleString(),
        item.reserved.toLocaleString(),
        item.sold.toLocaleString(),
        item.available.toLocaleString(),
        item.location || "Không xác định",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_dealers_inventory_report_${new Date().toISOString().split("T")[0]}.csv`;
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
    <div className="space-y-6 p-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Quản lý tồn kho{" "}
          {user?.role?.startsWith("DEALER") ? `- Đại lý ${user.dealerId}` : ""}
        </h2>
        <button
          onClick={handleExportReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Đại lý
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Model
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Tổng tồn kho
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Đã đặt trước
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Đã bán
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Khả dụng
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Vị trí
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {inventories.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{item.dealerId}</td>
                <td className="px-4 py-2">{item.vehicle.model}</td>
                <td className="px-4 py-2">{item.quantity.toLocaleString()}</td>
                <td className="px-4 py-2">{item.reserved.toLocaleString()}</td>
                <td className="px-4 py-2">{item.sold.toLocaleString()}</td>
                <td className="px-4 py-2">{item.available.toLocaleString()}</td>
                <td className="px-4 py-2">{item.location || "Không xác định"}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReserve(item)}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleCompleteSale(item)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleCancelReservation(item)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Chỉnh sửa tồn kho</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  value={editForm.quantity ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border rounded-lg p-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đã đặt trước</label>
                <input
                  type="number"
                  value={editForm.reserved ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reserved: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border rounded-lg p-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đã bán</label>
                <input
                  type="number"
                  value={editForm.sold ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sold: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border rounded-lg p-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vị trí</label>
                <input
                  type="text"
                  value={editForm.location ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateInventory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {showReserveModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Đặt trước</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  value={reserveForm.quantity ?? ""}
                  onChange={(e) =>
                    setReserveForm({ quantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border rounded-lg p-2"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowReserveModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleReserveInventory}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg"
              >
                Đặt trước
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaleModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Hoàn tất bán hàng</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  value={saleForm.quantity ?? ""}
                  onChange={(e) =>
                    setSaleForm({ quantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border rounded-lg p-2"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowSaleModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleCompleteSaleInventory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Hủy đặt trước</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  value={cancelForm.quantity ?? ""}
                  onChange={(e) =>
                    setCancelForm({ quantity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border rounded-lg p-2"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleCancelReservationInventory}
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}