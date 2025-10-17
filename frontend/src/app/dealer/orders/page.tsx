'use client';
import React, { useEffect, useState } from "react";
import DealerOrderList from "@/components/dealer-orders/DealerOrderList";
import DealerOrderForm from "@/components/dealer-orders/DealerOrderForm";
import DealerOrderDetailModal from "@/components/dealer-orders/DealerOrderDetailModal";
import dealerOrderApi, { 
  DealerOrder, 
  CreateDealerOrderInput, 
  UpdateDealerOrderInput 
} from "@/lib/api/dealerOrderApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Toaster, toast } from 'react-hot-toast';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  // Redirect nếu không phải Manager
  useEffect(() => {
    if (userRole !== 'DEALER_MANAGER' && userRole !== 'ADMIN') {
      router.push('/dealer/dashboard');
    }
  }, [userRole, router]);

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
      toast.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const dealerId = userRole === "ADMIN" ? undefined : (user as any)?.dealerId;
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
    if (userRole === 'DEALER_MANAGER' || userRole === 'ADMIN') {
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
    // Thay thế confirm bằng toast confirmation
    const confirmDelete = () => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Xác nhận hủy đơn hàng
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Bạn có chắc muốn hủy đơn hàng {order.orderNumber}? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={async () => {
                await performDelete(order);
                toast.dismiss(t.id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Xóa
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </button>
          </div>
        </div>
      ), {
        duration: Infinity, // Không tự động đóng
      });
    };

    confirmDelete();
  };

  const performDelete = async (order: DealerOrder) => {
    try {
      const loadingToast = toast.loading('Đang hủy đơn hàng...');
      
      await dealerOrderApi.cancelDealerOrder(order.id, "Hủy bởi Manager");
      
      toast.dismiss(loadingToast);
      toast.success(`Đã hủy đơn hàng ${order.orderNumber} thành công!`);
      
      if (orders.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchOrders();
        fetchStatistics();
      }
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng";
      toast.error(`Lỗi: ${errorMessage}`);
    }
  };

  const handleCreate = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  const handleSave = async (order: any) => {
    fetchOrders();
    fetchStatistics();
  };

  const handleStatusChange = async (orderId: string, newStatus: DealerOrder["status"]) => {
    // Manager chỉ có thể cancel, không thể update status khác
    if (newStatus !== 'CANCELLED') {
      toast.error('Manager chỉ có thể hủy đơn hàng, không thể thay đổi trạng thái khác');
      return;
    }

    try {
      const loadingToast = toast.loading('Đang hủy đơn hàng...');
      
      await dealerOrderApi.cancelDealerOrder(orderId, "Hủy bởi Manager");
      
      toast.dismiss(loadingToast);
      toast.success('Đã hủy đơn hàng thành công!');
      
      fetchOrders();
      fetchStatistics();
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi hủy đơn hàng";
      toast.error(`Lỗi: ${errorMessage}`);
    }
  };

  const handleExport = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        orders.map((o) => ({
          "Số đơn": o.orderNumber,
          "Đại lý": o.dealer?.name || "N/A",
          "Xe": `${o.vehicle?.manufacturer?.name} ${o.vehicle?.model}`,
          "Số lượng": o.quantity,
          "Đơn giá": o.unitPrice,
          "Tổng tiền": o.totalAmount,
          "Trạng thái": o.status,
          "Ngày đặt": o.orderedAt ? new Date(o.orderedAt).toLocaleDateString() : "",
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
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, `dealer-orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Hiển thị access denied nếu không phải Manager
  if (userRole !== 'DEALER_MANAGER' && userRole !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Truy cập bị từ chối</h2>
          <p className="text-red-600">
            Bạn không có quyền truy cập trang Quản lý Đơn hàng. 
            Chỉ DEALER_MANAGER mới có quyền truy cập trang này.
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
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#fff',
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
    </>
  );
}