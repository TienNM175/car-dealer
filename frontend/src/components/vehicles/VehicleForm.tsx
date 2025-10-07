// frontend/src/components/vehicles/VehicleForm.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
} from "@/lib/api/vehicleApi";

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSave: (data: CreateVehicleInput | UpdateVehicleInput) => Promise<void>;
}

const statusConfig = {
  ACTIVE: "Đang bán",
  INACTIVE: "Ngừng bán",
  OUT_OF_STOCK: "Hết hàng",
};

const bodyTypeConfig = {
  SEDAN: "Sedan",
  SUV: "SUV",
  HATCHBACK: "Hatchback",
  COUPE: "Coupe",
  WAGON: "Wagon",
  VAN: "Van",
  TRUCK: "Truck",
  OTHER: "Khác",
};

const colorConfig = {
  BLACK: "Đen",
  WHITE: "Trắng",
  SILVER: "Bạc",
  GREY: "Xám",
  RED: "Đỏ",
  BLUE: "Xanh dương",
  GREEN: "Xanh lá",
  YELLOW: "Vàng",
  ORANGE: "Cam",
  BROWN: "Nâu",
  GOLD: "Vàng kim",
  BEIGE: "Be",
  OTHER: "Khác",
};

export default function VehicleForm({
  vehicle,
  onClose,
  onSave,
}: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateVehicleInput>({
    manufacturerId: "",
    model: "",
    variant: "",
    year: new Date().getFullYear(),
    batteryCapacity: 0,
    range: 0,
    chargingTime: 0,
    motorPower: 0,
    topSpeed: 0,
    acceleration: 0,
    seats: 5,
    doors: 4,
    color: "WHITE",
    bodyType: "SUV",
    wholesalePrice: 0,
    retailPrice: 0,
    currency: "VND",
    status: "ACTIVE",
    description: "",
    specifications: "",
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        manufacturerId: vehicle.manufacturerId,
        model: vehicle.model,
        variant: vehicle.variant || "",
        year: vehicle.year,
        batteryCapacity: vehicle.batteryCapacity,
        range: vehicle.range,
        chargingTime: vehicle.chargingTime || 0,
        motorPower: vehicle.motorPower || 0,
        topSpeed: vehicle.topSpeed || 0,
        acceleration: vehicle.acceleration || 0,
        seats: vehicle.seats,
        doors: vehicle.doors,
        color: vehicle.color,
        bodyType: vehicle.bodyType,
        wholesalePrice: vehicle.wholesalePrice,
        retailPrice: vehicle.retailPrice,
        currency: vehicle.currency,
        status: vehicle.status,
        description: vehicle.description || "",
        specifications: vehicle.specifications || "",
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-black">
            {vehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin cơ bản
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phiên bản
                </label>
                <input
                  type="text"
                  value={formData.variant}
                  onChange={(e) =>
                    setFormData({ ...formData, variant: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Năm sản xuất <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={2020}
                  max={2030}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kiểu dáng <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bodyType}
                  onChange={(e) =>
                    setFormData({ ...formData, bodyType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  {Object.entries(bodyTypeConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu sắc <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  {Object.entries(colorConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  {Object.entries(statusConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Thông số kỹ thuật
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dung lượng pin (kWh) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.batteryCapacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batteryCapacity: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phạm vi (km) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.range}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      range: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian sạc (phút)
                </label>
                <input
                  type="number"
                  value={formData.chargingTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chargingTime: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Công suất động cơ (kW)
                </label>
                <input
                  type="number"
                  value={formData.motorPower}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      motorPower: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tốc độ tối đa (km/h)
                </label>
                <input
                  type="number"
                  value={formData.topSpeed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      topSpeed: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tăng tốc 0-100 (giây)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.acceleration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acceleration: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ghế <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seats: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={2}
                  max={9}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số cửa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.doors}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      doors: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={2}
                  max={5}
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Giá bán
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá sỉ (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.wholesalePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wholesalePrice: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá bán lẻ (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.retailPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retailPrice: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={0}
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Mô tả</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-sm hover:bg-red-400 bg-red-500 text-black"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : vehicle ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
