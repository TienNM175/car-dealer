// frontend/src/components/vehicles/VehicleList.tsx
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
  Car,
  Battery,
  Zap,
  Gauge,
  Users,
  DollarSign,
  Package,
} from "lucide-react";
import { Vehicle } from "@/lib/api/vehicleApi";

interface VehicleListProps {
  vehicles: Vehicle[];
  loading: boolean;
  searchTerm: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onCreateClick: () => void;
  onViewClick: (vehicle: Vehicle) => void;
  onEditClick: (vehicle: Vehicle) => void;
  onDeleteClick: (vehicle: Vehicle) => void;
  onExportClick: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

const statusConfig = {
  ACTIVE: { label: "Đang bán", color: "bg-green-100 text-green-700" },
  INACTIVE: { label: "Ngừng bán", color: "bg-gray-100 text-gray-700" },
  OUT_OF_STOCK: { label: "Hết hàng", color: "bg-red-100 text-red-700" },
};

const bodyTypeConfig: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  HATCHBACK: "Hatchback",
  COUPE: "Coupe",
  WAGON: "Wagon",
  VAN: "Van",
  TRUCK: "Truck",
  OTHER: "Khác",
};

export default function VehicleList({
  vehicles,
  loading,
  searchTerm,
  filterStatus,
  onSearchChange,
  onFilterChange,
  onCreateClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onExportClick,
  pagination,
  onPageChange,
}: VehicleListProps) {
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      total: vehicles.length,
      ACTIVE: 0,
      INACTIVE: 0,
      OUT_OF_STOCK: 0,
    };

    vehicles.forEach((vehicle) => {
      if (counts[vehicle.status] !== undefined) {
        counts[vehicle.status]++;
      }
    });

    return counts;
  }, [vehicles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý xe điện</h2>
          <p className="text-gray-600 mt-1">
            Quản lý danh mục xe điện và thông số kỹ thuật
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
            Thêm xe mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Tổng xe</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Đang bán</p>
          <p className="text-2xl font-bold text-green-600">
            {statusCounts.ACTIVE}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Ngừng bán</p>
          <p className="text-2xl font-bold text-gray-600">
            {statusCounts.INACTIVE}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Hết hàng</p>
          <p className="text-2xl font-bold text-red-600">
            {statusCounts.OUT_OF_STOCK}
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
              placeholder="Tìm kiếm theo tên xe, hãng xe..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterChange(e.target.value)}
            aria-label="Lọc theo trạng thái xe"
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
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Không có xe nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thông số
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hoạt động
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 text-black">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Car className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {vehicle.manufacturer?.name} {vehicle.model}
                          </p>
                          {vehicle.variant && (
                            <p className="text-xs text-gray-500">
                              {vehicle.variant}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {vehicle.year} •{" "}
                            {bodyTypeConfig[vehicle.bodyType] ||
                              vehicle.bodyType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Battery className="w-3 h-3 text-green-600" />
                          <span>{vehicle.batteryCapacity} kWh</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-900">
                          <Zap className="w-3 h-3 text-yellow-600" />
                          <span>{vehicle.range} km</span>
                        </div>
                        {vehicle.motorPower && (
                          <div className="flex items-center gap-1 text-gray-900">
                            <Gauge className="w-3 h-3 text-red-600" />
                            <span>{vehicle.motorPower} kW</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-900">
                          <Users className="w-3 h-3 text-blue-600" />
                          <span>{vehicle.seats} chỗ</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-semibold text-green-600">
                          {vehicle.retailPrice.toLocaleString()}{" "}
                          {vehicle.currency}
                        </p>
                        <p className="text-xs text-gray-500">
                          Giá sỉ: {vehicle.wholesalePrice.toLocaleString()}{" "}
                          {vehicle.currency}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {vehicle._count && (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                              <Package className="w-3 h-3" />
                              {vehicle._count.dealerInventories} kho
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                              <DollarSign className="w-3 h-3" />
                              {vehicle._count.contracts} HĐ
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 w-34">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusConfig[
                            vehicle.status as keyof typeof statusConfig
                          ]?.color || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusConfig[
                          vehicle.status as keyof typeof statusConfig
                        ]?.label || vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => onEditClick(vehicle)}
                          className="text-green-600 hover:text-green-700"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(vehicle)}
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
        {!loading && vehicles.length > 0 && (
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
              <span className="font-medium">{pagination.total}</span> xe
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
