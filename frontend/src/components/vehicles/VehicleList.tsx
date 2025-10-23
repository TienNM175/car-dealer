// frontend/src/components/vehicles/VehicleList.tsx
"use client";
import React, { useState } from "react";
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
  ChevronDown,
  Grid3X3,
  List,
} from "lucide-react";
import { Vehicle } from "@/lib/api/vehicleApi";
import { formatMoney, formatMoneyShort } from "@/lib/utils/formatMoney";
import VehicleDetailModal from "./VehicleDetailModal";
import VehicleCompareModal from "./VehicleCompareModal";

interface VehicleListProps {
  vehicles: Vehicle[];
  loading: boolean;
  searchTerm: string;
  filters: {
    status: string;
    manufacturer: string;
    bodyType: string;
    priceMin: string;
    priceMax: string;
  };
  onSearchChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onCreateClick?: () => void; // Optional - chỉ EVM/ADMIN
  onViewClick?: (vehicle: Vehicle) => void;
  onEditClick?: (vehicle: Vehicle) => void; // Optional - chỉ EVM/ADMIN
  onDeleteClick?: (vehicle: Vehicle) => void; // Optional - chỉ ADMIN và EVM_STAFF
  onExportClick: () => void;
  onCreateContractFromVehicle?: (vehicle: Vehicle) => void; // New - Tạo hợp đồng từ xe
  userRole?: "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN"; // Role để control UI
  user?: any; // User object để lấy dealerId
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  manufacturers?: { id: string; name: string }[];
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
  filters,
  onSearchChange,
  onFilterChange,
  onCreateClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onExportClick,
  onCreateContractFromVehicle,
  userRole = "DEALER_STAFF", // Default to most restrictive
  pagination,
  onPageChange,
  manufacturers = [],
}: VehicleListProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] =
    useState<Vehicle | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedVehicleForCompare, setSelectedVehicleForCompare] =
    useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
        <div className="flex gap-3 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Nút so sánh xe */}
          <button
            onClick={() => {
              setSelectedVehicleForCompare(null);
              setShowCompareModal(true);
            }}
            className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 flex items-center gap-2"
          >
            <Car className="w-4 h-4" />
            So sánh xe
          </button>

          <button
            onClick={onExportClick}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Xuất dữ liệu
          </button>
          {/* Chỉ EVM_STAFF và ADMIN mới được thêm xe */}
          {(userRole === "EVM_STAFF" || userRole === "ADMIN") &&
            onCreateClick && (
              <button
                onClick={onCreateClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Thêm xe mới
              </button>
            )}
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

      {/* Search + Advanced Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Basic Search */}
        <div className="flex gap-4 mb-4">
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
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
              showAdvancedFilters
                ? "bg-blue-50 text-blue-600 border-blue-300"
                : "text-gray-600 border-gray-300"
            }`}
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
            <ChevronDown
              className={`w-4 h-4 transform transition-transform ${
                showAdvancedFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  {Object.entries(statusConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hãng xe
                </label>
                <select
                  value={filters.manufacturer}
                  onChange={(e) =>
                    onFilterChange("manufacturer", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                >
                  <option value="">Tất cả hãng</option>
                  {manufacturers.map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Body Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kiểu dáng
                </label>
                <select
                  value={filters.bodyType}
                  onChange={(e) => onFilterChange("bodyType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                >
                  <option value="">Tất cả kiểu dáng</option>
                  {Object.entries(bodyTypeConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Min Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá từ (USD)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.priceMin}
                  onChange={(e) => onFilterChange("priceMin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                />
              </div>

              {/* Price Max Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá đến (USD)
                </label>
                <input
                  type="number"
                  placeholder="999999"
                  value={filters.priceMax}
                  onChange={(e) => onFilterChange("priceMax", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-3 pt-2 border-t">
              <button
                onClick={() => {
                  onFilterChange("status", "");
                  onFilterChange("manufacturer", "");
                  onFilterChange("bodyType", "");
                  onFilterChange("priceMin", "");
                  onFilterChange("priceMax", "");
                  onSearchChange("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Vehicle Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Đang tải...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Không có xe nào</p>
          </div>
        ) : viewMode === "list" ? (
          // List View
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                    Xe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Thông số
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
                    Giá
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Kinh doanh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 text-black">
                    <td className="px-4 py-4 w-48">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img
                              src={
                                vehicle.images.find((img) => img.isMain)?.url ||
                                vehicle.images[0].url
                              }
                              alt={`${vehicle.manufacturer?.name} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="w-8 h-8 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {vehicle.manufacturer?.name} {vehicle.model}
                          </p>
                          {vehicle.variant && (
                            <p className="text-xs text-gray-500 truncate">
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
                    <td className="px-4 py-4 w-32">
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
                    <td className="px-4 py-4 w-40">
                      <div className="text-sm">
                        <p className="font-semibold text-green-600">
                          {formatMoney(vehicle.retailPrice, vehicle.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Sỉ:{" "}
                          {formatMoney(
                            vehicle.wholesalePrice,
                            vehicle.currency
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <div className="flex flex-wrap gap-1">
                        {/* Hiển thị thông tin kinh doanh theo role */}
                        {/* EVM/ADMIN: Hiển thị cả EVM và Dealer inventory */}
                        {(userRole === "EVM_STAFF" || userRole === "ADMIN") && (
                          <>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                              <Package className="w-3 h-3" />
                              {vehicle.evmInventories?.quantity || 0} EVM
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs">
                              <Package className="w-3 h-3" />
                              {vehicle.dealerInventories?.reduce(
                                (sum, inv) => sum + inv.quantity,
                                0
                              ) || 0}{" "}
                              DL
                            </span>
                          </>
                        )}
                        {/* DEALER: Chỉ hiển thị Dealer inventory */}
                        {(userRole === "DEALER_STAFF" ||
                          userRole === "DEALER_MANAGER") && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            <Package className="w-3 h-3" />
                            {vehicle._count?.dealerInventories || 0} kho
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          <DollarSign className="w-3 h-3" />
                          {vehicle._count?.contracts || 0} HĐ
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                          <Edit className="w-3 h-3" />
                          {vehicle._count?.quotations || 0} BG
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                          <Users className="w-3 h-3" />
                          {vehicle._count?.testDrives || 0} LT
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 w-34">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
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
                    <td className="px-2 py-4 w-32">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedVehicleForDetail(vehicle);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {/* Nút so sánh với xe khác */}
                        <button
                          onClick={() => {
                            setSelectedVehicleForCompare(vehicle);
                            setShowCompareModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-700 p-1 rounded hover:bg-purple-50"
                          title="So sánh xe này với xe khác"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </button>
                        {/* Chỉ EVM_STAFF và ADMIN mới được chỉnh sửa */}
                        {(userRole === "EVM_STAFF" || userRole === "ADMIN") &&
                          onEditClick && (
                            <button
                              onClick={() => onEditClick(vehicle)}
                              className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                        {/* ADMIN và EVM_STAFF được xóa */}
                        {(userRole === "ADMIN" || userRole === "EVM_STAFF") &&
                          onDeleteClick && (
                            <button
                              onClick={() => onDeleteClick(vehicle)}
                              className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                              title="Xóa"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg border-2 border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                {/* Vehicle Image */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg overflow-hidden">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <img
                        src={
                          vehicle.images.find((img) => img.isMain)?.url ||
                          vehicle.images[0].url
                        }
                        alt={`${vehicle.manufacturer?.name} ${vehicle.model}`}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-48">
                        <Car className="w-16 h-16 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                        statusConfig[
                          vehicle.status as keyof typeof statusConfig
                        ]?.color || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusConfig[vehicle.status as keyof typeof statusConfig]
                        ?.label || vehicle.status}
                    </span>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <div className="min-h-[3rem]">
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-1">
                      <span className="line-clamp-2 block">
                        {vehicle.manufacturer?.name} {vehicle.model}
                      </span>
                    </h3>
                    {vehicle.variant && (
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="line-clamp-1 block">
                          {vehicle.variant}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {vehicle.year} •{" "}
                      {bodyTypeConfig[vehicle.bodyType] || vehicle.bodyType}
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Battery className="w-3 h-3 text-green-600" />
                      <span>{vehicle.batteryCapacity} kWh</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <Zap className="w-3 h-3 text-yellow-600" />
                      <span>{vehicle.range} km</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <Gauge className="w-3 h-3 text-red-600" />
                      <span>{vehicle.motorPower || "N/A"} kW</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span>{vehicle.seats} chỗ</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="border-t pt-3">
                    <p className="font-bold text-xm text-green-600 leading-tight break-words">
                      {formatMoneyShort(vehicle.retailPrice, vehicle.currency)}
                    </p>
                    <p className="text-xs text-gray-500 break-words">
                      Sỉ:{" "}
                      {formatMoneyShort(
                        vehicle.wholesalePrice,
                        vehicle.currency
                      )}
                    </p>
                  </div>

                  {/* Business Stats */}
                  <div className="border-t pt-3">
                    <div className="flex flex-wrap gap-1">
                      {/* EVM/ADMIN: Hiển thị cả EVM và Dealer inventory */}
                      {(userRole === "EVM_STAFF" || userRole === "ADMIN") && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            <Package className="w-3 h-3" />
                            {vehicle.evmInventories?.quantity || 0} EVM
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs">
                            <Package className="w-3 h-3" />
                            {vehicle.dealerInventories?.reduce(
                              (sum, inv) => sum + inv.quantity,
                              0
                            ) || 0}{" "}
                            DL
                          </span>
                        </>
                      )}
                      {/* DEALER: Chỉ hiển thị Dealer inventory của dealer hiện tại */}
                      {(userRole === "DEALER_STAFF" ||
                        userRole === "DEALER_MANAGER") && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          <Package className="w-3 h-3" />
                          {vehicle.dealerInventories?.reduce(
                            (sum, inv) => sum + inv.quantity,
                            0
                          ) || 0}{" "}
                          kho
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                        <DollarSign className="w-3 h-3" />
                        {vehicle._count?.contracts || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                        <Edit className="w-3 h-3" />
                        {vehicle._count?.quotations || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                        <Users className="w-3 h-3" />
                        {vehicle._count?.testDrives || 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t pt-3">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => {
                          setSelectedVehicleForDetail(vehicle);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedVehicleForCompare(vehicle);
                          setShowCompareModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded hover:bg-purple-50"
                        title="So sánh xe"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </button>

                      {(userRole === "EVM_STAFF" || userRole === "ADMIN") &&
                        onEditClick && (
                          <button
                            onClick={() => onEditClick(vehicle)}
                            className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                      {(userRole === "ADMIN" || userRole === "EVM_STAFF") &&
                        onDeleteClick && (
                          <button
                            onClick={() => onDeleteClick(vehicle)}
                            className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVehicleForDetail(null);
        }}
        vehicle={selectedVehicleForDetail}
        onCreateContract={onCreateContractFromVehicle}
      />

      {/* Vehicle Compare Modal */}
      <VehicleCompareModal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setSelectedVehicleForCompare(null);
        }}
        selectedVehicle={selectedVehicleForCompare}
      />
    </div>
  );
}
