'use client'
import React from 'react';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default function CustomersPage() {
  const mockCustomers = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@email.com', phone: '0901234567', status: 'INTERESTED', bookingDate: '2024-10-05', vehicle: 'VF e34' },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@email.com', phone: '0912345678', status: 'CONTACTED', bookingDate: '2024-10-03', vehicle: 'VF 8' },
    { id: 3, name: 'Lê Văn C', email: 'levanc@email.com', phone: '0923456789', status: 'PURCHASED', bookingDate: '2024-09-28', vehicle: 'VF 9' },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@email.com', phone: '0934567890', status: 'COLD', bookingDate: '2024-09-15', vehicle: 'VF 5' },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      INTERESTED: 'bg-blue-100 text-blue-700',
      CONTACTED: 'bg-yellow-100 text-yellow-700',
      PURCHASED: 'bg-green-100 text-green-700',
      COLD: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      INTERESTED: 'Quan tâm',
      CONTACTED: 'Đã liên hệ',
      PURCHASED: 'Đã mua',
      COLD: 'Lạnh',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Thêm khách hàng
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 text-black">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            aria-label="Lọc theo trạng thái"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
            <option value="">Tất cả trạng thái</option>
            <option value="INTERESTED">Quan tâm</option>
            <option value="CONTACTED">Đã liên hệ</option>
            <option value="PURCHASED">Đã mua</option>
            <option value="COLD">Lạnh</option>
            </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Xe quan tâm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày hẹn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600">{customer.name[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{customer.phone}</p>
                      <p className="text-gray-500">{customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{customer.vehicle}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{customer.bookingDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                      {getStatusLabel(customer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700" aria-label="Xem chi tiết">
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button className="text-green-600 hover:text-green-700" aria-label="Chỉnh sửa">
                        <Edit className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button className="text-red-600 hover:text-red-700" aria-label="Xóa">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
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
