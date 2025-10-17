'use client';
import React from 'react';
import { X, Edit, Truck, Package, CheckCircle, Clock, Ban } from 'lucide-react';
import { DealerOrder } from '@/lib/api/dealerOrderApi';

interface DealerOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: DealerOrder | null;
  onStatusChange: (orderId: string, status: DealerOrder['status']) => void;
  onEditClick: (order: DealerOrder) => void;
  userRole: string;
}

const statusConfig = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-700', icon: Package },
  SHIPPED: { label: 'Đang giao', color: 'bg-orange-100 text-orange-700', icon: Truck },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: Ban },
};

const statusFlow = [
  'PENDING',
  'CONFIRMED', 
  'PROCESSING',
  'SHIPPED',
  'DELIVERED'
];

export default function DealerOrderDetailModal({
  isOpen,
  onClose,
  order,
  onStatusChange,
  onEditClick,
  userRole,
}: DealerOrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNextStatus = (currentStatus: DealerOrder['status']): DealerOrder['status'] | null => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] as DealerOrder['status'] : null;
  };

  const canEdit = userRole === 'DEALER_MANAGER' && order.status === 'PENDING';
  const nextStatus = getNextStatus(order.status);
  const canUpdateStatus = userRole === 'DEALER_MANAGER' && nextStatus && order.status !== 'CANCELLED';

  const StatusIcon = statusConfig[order.status].icon;
  const statusColorClass = statusConfig[order.status].color;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${statusColorClass.replace('bg-', 'text-').split(' ')[0]}`} />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Chi tiết đơn hàng
              </h2>
              <p className="text-gray-600">{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  onEditClick(order);
                  onClose();
                }}
                className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full ${statusColorClass}`}
            >
              <StatusIcon className="w-4 h-4" />
              {statusConfig[order.status].label}
            </span>
            
            {canUpdateStatus && nextStatus && (
              <button
                onClick={() => onStatusChange(order.id, nextStatus)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Chuyển sang {statusConfig[nextStatus].label}
              </button>
            )}
          </div>

          {/* Order Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Lịch sử đơn hàng</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Đơn hàng được tạo</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              
              {order.orderedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đã đặt hàng</p>
                    <p className="text-sm text-gray-500">{formatDate(order.orderedAt)}</p>
                  </div>
                </div>
              )}
              
              {order.confirmedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đã xác nhận</p>
                    <p className="text-sm text-gray-500">{formatDate(order.confirmedAt)}</p>
                  </div>
                </div>
              )}
              
              {order.shippedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đã giao hàng</p>
                    <p className="text-sm text-gray-500">{formatDate(order.shippedAt)}</p>
                  </div>
                </div>
              )}
              
              {order.deliveredAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đã giao thành công</p>
                    <p className="text-sm text-gray-500">{formatDate(order.deliveredAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dealer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Thông tin đại lý</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tên đại lý</label>
                  <p className="text-gray-900">{order.dealer?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mã đại lý</label>
                  <p className="text-gray-900">{order.dealer?.code || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Thành phố</label>
                  <p className="text-gray-900">{order.dealer?.city || 'N/A'}</p>
                </div>
                {order.dealer?.region && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Khu vực</label>
                    <p className="text-gray-900">{order.dealer.region.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Thông tin xe</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Xe</label>
                  <p className="text-gray-900">
                    {order.vehicle?.manufacturer?.name} {order.vehicle?.model} {order.vehicle?.variant}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số lượng</label>
                  <p className="text-gray-900">{order.quantity} xe</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Đơn giá</label>
                  <p className="text-gray-900">{formatCurrency(Number(order.unitPrice))}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tổng tiền</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(Number(order.totalAmount))}</p>
                </div>
              </div>
            </div>

            {/* Staff Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Thông tin người tạo</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ tên</label>
                  <p className="text-gray-900">
                    {order.staff?.firstName} {order.staff?.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{order.staff?.email}</p>
                </div>
              </div>
            </div>

            {/* Order Metadata */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Thông tin đơn hàng</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Mã đơn hàng</label>
                  <p className="text-gray-900 font-mono">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                  <p className="text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                  <p className="text-gray-900">{formatDate(order.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Ghi chú</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}