// frontend/src/components/vehicles/VehicleDetailModal.tsx
"use client";
import React, { useState } from "react";
import {
  X,
  Car,
  Battery,
  Zap,
  Gauge,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Package,
  Eye,
  Edit,
  Trash2,
  Building,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Clock,
  Wind,
  Wrench,
  Info,
} from "lucide-react";
import { Vehicle } from "@/lib/api/vehicleApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onEditClick?: (vehicle: Vehicle) => void;
  onDeleteClick?: (vehicle: Vehicle) => void;
  userRole?: "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN";
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

const colorConfig: Record<string, string> = {
  WHITE: "Trắng",
  BLACK: "Đen",
  SILVER: "Bạc",
  GREY: "Xám",
  GRAY: "Xám",
  RED: "Đỏ",
  BLUE: "Xanh dương",
  GREEN: "Xanh lá",
  YELLOW: "Vàng",
  ORANGE: "Cam",
  BROWN: "Nâu",
  GOLD: "Vàng",
  BEIGE: "Be",
  OTHER: "Khác",
};

export default function VehicleDetailModal({
  isOpen,
  onClose,
  vehicle,
  onEditClick,
  onDeleteClick,
  userRole = "DEALER_STAFF",
}: VehicleDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  if (!isOpen || !vehicle) return null;

  const currentStatusConfig =
    statusConfig[vehicle.status as keyof typeof statusConfig];
  const allImages = vehicle.images || [];
  // Hiển thị tối đa 3 ảnh đầu tiên
  const images = allImages.slice(0, 3);
  const currentImage = images[currentImageIndex];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const canEdit = userRole === "EVM_STAFF" || userRole === "ADMIN";
  const canDelete = userRole === "ADMIN";

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - Blue Gradient */}
          <div className="flex items-center justify-between p-4 border-b border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-lg font-bold leading-tight">
                  {vehicle.manufacturer?.name} {vehicle.model}
                </h2>
                {vehicle.variant && (
                  <p className="text-blue-100 text-sm">{vehicle.variant}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-white/30 bg-white/20">
                <span className="text-white font-medium text-sm">
                  {currentStatusConfig?.label}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Large Image Gallery - Full Width */}
            <div className="space-y-3">
              {images.length > 0 ? (
                <>
                  {/* Main Large Image */}
                  <div className="relative">
                    <div
                      className="w-full h-[300px] lg:h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden cursor-pointer shadow-lg border border-gray-200"
                      onClick={() => setIsImageGalleryOpen(true)}
                    >
                      {currentImage?.url ? (
                        <img
                          src={currentImage.url}
                          alt={`${vehicle.manufacturer?.name} ${vehicle.model}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Nếu ảnh lỗi, ẩn ảnh và hiển thị placeholder
                            e.currentTarget.style.display = "none";
                            const placeholder =
                              e.currentTarget.parentElement?.querySelector(
                                ".image-placeholder"
                              );
                            if (placeholder) {
                              (placeholder as HTMLElement).style.display =
                                "flex";
                            }
                          }}
                        />
                      ) : null}

                      {/* Placeholder khi không có ảnh hoặc ảnh lỗi */}
                      <div
                        className="image-placeholder w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
                        style={{ display: currentImage?.url ? "none" : "flex" }}
                      >
                        <div className="text-center">
                          <Car className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                          <p className="text-black font-medium text-lg">
                            Chưa có ảnh
                          </p>
                          <p className="text-gray-600 text-sm mt-2">
                            Hình ảnh xe sẽ được cập nhật sớm
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors shadow-lg"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors shadow-lg"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-full text-sm font-medium">
                        {currentImageIndex + 1} / {images.length}
                        {allImages.length > 3 && (
                          <span className="text-xs opacity-75">
                            {" "}
                            (+{allImages.length - 3})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Click to enlarge hint */}
                    <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-3 py-2 rounded-full text-sm">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Nhấn để phóng to
                    </div>
                  </div>

                  {/* Large Thumbnail Gallery */}
                  {images.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 shadow-md transition-all duration-200 ${
                            index === currentImageIndex
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`${vehicle.manufacturer?.name} ${
                              vehicle.model
                            } ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}

                      {/* Indicator nếu có nhiều hơn 3 ảnh */}
                      {allImages.length > 3 && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 font-medium">
                              +{allImages.length - 3}
                            </p>
                            <p className="text-xs text-gray-400">ảnh khác</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-[300px] lg:h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-lg border border-gray-200">
                  <div className="text-center">
                    <Car className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-black font-medium text-lg">
                      Chưa có ảnh
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      Hình ảnh xe sẽ được cập nhật sớm
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Information Grid - Below Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Basic Info Card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Thông tin cơ bản
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-black font-medium">Hãng xe</p>
                    <p className="font-bold text-lg text-black">
                      {vehicle.manufacturer?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-black font-medium">Model</p>
                    <p className="font-bold text-black">{vehicle.model}</p>
                  </div>
                  {vehicle.variant && (
                    <div>
                      <p className="text-sm text-black font-medium">
                        Phiên bản
                      </p>
                      <p className="font-semibold text-black">
                        {vehicle.variant}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-black font-medium">Năm</p>
                      <p className="font-semibold text-black">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-black font-medium">
                        Kiểu dáng
                      </p>
                      <p className="font-semibold text-black">
                        {bodyTypeConfig[vehicle.bodyType] || vehicle.bodyType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-black font-medium">Màu sắc</p>
                      <p className="font-semibold text-black">
                        {colorConfig[vehicle.color] || vehicle.color}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-black font-medium">Số ghế</p>
                      <p className="font-semibold text-black">
                        {vehicle.seats}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-black font-medium">Số cửa</p>
                      <p className="font-semibold text-black">
                        {vehicle.doors}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specs Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-green-600" />
                  Thông số kỹ thuật
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Battery className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-black font-medium">
                        Dung lượng pin
                      </p>
                      <p className="font-bold text-black">
                        {vehicle.batteryCapacity} kWh
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-black font-medium">
                        Tầm hoạt động
                      </p>
                      <p className="font-bold text-black">{vehicle.range} km</p>
                    </div>
                  </div>
                  {vehicle.motorPower && (
                    <div className="flex items-center gap-3">
                      <Gauge className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm text-black font-medium">
                          Công suất
                        </p>
                        <p className="font-bold text-black">
                          {vehicle.motorPower} kW
                        </p>
                      </div>
                    </div>
                  )}
                  {vehicle.chargingTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-black font-medium">
                          Thời gian sạc
                        </p>
                        <p className="font-bold text-black">
                          {vehicle.chargingTime} phút (0-80%)
                        </p>
                      </div>
                    </div>
                  )}
                  {vehicle.topSpeed && (
                    <div className="flex items-center gap-3">
                      <Wind className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-black font-medium">
                          Tốc độ tối đa
                        </p>
                        <p className="font-bold text-black">
                          {vehicle.topSpeed} km/h
                        </p>
                      </div>
                    </div>
                  )}
                  {vehicle.acceleration && (
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="text-sm text-black font-medium">
                          Gia tốc 0-100km/h
                        </p>
                        <p className="font-bold text-black">
                          {vehicle.acceleration} giây
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-black font-medium">Số chỗ</p>
                      <p className="font-bold text-black">
                        {vehicle.seats} chỗ
                      </p>
                    </div>
                  </div>
                  {vehicle.topSpeed && (
                    <div className="flex items-center gap-3">
                      <Wind className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-black font-medium">
                          Tốc độ tối đa
                        </p>
                        <p className="font-bold text-black">
                          {vehicle.topSpeed} km/h
                        </p>
                      </div>
                    </div>
                  )}
                  {vehicle.acceleration && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-black font-medium">
                          Tăng tốc 0-100km/h
                        </p>
                        <p className="font-bold text-black">
                          {vehicle.acceleration}s
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Giá bán
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-black font-medium">Giá bán lẻ</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatMoney(vehicle.retailPrice, vehicle.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-black font-medium">Giá bán sỉ</p>
                    <p className="text-lg font-bold text-black">
                      {formatMoney(vehicle.wholesalePrice, vehicle.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {(vehicle.description || vehicle.specifications) && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  Thông tin chi tiết
                </h3>
                {vehicle.description && (
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">
                      Mô tả
                    </h4>
                    <p className="text-gray-800 leading-relaxed">
                      {vehicle.description}
                    </p>
                  </div>
                )}
                {vehicle.specifications && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">
                      Thông số kỹ thuật
                    </h4>
                    <pre className="text-gray-800 text-sm bg-gray-50 p-3 rounded-lg overflow-auto whitespace-pre-wrap">
                      {vehicle.specifications}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Business Stats */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Building className="w-5 h-5 text-indigo-600" />
                Thống kê kinh doanh
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-black font-medium">Hợp đồng</p>
                  <p className="text-xl font-bold text-green-600">
                    {vehicle._count?.contracts || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Edit className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-black font-medium">Báo giá</p>
                  <p className="text-xl font-bold text-purple-600">
                    {vehicle._count?.quotations || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-black font-medium">Lái thử</p>
                  <p className="text-xl font-bold text-orange-600">
                    {vehicle._count?.testDrives || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-black font-medium">Đơn đặt hàng</p>
                  <p className="text-xl font-bold text-blue-600">
                    {vehicle._count?.dealerOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-3 text-black font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>

              {canEdit && onEditClick && (
                <button
                  onClick={() => onEditClick(vehicle)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
              )}

              {canDelete && onDeleteClick && (
                <button
                  onClick={() => onDeleteClick(vehicle)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa xe
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Gallery Modal */}
      {isImageGalleryOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-60">
          <div className="relative max-w-7xl max-h-full p-4">
            <button
              onClick={() => setIsImageGalleryOpen(false)}
              className="absolute top-4 right-4 text-white hover:bg-gray-700 rounded-full p-3 z-10 bg-gray-800"
            >
              <X className="w-6 h-6" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-4 rounded-full hover:bg-gray-700 transition-colors z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-4 rounded-full hover:bg-gray-700 transition-colors z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <img
              src={currentImage?.url}
              alt={`${vehicle.manufacturer?.name} ${vehicle.model}`}
              className="max-w-full max-h-full object-contain"
            />

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full">
                {currentImageIndex + 1} / {images.length}
                {allImages.length > 3 && (
                  <span className="text-sm opacity-75">
                    {" "}
                    (+{allImages.length - 3} ảnh khác)
                  </span>
                )}
              </div>
            )}

            {/* Vehicle name overlay */}
            <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg">
              <p className="font-semibold">
                {vehicle.manufacturer?.name} {vehicle.model}
              </p>
              {vehicle.variant && (
                <p className="text-sm opacity-80">{vehicle.variant}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
