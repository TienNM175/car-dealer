"use client";
import React, { useEffect, useState } from "react";
import DealerOrderList from "@/components/dealer-orders/DealerOrderList";
import DealerOrderForm from "@/components/dealer-orders/DealerOrderForm";
import DealerOrderDetailModal from "@/components/dealer-orders/DealerOrderDetailModal";
import dealerOrderApi, {
  DealerOrder,
  CreateDealerOrderInput,
  UpdateDealerOrderInput,
} from "@/lib/api/dealerOrderApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axiosClient from "@/lib/utils/axiosClient";

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const userRole = user?.role?.toUpperCase() as
    | "DEALER_STAFF"
    | "DEALER_MANAGER"
    | "EVM_STAFF"
    | "ADMIN"
    | undefined;

  const [orders, setOrders] = useState<DealerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);

  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DealerOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<DealerOrder | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    order: DealerOrder | null;
    loading: boolean;
  }>({ open: false, order: null, loading: false });

  // Redirect nếu không phải Manager
  // Redirect nếu không phải Manager, EVM Staff hoặc Admin
  useEffect(() => {
    const allowedRoles = ["DEALER_MANAGER", "EVM_STAFF", "ADMIN"];
    if (!allowedRoles.includes(userRole || "")) {
      router.push("/dealer/dashboard");
    }
  }, [userRole, router]);

  // Và trong phần hiển thị access denied
  if (!["DEALER_MANAGER", "EVM_STAFF", "ADMIN"].includes(userRole || "")) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Truy cập bị từ chối
          </h2>
          <p className="text-red-600">
            Bạn không có quyền truy cập trang Quản lý Đơn hàng. Chỉ
            DEALER_MANAGER, EVM_STAFF và ADMIN mới có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await dealerOrderApi.getAllDealerOrders(
        {
          search: searchTerm,
          status: filterStatus as any,
          dealerId: userRole === "ADMIN" ? undefined : (user as any)?.dealerId,
        },
        { page, limit }
      );

      const responseData = res.data.data || res.data;
      const orders = responseData.data || responseData;
      const meta = responseData.meta || res.data.meta;

      setOrders(Array.isArray(orders) ? orders : []);
      setTotal(meta?.total || orders?.length || 0);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
      setTotal(0);
      toast.error("Có lỗi xảy ra khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const dealerId =
        userRole === "ADMIN" ? undefined : (user as any)?.dealerId;
      const res = await dealerOrderApi.getOrdersByStatus(dealerId);
      const data = res.data.data || res.data;

      if (Array.isArray(data)) {
        const byStatus = data.reduce((acc: any, item: any) => {
          acc[item.status] = item.count;
          return acc;
        }, {});

        setStatistics({
          total: data.reduce((sum: number, item: any) => sum + item.count, 0),
          byStatus,
        });
      } else {
        setStatistics(data);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setStatistics(null);
    }
  };

  useEffect(() => {
    if (userRole === "DEALER_MANAGER" || userRole === "ADMIN") {
      fetchOrders();
      fetchStatistics();
    }
  }, [page, searchTerm, filterStatus, userRole]);

  const handleView = (order: DealerOrder) => {
    setViewingOrder(order);
    setShowDetailModal(true);
  };

  const handleEdit = (order: DealerOrder) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleDelete = async (order: DealerOrder) => {
    // Kiểm tra quyền hủy
    if (userRole === "DEALER_MANAGER") {
      // Manager chỉ được hủy đơn PENDING
      if (order.status !== "PENDING") {
        const statusLabels = {
          PENDING: "Chờ xác nhận",
          CONFIRMED: "Đã xác nhận",
          PROCESSING: "Đang xử lý",
          SHIPPED: "Đang giao",
          DELIVERED: "Đã giao",
          CANCELLED: "Đã hủy",
        };
        toast.error(
          `Bạn chỉ có thể hủy đơn hàng ở trạng thái "Chờ xác nhận". Đơn hàng này đang ở trạng thái "${
            statusLabels[order.status] || order.status
          }"`
        );
        return;
      }
    }

    setCancelDialog({ open: true, order, loading: false });
  };

  const confirmCancelOrder = async () => {
    const order = cancelDialog.order;
    if (!order) return;

    try {
      setCancelDialog((prev) => ({ ...prev, loading: true }));
      const loadingToast = toast.loading("Đang hủy đơn hàng...");

      await dealerOrderApi.cancelDealerOrder(order.id, `Hủy bởi ${userRole}`);

      toast.dismiss(loadingToast);
      toast.success(`Đã hủy đơn hàng ${order.orderNumber} thành công!`);

      if (orders.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchOrders();
        fetchStatistics();
      }
    } catch (err: any) {
      console.error("❌ Error cancelling order:", err);
      const errorMessage =
        err.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng";
      toast.error(`Lỗi: ${errorMessage}`);
    } finally {
      setCancelDialog({ open: false, order: null, loading: false });
    }
  };

  const closeCancelDialog = () =>
    setCancelDialog({ open: false, order: null, loading: false });

  const handleCreate = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleSave = async (order: any) => {
    fetchOrders();
    fetchStatistics();
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: DealerOrder["status"]
  ) => {
    // Manager chỉ có thể cancel, không thể update status khác
    if (userRole === "DEALER_MANAGER" && newStatus !== "CANCELLED") {
      toast.error(
        "Manager chỉ có thể hủy đơn hàng, không thể thay đổi trạng thái khác"
      );
      return;
    }

    try {
      const loadingToast = toast.loading("Đang cập nhật trạng thái...");

      // EVM Staff và Admin có thể update status
      await dealerOrderApi.updateDealerOrderStatus(orderId, newStatus);

      toast.dismiss(loadingToast);
      toast.success("Đã cập nhật trạng thái đơn hàng thành công!");

      fetchOrders();
      fetchStatistics();
    } catch (err: any) {
      console.error("Error updating order status:", err);
      const errorMessage =
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái";
      toast.error(`Lỗi: ${errorMessage}`);
    }
  };

  const handleExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        orders.map((o) => ({
          "Số đơn": o.orderNumber,
          "Đại lý": o.dealer?.name || "N/A",
          Xe: `${o.vehicle?.manufacturer?.name} ${o.vehicle?.model}`,
          "Số lượng": o.quantity,
          "Đơn giá": o.unitPrice,
          "Tổng tiền": o.totalAmount,
          "Trạng thái": o.status,
          "Ngày đặt": o.orderedAt
            ? new Date(o.orderedAt).toLocaleDateString()
            : "",
          "Người tạo": `${o.staff?.firstName} ${o.staff?.lastName}`,
          "Ngày tạo": new Date(o.createdAt).toLocaleDateString(),
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Đơn đặt hàng");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(
        data,
        `dealer-orders_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      toast.success("Xuất file Excel thành công!");
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Có lỗi xảy ra khi xuất file Excel");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hiển thị access denied nếu không phải Manager
  if (userRole !== "DEALER_MANAGER" && userRole !== "ADMIN") {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Truy cập bị từ chối
          </h2>
          <p className="text-red-600">
            Bạn không có quyền truy cập trang Quản lý Đơn hàng. Chỉ
            DEALER_MANAGER mới có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: "#3B82F6",
              secondary: "#fff",
            },
          },
        }}
      />

      <div className="p-6">
        <DealerOrderList
          orders={orders}
          loading={loading}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          onFilterChange={(value) => {
            setFilterStatus(value);
            setPage(1);
          }}
          onCreateClick={handleCreate}
          onViewClick={handleView}
          onEditClick={handleEdit}
          onDeleteClick={handleDelete}
          onExportClick={handleExport}
          userRole={userRole || "DEALER_MANAGER"}
          pagination={{
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }}
          onPageChange={handlePageChange}
          statistics={statistics}
          onStatusChange={handleStatusChange}
        />

        {showForm && (
          <DealerOrderForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingOrder(null);
            }}
            onSuccess={handleSave}
            order={editingOrder}
            dealerId={(user as any)?.dealerId}
            userId={(user as any)?.id}
            dealerInfo={{
              name: (user as any)?.dealer?.name || "N/A",
              address: (user as any)?.dealer?.address,
              phone: (user as any)?.dealer?.phone,
              email: (user as any)?.dealer?.email,
            }}
            staffInfo={{
              firstName: (user as any)?.firstName || "",
              lastName: (user as any)?.lastName || "",
            }}
          />
        )}

        {showDetailModal && (
          <DealerOrderDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setViewingOrder(null);
            }}
            order={viewingOrder}
            onStatusChange={handleStatusChange}
            onEditClick={handleEdit}
            userRole={userRole || "DEALER_MANAGER"}
          />
        )}
      </div>

      <ConfirmDialog
        open={cancelDialog.open}
        title="Hủy đơn hàng"
        message={
          cancelDialog.order
            ? `Bạn có chắc muốn hủy đơn hàng ${cancelDialog.order.orderNumber}?`
            : "Bạn có chắc muốn hủy đơn hàng này?"
        }
        confirmLabel="Hủy đơn"
        confirmButtonClassName="bg-red-600 hover:bg-red-700"
        isProcessing={cancelDialog.loading}
        onClose={closeCancelDialog}
        onConfirm={confirmCancelOrder}
      />
    </>
  );
}
