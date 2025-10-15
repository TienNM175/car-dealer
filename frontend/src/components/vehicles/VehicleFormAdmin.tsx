// frontend/src/components/vehicles/VehicleFormAdmin.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  Move,
  Plus,
  Car,
  DollarSign,
  Battery,
  Zap,
  Gauge,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Vehicle, vehicleApi } from "@/lib/api/vehicleApi";

interface VehicleFormAdminProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (vehicle: any) => void;
  vehicle?: Vehicle | null; // For editing
}

interface ImageFile {
  id?: string; // for existing images
  file?: File; // for new uploads
  url: string;
  isMain: boolean;
  order: number;
  publicId?: string;
}

interface FormData {
  manufacturerId: string;
  model: string;
  variant: string;
  year: number;
  batteryCapacity: number;
  range: number;
  chargingTime: number;
  motorPower: number;
  topSpeed: number;
  acceleration: number;
  seats: number;
  doors: number;
  color: string;
  bodyType: string;
  wholesalePrice: number;
  retailPrice: number;
  currency: string;
  status: string;
  description: string;
  specifications: string;
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

export default function VehicleFormAdmin({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
}: VehicleFormAdminProps) {
  const [loading, setLoading] = useState(false);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState<FormData>({
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
    currency: "USD",
    status: "ACTIVE",
    description: "",
    specifications: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchManufacturers();
      if (vehicle) {
        // Edit mode - populate form
        setFormData({
          manufacturerId: vehicle.manufacturerId || "",
          model: vehicle.model || "",
          variant: vehicle.variant || "",
          year: vehicle.year || new Date().getFullYear(),
          batteryCapacity: vehicle.batteryCapacity || 0,
          range: vehicle.range || 0,
          chargingTime: vehicle.chargingTime || 0,
          motorPower: vehicle.motorPower || 0,
          topSpeed: vehicle.topSpeed || 0,
          acceleration: vehicle.acceleration || 0,
          seats: vehicle.seats || 5,
          doors: vehicle.doors || 4,
          color: vehicle.color || "WHITE",
          bodyType: vehicle.bodyType || "SUV",
          wholesalePrice: Number(vehicle.wholesalePrice || 0),
          retailPrice: Number(vehicle.retailPrice || 0),
          currency: vehicle.currency || "USD",
          status: vehicle.status || "ACTIVE",
          description: vehicle.description || "",
          specifications: vehicle.specifications || "",
        });

        // Load existing images
        if (vehicle.images) {
          setImages(
            vehicle.images.map((img, index) => ({
              id: img.id,
              url: img.url,
              isMain: img.isMain,
              order: img.order || index,
              publicId: img.publicId,
            }))
          );
        }
      } else {
        // Create mode - reset form
        resetForm();
      }
    }
  }, [isOpen, vehicle]);

  const fetchManufacturers = async () => {
    try {
      // Mock manufacturers - replace with actual API call
      setManufacturers([
        { id: "1", name: "VinFast", code: "VF" },
        { id: "2", name: "Tesla", code: "TSLA" },
        { id: "3", name: "BYD", code: "BYD" },
        { id: "4", name: "NIO", code: "NIO" },
      ]);
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
    }
  };

  const resetForm = () => {
    setFormData({
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
      currency: "USD",
      status: "ACTIVE",
      description: "",
      specifications: "",
    });
    setImages([]);
    setErrors({});
  };

  const handleImageUpload = useCallback(
    (files: FileList) => {
      const newImages: ImageFile[] = [];

      Array.from(files).forEach((file, index) => {
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          newImages.push({
            file,
            url,
            isMain: images.length === 0 && index === 0, // First image of empty list becomes main
            order: images.length + index,
          });
        }
      });

      setImages((prev) => [...prev, ...newImages]);
    },
    [images.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = e.dataTransfer.files;
      handleImageUpload(files);
    },
    [handleImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    if (imageToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    const newImages = images.filter((_, i) => i !== index);

    // If removed image was main, set first image as main
    if (imageToRemove.isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }

    setImages(newImages);
  };

  const setMainImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    setImages(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);

    // Update order
    newImages.forEach((img, index) => {
      img.order = index;
    });

    setImages(newImages);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.manufacturerId)
      newErrors.manufacturerId = "Vui lòng chọn hãng xe";
    if (!formData.model.trim()) newErrors.model = "Vui lòng nhập tên mẫu xe";
    if (formData.year < 2020 || formData.year > new Date().getFullYear() + 2) {
      newErrors.year = "Năm sản xuất không hợp lệ";
    }
    if (formData.batteryCapacity <= 0)
      newErrors.batteryCapacity = "Dung lượng pin phải lớn hơn 0";
    if (formData.range <= 0)
      newErrors.range = "Phạm vi hoạt động phải lớn hơn 0";
    if (formData.wholesalePrice <= 0)
      newErrors.wholesalePrice = "Giá sỉ phải lớn hơn 0";
    if (formData.retailPrice <= 0)
      newErrors.retailPrice = "Giá bán lẻ phải lớn hơn 0";
    if (formData.retailPrice <= formData.wholesalePrice) {
      newErrors.retailPrice = "Giá bán lẻ phải lớn hơn giá sỉ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let vehicleResult;

      if (vehicle) {
        // Update existing vehicle
        vehicleResult = await vehicleApi.updateVehicle(vehicle.id, formData);
      } else {
        // Create new vehicle
        vehicleResult = await vehicleApi.createVehicle(formData);
      }

      // Upload images if any
      const newImageFiles = images.filter((img) => img.file);
      if (newImageFiles.length > 0) {
        const imageFormData = new FormData();
        newImageFiles.forEach((img) => {
          if (img.file) {
            imageFormData.append("images", img.file);
          }
        });

        await vehicleApi.uploadImages(vehicleResult.data.id, imageFormData);
      }

      onSuccess(vehicleResult.data);
      onClose();
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      setErrors({ general: error.response?.data?.message || "Có lỗi xảy ra" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {vehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: "basic", label: "Thông tin cơ bản", icon: Car },
                { id: "specs", label: "Thông số kỹ thuật", icon: Battery },
                { id: "pricing", label: "Giá bán", icon: DollarSign },
                { id: "images", label: "Hình ảnh", icon: ImageIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manufacturer */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hãng xe *
                  </label>
                  <select
                    value={formData.manufacturerId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        manufacturerId: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="">Chọn hãng xe</option>
                    {manufacturers.map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </option>
                    ))}
                  </select>
                  {errors.manufacturerId && (
                    <p className="text-red-500 text-sm">
                      {errors.manufacturerId}
                    </p>
                  )}
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tên mẫu xe *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        model: e.target.value,
                      }))
                    }
                    placeholder="VF 8, Model S, BYD Tang..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.model && (
                    <p className="text-red-500 text-sm">{errors.model}</p>
                  )}
                </div>

                {/* Variant */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Phiên bản
                  </label>
                  <input
                    type="text"
                    value={formData.variant}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        variant: e.target.value,
                      }))
                    }
                    placeholder="Plus, Premium, Performance..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {/* Year */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Năm sản xuất *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        year: Number(e.target.value),
                      }))
                    }
                    min="2020"
                    max={new Date().getFullYear() + 2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.year && (
                    <p className="text-red-500 text-sm">{errors.year}</p>
                  )}
                </div>

                {/* Body Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kiểu dáng *
                  </label>
                  <select
                    value={formData.bodyType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bodyType: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    {Object.entries(bodyTypeConfig).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Màu sắc *
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    {Object.entries(colorConfig).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seats */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Số ghế
                  </label>
                  <select
                    value={formData.seats}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seats: Number(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    {[2, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} chỗ
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doors */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Số cửa
                  </label>
                  <select
                    value={formData.doors}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        doors: Number(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    {[2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} cửa
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả về xe..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>
          )}

          {/* Specs Tab */}
          {activeTab === "specs" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Battery className="w-5 h-5 text-green-600" />
                Thông số kỹ thuật
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Battery Capacity */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Battery className="w-4 h-4 inline mr-2 text-green-600" />
                    Dung lượng pin (kWh) *
                  </label>
                  <input
                    type="number"
                    value={formData.batteryCapacity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        batteryCapacity: Number(e.target.value),
                      }))
                    }
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.batteryCapacity && (
                    <p className="text-red-500 text-sm">
                      {errors.batteryCapacity}
                    </p>
                  )}
                </div>

                {/* Range */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Zap className="w-4 h-4 inline mr-2 text-yellow-600" />
                    Phạm vi hoạt động (km) *
                  </label>
                  <input
                    type="number"
                    value={formData.range}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        range: Number(e.target.value),
                      }))
                    }
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.range && (
                    <p className="text-red-500 text-sm">{errors.range}</p>
                  )}
                </div>

                {/* Charging Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Thời gian sạc (phút)
                  </label>
                  <input
                    type="number"
                    value={formData.chargingTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        chargingTime: Number(e.target.value),
                      }))
                    }
                    min="0"
                    placeholder="0-80% sạc nhanh"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {/* Motor Power */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Gauge className="w-4 h-4 inline mr-2 text-red-600" />
                    Công suất động cơ (kW)
                  </label>
                  <input
                    type="number"
                    value={formData.motorPower}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        motorPower: Number(e.target.value),
                      }))
                    }
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {/* Top Speed */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tốc độ tối đa (km/h)
                  </label>
                  <input
                    type="number"
                    value={formData.topSpeed}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        topSpeed: Number(e.target.value),
                      }))
                    }
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {/* Acceleration */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Gia tốc 0-100 km/h (giây)
                  </label>
                  <input
                    type="number"
                    value={formData.acceleration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        acceleration: Number(e.target.value),
                      }))
                    }
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Thông số kỹ thuật chi tiết
                </label>
                <textarea
                  value={formData.specifications}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specifications: e.target.value,
                    }))
                  }
                  placeholder="Thông số kỹ thuật chi tiết (JSON format hoặc text)..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Thông tin giá bán
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Currency */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Đơn vị tiền tệ *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="VND">VND (₫)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                {/* Wholesale Price */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Giá sỉ *
                  </label>
                  <input
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        wholesalePrice: Number(e.target.value),
                      }))
                    }
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.wholesalePrice && (
                    <p className="text-red-500 text-sm">
                      {errors.wholesalePrice}
                    </p>
                  )}
                </div>

                {/* Retail Price */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Giá bán lẻ *
                  </label>
                  <input
                    type="number"
                    value={formData.retailPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        retailPrice: Number(e.target.value),
                      }))
                    }
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  {errors.retailPrice && (
                    <p className="text-red-500 text-sm">{errors.retailPrice}</p>
                  )}
                </div>
              </div>

              {/* Profit Margin */}
              {formData.wholesalePrice > 0 && formData.retailPrice > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">
                    Thông tin lợi nhuận
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Chênh lệch:</span>
                      <p className="font-bold text-green-800">
                        {(
                          formData.retailPrice - formData.wholesalePrice
                        ).toLocaleString()}{" "}
                        {formData.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700">Tỷ lệ lợi nhuận:</span>
                      <p className="font-bold text-green-800">
                        {(
                          ((formData.retailPrice - formData.wholesalePrice) /
                            formData.wholesalePrice) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700">Margin:</span>
                      <p className="font-bold text-green-800">
                        {(
                          ((formData.retailPrice - formData.wholesalePrice) /
                            formData.retailPrice) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Trạng thái bán hàng *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                >
                  {Object.entries(statusConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === "images" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                Quản lý hình ảnh
              </h3>

              {/* Image Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Kéo thả ảnh vào đây hoặc
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files && handleImageUpload(e.target.files)
                  }
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Chọn ảnh
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, WEBP tối đa 10MB mỗi ảnh
                </p>
              </div>

              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative group bg-gray-100 rounded-lg overflow-hidden aspect-square ${
                        image.isMain ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Vehicle image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity duration-200">
                          {!image.isMain && (
                            <button
                              type="button"
                              onClick={() => setMainImage(index)}
                              className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                              title="Đặt làm ảnh chính"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Main Badge */}
                      {image.isMain && (
                        <div className="absolute top-2 left-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium">
                            <Star className="w-3 h-3" />
                            Chính
                          </div>
                        </div>
                      )}

                      {/* Order */}
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-black bg-opacity-70 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {vehicle ? "Cập nhật xe" : "Thêm xe mới"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
