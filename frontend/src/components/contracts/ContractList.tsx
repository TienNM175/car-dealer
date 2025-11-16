// frontend/src/components/contracts/ContractList.tsx
"use client";
import React from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from "lucide-react";
import { Contract } from "@/lib/api/contractApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface ContractListProps {
  contracts: Contract[];
  loading: boolean;
  searchTerm: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onCreateClick?: () => void; // Optional - not available for EVM/ADMIN
  onCreateDepositClick?: () => void; // Tạo HĐ đặt cọc
  onViewClick: (contract: Contract) => void;
  onEditClick?: (contract: Contract) => void; // Optional - not available for EVM/ADMIN
  onDeleteClick: (contract: Contract) => void;
  onExportClick: () => void;
  userRole?: "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN";
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  statistics?: {
    total: number;
    byStatus: {
      DRAFT: number;
      PENDING: number;
      SIGNED: number;
      DELIVERING: number;
      COMPLETED: number;
      CANCELLED: number;
    };
  };
}

const statusConfig = {
  DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-700", icon: Edit },
  PENDING: {
    label: "Chờ ký",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  SIGNED: {
    label: "Đã ký",
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
  },
  DELIVERING: {
    label: "Đang giao xe",
    color: "bg-orange-100 text-orange-700",
    icon: CheckCircle,
  },
  COMPLETED: {
    label: "Hoàn tất",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

const paymentTypeConfig = {
  FULL: { label: "Trả thẳng", color: "bg-green-100 text-green-700" },
  INSTALLMENT: { label: "Trả góp", color: "bg-blue-100 text-blue-700" },
};

export default function ContractList({
  contracts,
  loading,
  searchTerm,
  filterStatus,
  onSearchChange,
  onFilterChange,
  onCreateClick,
  onCreateDepositClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onExportClick,
  userRole = "DEALER_STAFF",
  pagination,
  onPageChange,
  statistics,
}: ContractListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý hợp đồng</h2>
          <p className="text-gray-600 mt-1">
            Quản lý hợp đồng bán xe và thanh toán
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
          {/* Only show Create button if callback is provided */}
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tạo hợp đồng mới
            </button>
          )}
          {onCreateDepositClick && (
            <button
              onClick={onCreateDepositClick}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Tạo HĐ đặt cọc
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Only for DEALER_MANAGER, EVM_STAFF, ADMIN */}
      {statistics && userRole !== "DEALER_STAFF" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Tổng hợp đồng</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.total || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Đã ký</p>
            <p className="text-2xl font-bold text-green-600">
              {statistics.byStatus?.SIGNED || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Chờ duyệt</p>
            <p className="text-2xl font-bold text-yellow-600">
              {statistics.byStatus?.PENDING || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Nháp</p>
            <p className="text-2xl font-bold text-gray-600">
              {statistics.byStatus?.DRAFT || 0}
            </p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo số HĐ, khách hàng..."
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

        {/* Contracts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Đang tải...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Không có hợp đồng nào</p>
          </div>
        ) : (
          <div className="space-y-4 text-black">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">
                          Hợp đồng #{contract.contractCode}
                        </h3>
                        {contract.contractType === "DEPOSIT" && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            Đặt cọc
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Khách hàng:</span>{" "}
                        {contract.customer?.firstName}{" "}
                        {contract.customer?.lastName}
                      </p>
                      {contract.customer?.email && (
                        <p className="text-xs text-gray-500 mt-1">
                          📧 {contract.customer.email}
                        </p>
                      )}
                      {contract.customer?.phone && (
                        <p className="text-xs text-gray-500 mt-1">
                          📞 {contract.customer.phone}
                        </p>
                      )}
                      {contract.customer?.address && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {contract.customer.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      statusConfig[contract.status as keyof typeof statusConfig]
                        ?.color
                    }`}
                  >
                    {React.createElement(
                      statusConfig[contract.status as keyof typeof statusConfig]
                        ?.icon || Clock,
                      { className: "w-4 h-4" }
                    )}
                    <span className="text-sm font-medium">
                      {
                        statusConfig[
                          contract.status as keyof typeof statusConfig
                        ]?.label
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Xe</p>
                    <p className="font-semibold">
                      {contract.vehicle?.manufacturer?.name}{" "}
                      {contract.vehicle?.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Giá gốc</p>
                    <p className="font-semibold">
                      {formatMoney(contract.basePrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Chiết khấu</p>
                    <p className="font-semibold text-red-600">
                      -{formatMoney(contract.discount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Tổng thanh toán
                    </p>
                    <p className="font-bold text-blue-600">
                      {formatMoney(contract.finalPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full ${
                        paymentTypeConfig[contract.paymentType]?.color
                      }`}
                    >
                      {contract.paymentType === "INSTALLMENT" &&
                      contract.installmentMonths
                        ? `Trả góp ${contract.installmentMonths} tháng`
                        : paymentTypeConfig[contract.paymentType]?.label}
                    </span>
                    {contract.signedAt && (
                      <span className="text-gray-600">
                        Ký ngày:{" "}
                        {new Date(contract.signedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewClick(contract)}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                      title="Xem chi tiết"
                    >
                      Xem chi tiết
                    </button>
                    {/* Edit permissions: DEALER_STAFF and DEALER_MANAGER only (DRAFT/PENDING) */}
                    {onEditClick &&
                      (contract.status === "DRAFT" ||
                        contract.status === "PENDING") &&
                      (userRole === "DEALER_STAFF" ||
                        userRole === "DEALER_MANAGER") &&
                      // Ẩn nút chỉnh sửa nếu HĐ đặt cọc đã được chuyển thành HĐ mua
                      !(
                        contract.contractType === "DEPOSIT" &&
                        contract.salesContractId
                      ) && (
                        <button
                          onClick={() => onEditClick(contract)}
                          className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    {/* Delete permissions: DEALER_MANAGER (DRAFT only), EVM_STAFF/ADMIN (all) */}
                    {((userRole === "DEALER_MANAGER" &&
                      contract.status === "DRAFT") ||
                      userRole === "EVM_STAFF" ||
                      userRole === "ADMIN") && (
                      <button
                        onClick={() => onDeleteClick(contract)}
                        className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      title="Tải xuống"
                    >
                      <Download className="w-4 h-4" />
                      Tải xuống
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && contracts.length > 0 && (
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
              <span className="font-medium">{pagination.total}</span> hợp đồng
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
