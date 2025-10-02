'use client'
import React from 'react';
import { Plus, Eye, Edit } from 'lucide-react';

export default function OrdersPage() {
  const mockOrders = [
    { id: 'ORD001', dealer: 'Đại lý Hà Nội', vehicle: 'VF e34', quantity: 5, status: 'confirmed', createdAt: '2024-10-01', user: 'Nhân viên A' },
    { id: 'ORD002', dealer: 'Đại lý TP.HCM', vehicle: 'VF 8', quantity: 3, status: 'pending', createdAt: '2024-10-02', user: 'Nhân viên B' },
    { id: 'ORD003', dealer: 'Đại lý Đà Nẵng', vehicle: 'VF 9', quantity: 2, status: 'shipped', createdAt: '2024-09-28', user: 'Nhân viên C' },
  ];

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      shipped: 'bg-blue-100 text-blue-700',
      delivered: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: 'Đã xác nhận',
      pending: 'Chờ xử lý',
      shipped: 'Đã giao hàng',
      delivered: 'Hoàn tất',
      cancelled: 'Đã hủy'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Đơn đặt xe</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo đơn đặt xe
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đại lý</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 text-black">
                  <td className="px-6 py-4 font-semibold text-blue-600">{order.id}</td>
                  <td className="px-6 py-4">{order.dealer}</td>
                  <td className="px-6 py-4 font-medium">{order.vehicle}</td>
                  <td className="px-6 py-4 font-semibold">{order.quantity} xe</td>
                  <td className="px-6 py-4 text-sm">{order.user}</td>
                  <td className="px-6 py-4 text-sm">{order.createdAt}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button aria-label="Xem chi tiết" className="text-blue-600 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button aria-label="Chỉnh sửa" className="text-green-600 hover:text-green-700">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
