"use client";
import React from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Banknote,
  TestTube,
  MessageSquare,
  AlertTriangle,
  Eye, // 🔹 Thêm import Eye icon
} from "lucide-react";
import { Customer } from "@/lib/api/customerApi";

interface CustomerListProps {
  customers: Customer[];
  loading: boolean;
  searchTerm: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onCreateClick: () => void;
  onViewFeedbacksClick: (customer: Customer) => void;
  onViewComplaintsClick: (customer: Customer) => void;
  onEditClick: (customer: Customer) => void;
  onDeleteClick: (customer: Customer) => void; // ✅ Giữ nguyên, nhưng giờ gọi mở modal
  onExportClick: () => void;
  // 🔹 Thêm prop cho xem chi tiết
  onViewDetailClick: (customer: Customer) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

const statusConfig = {
  INTERESTED: { label: "Quan tâm", color: "bg-blue-100 text-blue-700" },
  CONTACTED: { label: "Đã liên hệ", color: "bg-yellow-100 text-yellow-700" },
  TEST_DRIVE: { label: "Lái thử", color: "bg-purple-100 text-purple-700" },
  QUOTED: { label: "Đã báo giá", color: "bg-orange-100 text-orange-700" },
  PURCHASED: { label: "Đã mua", color: "bg-green-100 text-green-700" },
  COLD: { label: "Từ chối", color: "bg-gray-100 text-gray-700" },
};

export default function CustomerList({
  customers,
  loading,
  searchTerm,
  filterStatus,
  onSearchChange,
  onFilterChange,
  onCreateClick,
  onViewFeedbacksClick,
  onViewComplaintsClick,
  onEditClick,
  onDeleteClick,
  onExportClick,
  // 🔹 Nhận prop xem chi tiết
  onViewDetailClick,
  pagination,
  onPageChange,
}: CustomerListProps) {
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      total: customers.length,
      PURCHASED: 0,
      INTERESTED: 0,
      COLD: 0,
    };
    customers.forEach((customer) => {
      if (counts[customer.status] !== undefined) {
        counts[customer.status]++;
      }
    });
    return counts;
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Quản lý khách hàng
          </h2>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin và tương tác với khách hàng
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExportClick}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất dữ liệu
          </button>
          <button
            onClick={onCreateClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Tổng khách hàng</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Đã mua</p>
          <p className="text-2xl font-bold text-green-600">
            {statusCounts.PURCHASED}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Đang quan tâm</p>
          <p className="text-2xl font-bold text-blue-600">
            {statusCounts.INTERESTED}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Từ chối</p>
          <p className="text-2xl font-bold text-gray-600">
            {statusCounts.COLD}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusConfig).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Đang tải...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Không có khách hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Địa chỉ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Trạng thái
                  </th>
                  {/* ✅ Cột phản hồi riêng */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phản hồi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 text-black">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-blue-600">
                            {customer.firstName[0]}
                            {customer.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            CCCD: {customer.identityCard}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="flex items-center gap-1 text-gray-900">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </p>
                      {customer.phone && (
                        <p className="flex items-center gap-1 text-gray-500 mt-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {customer.city && (
                        <div className="text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{customer.city}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5 w-34">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusConfig[customer.status].color
                        }`}
                      >
                        {statusConfig[customer.status].label}
                      </span>
                    </td>

                    {/* ✅ Cột phản hồi */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-2 items-center">
                        {/* Nút Feedback chỉ hiển thị khi có feedback */}
                        {(customer._count?.feedbacks ?? 0) > 0 && (
                          <button
                            onClick={() => onViewFeedbacksClick(customer)}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                            title="Xem Feedbacks"
                          >
                            <MessageSquare className="w-4 h-4" /> Feedback
                          </button>
                        )}

                        {/* Nút Khiếu nại chỉ hiển thị khi có complaints */}
                        {(customer._count?.complaints ?? 0) > 0 && (
                          <button
                            onClick={() => onViewComplaintsClick(customer)}
                            className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1 text-sm"
                            title="Xem Khiếu nại"
                          >
                            <AlertTriangle className="w-4 h-4" /> Khiếu nại
                          </button>
                        )}

                        {/* Hiển thị dấu “—” nếu không có feedback hoặc complaints */}
                        {(customer._count?.feedbacks ?? 0) === 0 &&
                          (customer._count?.complaints ?? 0) === 0 && (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                      </div>
                    </td>

                    {/* ✅ Cột hành động riêng */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-3 justify-center">
                        {/* 🔹 Thêm nút xem chi tiết */}
                        <button
                          onClick={() => onViewDetailClick(customer)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditClick(customer)}
                          className="text-green-600 hover:text-green-700"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(customer)} // ✅ Giờ gọi mở modal
                          className="text-red-600 hover:text-red-700"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && customers.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              đến{" "}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              trong tổng số{" "}
              <span className="font-medium">{pagination.total}</span> khách hàng
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange(pageNumber)}
                      className={`px-3 py-1 rounded ${
                        pagination.page === pageNumber
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50 text-black"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }
              )}
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
