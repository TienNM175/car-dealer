'use client';
import React, { useEffect, useState } from "react";
import DealerOrderList from "@/components/dealer-orders/DealerOrderList";
import DealerOrderDetailModal from "@/components/dealer-orders/DealerOrderDetailModal";
import dealerOrderApi, { 
  DealerOrder
} from "@/lib/api/dealerOrderApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Toaster, toast } from 'react-hot-toast';

// Thêm import cho export Excel
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function EVMOrdersPage() {
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

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<DealerOrder | null>(null);

  // Redirect nếu không phải EVM Staff
  useEffect(() => {
    if (userRole !== 'EVM_STAFF' && userRole !== 'ADMIN') {
      router.push('/evm/dashboard');
    }
  }, [userRole, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await dealerOrderApi.getAllDealerOrders(
        {
          search: searchTerm,
          status: filterStatus as any,
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

  useEffect(() => {
    if (userRole === 'EVM_STAFF' || userRole === 'ADMIN') {
      fetchOrders();
    }
  }, [page, searchTerm, filterStatus, userRole]);

  const handleView = (order: DealerOrder) => {
    setViewingOrder(order);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: DealerOrder["status"]) => {
    try {
      // Hiển thị loading toast
      const loadingToast = toast.loading('Đang cập nhật trạng thái...');
      
      await dealerOrderApi.updateDealerOrderStatus(orderId, newStatus);
      
      // Đóng loading toast và hiển thị thành công
      toast.dismiss(loadingToast);
      toast.success(`Đã cập nhật trạng thái đơn hàng thành công!`);
      
      fetchOrders();
      
    } catch (err: any) {
      console.error("Error updating order status:", err);
      const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái";
      
      // Hiển thị lỗi với toast
      toast.error(`Lỗi: ${errorMessage}`);
    }
  };

  // Empty handlers for actions that EVM Staff cannot perform
  const handleNoAction = () => {
    toast.error('Chức năng này không khả dụng cho EVM Staff');
  };

  const handleNoActionWithOrder = (order: DealerOrder) => {
    toast.error('Chức năng này không khả dụng cho EVM Staff');
  };

  // EVM Staff có thể export Excel
  const handleExport = () => {
    try {
      // Hiển thị loading khi đang xử lý export
      const loadingToast = toast.loading('Đang xuất file Excel...');
      
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
      saveAs(data, `evm-orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      // Đóng loading và hiển thị thành công
      toast.dismiss(loadingToast);
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

  // Hiển thị access denied nếu không phải EVM Staff
  if (userRole !== 'EVM_STAFF' && userRole !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Truy cập bị từ chối</h2>
          <p className="text-red-600">
            Bạn không có quyền truy cập trang Quản lý Đơn hàng EVM. 
            Chỉ EVM_STAFF mới có quyền truy cập trang này.
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
          onCreateClick={undefined}
          onViewClick={handleView}
          onEditClick={undefined}
          onDeleteClick={undefined}
          onExportClick={handleExport} // Cho phép EVM Staff export
          userRole={userRole || "EVM_STAFF"}
          pagination={{
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          }}
          onPageChange={handlePageChange}
          statistics={null}
          onStatusChange={handleStatusChange}
          showCreateButton={false}
          showExportButton={true} // Cho phép hiển thị nút export
          showEditButton={false}
          showDeleteButton={false}
        />

        {showDetailModal && (
          <DealerOrderDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setViewingOrder(null);
            }}
            order={viewingOrder}
            onStatusChange={handleStatusChange}
            onEditClick={undefined}
            userRole={userRole || "EVM_STAFF"}
          />
        )}
      </div>
    </>
  );
}