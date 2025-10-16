"use client";
import React from "react";
import {
  X,
  Car,
  Battery,
  Zap,
  Gauge,
  Users,
  DollarSign,
  Calendar,
  Globe,
  Info,
  FileText,
} from "lucide-react";
import { Vehicle } from "@/lib/api/vehicleApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onCreateContract?: (vehicle: Vehicle) => void; // New prop
}

export default function VehicleDetailModal({
  isOpen,
  onClose,
  vehicle,
  onCreateContract,
}: VehicleDetailModalProps) {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-700 max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-white">Chi tiết xe điện</h3>
            {onCreateContract && (
              <button
                onClick={() => {
                  onCreateContract(vehicle);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium text-sm"
              >
                <FileText className="w-4 h-4" />
                Tạo hợp đồng
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-1 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 modal-scrollbar">
          {/* Ảnh xe to phía trên */}
          <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl overflow-hidden shadow-lg">
            {vehicle.images?.find((img) => img.isMain) ? (
              <img
                src={vehicle.images.find((img) => img.isMain)?.url}
                alt={`${vehicle.manufacturer?.name} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-24 h-24 text-blue-400" />
              </div>
            )}
          </div>

          {/* Thông tin xe & Hãng */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-3xl font-bold text-gray-900 mb-2">
                  {vehicle.manufacturer?.name} {vehicle.model}
                </h4>
                {vehicle.variant && (
                  <p className="text-xl text-blue-600 font-semibold mb-2">
                    Phiên bản: {vehicle.variant}
                  </p>
                )}
                <div className="flex items-center gap-4 text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Năm {vehicle.year}
                  </span>
                  <span>•</span>
                  <span>{vehicle.bodyType}</span>
                  <span>•</span>
                  <span>{vehicle.color}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">
                    Xuất xứ: {vehicle.manufacturer?.country}
                  </span>
                </div>
              </div>

              <div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    vehicle.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : vehicle.status === "INACTIVE"
                      ? "bg-red-100 text-red-700 border border-red-300"
                      : "bg-orange-100 text-orange-700 border border-orange-300"
                  }`}
                >
                  {vehicle.status === "ACTIVE"
                    ? "✓ Đang bán"
                    : vehicle.status === "INACTIVE"
                    ? "✕ Ngừng bán"
                    : vehicle.status === "OUT_OF_STOCK"
                    ? "⚠ Hết hàng"
                    : vehicle.status}
                </span>
              </div>
            </div>
          </div>

          {/* Thông số kỹ thuật chính */}
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
            <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Thông số kỹ thuật chính
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Battery className="w-5 h-5" />
                  <span className="text-sm font-semibold">Dung lượng pin</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.batteryCapacity} <span className="text-lg">kWh</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Gauge className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    Phạm vi hoạt động
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.range} <span className="text-lg">km</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    Công suất động cơ
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.motorPower || 0} <span className="text-lg">kW</span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-semibold">Số chỗ ngồi</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.seats} <span className="text-lg">chỗ</span>
                </p>
              </div>
            </div>
          </div>

          {/* Giá cả */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 shadow-sm">
            <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Thông tin giá cả
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-emerald-300">
                <span className="text-gray-600 text-sm block mb-1">
                  Giá bán lẻ (dành cho khách hàng)
                </span>
                <span className="text-3xl font-bold text-emerald-600">
                  {formatMoney(vehicle.retailPrice, vehicle.currency)}
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-300">
                <span className="text-gray-600 text-sm block mb-1">
                  Giá sỉ (dành cho đại lý)
                </span>
                <span className="text-3xl font-bold text-blue-600">
                  {formatMoney(vehicle.wholesalePrice, vehicle.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Chi tiết cấu hình & Tính năng */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              Cấu hình & Tính năng chi tiết
            </h5>

            <div className="space-y-6">
              {/* Thiết kế & Ngoại thất */}
              <div>
                <h6 className="font-semibold text-gray-700 mb-3 text-sm bg-gray-100 px-3 py-2 rounded">
                  🚗 THIẾT KẾ & NGOẠI THẤT
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pl-3">
                  <div>
                    <span className="text-gray-500">Kiểu dáng:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.bodyType}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Màu sắc:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.color || "Đa dạng"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Số cửa:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.doors} cửa
                    </p>
                  </div>
                </div>
              </div>

              {/* Động cơ & Hiệu suất */}
              <div>
                <h6 className="font-semibold text-gray-700 mb-3 text-sm bg-gray-100 px-3 py-2 rounded">
                  ⚡ ĐỘNG CƠ & HIỆU SUẤT
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pl-3">
                  <div>
                    <span className="text-gray-500">Công suất tối đa:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.motorPower || 0} kW (
                      {Math.round((vehicle.motorPower || 0) * 1.341)} HP)
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tốc độ tối đa:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.topSpeed} km/h
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tăng tốc 0-100 km/h:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.acceleration} giây
                    </p>
                  </div>
                </div>
              </div>

              {/* Pin & Sạc điện */}
              <div>
                <h6 className="font-semibold text-gray-700 mb-3 text-sm bg-gray-100 px-3 py-2 rounded">
                  🔋 PIN & SẠC ĐIỆN
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pl-3">
                  <div>
                    <span className="text-gray-500">Dung lượng pin:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.batteryCapacity} kWh
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      Quãng đường di chuyển:
                    </span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.range} km (đầy pin)
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Thời gian sạc nhanh:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.chargingTime} phút (80%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Nội thất & Tiện nghi */}
              <div>
                <h6 className="font-semibold text-gray-700 mb-3 text-sm bg-gray-100 px-3 py-2 rounded">
                  🪑 NỘI THẤT & TIỆN NGHI
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pl-3">
                  <div>
                    <span className="text-gray-500">Số ghế ngồi:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.seats} chỗ
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Chất liệu nội thất:</span>
                    <p className="font-semibold text-gray-900">Cao cấp</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Điều hòa:</span>
                    <p className="font-semibold text-gray-900">
                      Tự động đa vùng
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin hãng xe */}
              <div>
                <h6 className="font-semibold text-gray-700 mb-3 text-sm bg-gray-100 px-3 py-2 rounded">
                  🏭 THÔNG TIN HÃNG XE
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm pl-3">
                  <div>
                    <span className="text-gray-500">Hãng sản xuất:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.manufacturer?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Quốc gia:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.manufacturer?.country}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Năm sản xuất:</span>
                    <p className="font-semibold text-gray-900">
                      {vehicle.year}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mô tả chi tiết */}
          {vehicle.description && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h5 className="text-lg font-bold text-gray-800 mb-3">
                📝 Mô tả sản phẩm
              </h5>
              <p className="text-gray-700 leading-relaxed">
                {vehicle.description}
              </p>
            </div>
          )}

          {/* Thông số kỹ thuật đầy đủ */}
          {vehicle.specifications && (
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h5 className="text-lg font-bold text-gray-800 mb-3">
                📋 Thông số kỹ thuật đầy đủ
              </h5>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {vehicle.specifications}
              </p>
            </div>
          )}

          {/* Thông tin thống kê */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
            <h5 className="text-lg font-bold text-gray-800 mb-4">
              📊 Thống kê hoạt động
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg text-center border border-indigo-200">
                <p className="text-3xl font-bold text-blue-600">
                  {vehicle._count?.dealerInventories || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Tại đại lý</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center border border-indigo-200">
                <p className="text-3xl font-bold text-green-600">
                  {vehicle._count?.contracts || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Hợp đồng</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center border border-indigo-200">
                <p className="text-3xl font-bold text-purple-600">
                  {vehicle._count?.testDrives || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Lái thử</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center border border-indigo-200">
                <p className="text-3xl font-bold text-orange-600">
                  {vehicle._count?.quotations || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Báo giá</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center border border-indigo-200">
                <p className="text-3xl font-bold text-teal-600">
                  {vehicle._count?.dealerOrders || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Đơn đặt hàng</p>
              </div>
              <div className="bg-white p-4 rounded-lg text-center border border-indigo-200">
                <p className="text-3xl font-bold text-indigo-600">
                  {vehicle._count?.evmInventories || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">Tồn kho EVM</p>
              </div>
            </div>
          </div>

          {/* Ngày tạo */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>
              Ngày tạo:{" "}
              {new Date(vehicle.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
