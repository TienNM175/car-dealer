// frontend/src/components/vehicles/VehicleForm.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Image, Trash2, Star } from "lucide-react";
import {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
  vehicleApi,
} from "@/lib/api/vehicleApi";

interface Manufacturer {
  id: string;
  name: string;
  code: string;
  country: string;
  logo?: string;
}

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSave: (
    data: CreateVehicleInput | UpdateVehicleInput
  ) => Promise<Vehicle | null | void>;
  onRefresh?: () => void; // New prop to refresh parent list
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
  onRefresh,
}: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitRef = useRef(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(
    vehicle || null
  );
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(true);
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

  // Load manufacturers on component mount
  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        setLoadingManufacturers(true);
        const response = await vehicleApi.getAllManufacturers();
        const manufacturers = response.data?.data || response.data || [];
        setManufacturers(manufacturers);
      } catch (error) {
        console.error("Error fetching manufacturers:", error);
        setError("Không thể tải danh sách hãng xe");
      } finally {
        setLoadingManufacturers(false);
      }
    };

    fetchManufacturers();
  }, []);

  useEffect(() => {
    if (vehicle) {
      setCurrentVehicle(vehicle);
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

    // Prevent double submission with ref
    if (loading || isSubmitting || submitRef.current) {
      console.log("Preventing double submission");
      return;
    }

    submitRef.current = true;
    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.description || formData.description.trim() === "") {
      setError("Vui lòng nhập mô tả chi tiết về xe");
      setLoading(false);
      setIsSubmitting(false);
      submitRef.current = false;
      return;
    }

    try {
      // Save vehicle first and get created vehicle
      const createdVehicle = await onSave(formData);

      // If creating new vehicle and have selected files, upload them
      if (!vehicle && selectedFiles.length > 0 && createdVehicle) {
        setSuccessMessage("Xe đã được tạo thành công! Đang upload ảnh...");
        setShowSuccessPopup(true);

        // Upload images to the newly created vehicle
        try {
          const formData = new FormData();
          selectedFiles.forEach((file) => {
            formData.append("images", file);
          });

          await vehicleApi.uploadImages(createdVehicle.id, formData);

          // Fetch updated vehicle with images
          const updatedVehicleResponse = await vehicleApi.getVehicleById(
            createdVehicle.id
          );
          const updatedVehicle =
            updatedVehicleResponse.data?.data || updatedVehicleResponse.data;

          setSuccessMessage("Hoàn tất! Xe và ảnh đã được tạo thành công.");

          // Update currentVehicle to show images in form
          setCurrentVehicle(updatedVehicle);
          setImageRefreshKey((prev) => prev + 1);

          // Don't close modal yet, let user see the result
          setTimeout(() => {
            setSuccessMessage("");
            setShowSuccessPopup(false);
            onClose(); // Close modal after showing success
            console.log("Calling onRefresh after image upload");
            onRefresh?.(); // Refresh parent list after closing modal
          }, 2000);
          return; // Don't close modal immediately
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          setSuccessMessage(
            "Xe đã tạo thành công, nhưng upload ảnh thất bại. Vui lòng chỉnh sửa xe để upload lại ảnh."
          );
          setTimeout(() => {
            setSuccessMessage("");
            setShowSuccessPopup(false);
            onRefresh?.(); // Refresh parent list
            onClose(); // Close modal even if upload failed
          }, 3000);
          return;
        }
      }

      onClose(); // Close modal
      console.log("Calling onRefresh after vehicle creation");
      onRefresh?.(); // Refresh parent list
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      submitRef.current = false;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      // Check file extension
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      if (!allowedExtensions.includes(fileExtension)) {
        alert(
          `File ${file.name} có extension không được hỗ trợ. Chỉ cho phép: .jpg, .jpeg, .png, .gif, .webp`
        );
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(
          `File ${file.name} có MIME type không được hỗ trợ (${file.type}). Chỉ cho phép: JPG, PNG, GIF, WebP`
        );
        return false;
      }

      if (file.size > maxSize) {
        alert(`File ${file.name} quá lớn. Giới hạn 10MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;

    // Nếu chưa có xe, chỉ hiển thị thông báo
    if (!currentVehicle) {
      setError("Vui lòng tạo xe trước để upload ảnh");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await vehicleApi.uploadImages(
        currentVehicle.id,
        formData
      );
      // Fetch updated vehicle with new images
      const updatedVehicleResponse = await vehicleApi.getVehicleById(
        currentVehicle.id
      );
      const updatedVehicle =
        updatedVehicleResponse.data?.data || updatedVehicleResponse.data;

      setSelectedFiles([]);
      setError(null);

      // Update currentVehicle to show new images
      setCurrentVehicle(updatedVehicle);
      setImageRefreshKey((prev) => prev + 1);

      // Show success message
      const successMsg = `Upload thành công ${selectedFiles.length} ảnh!`;
      setSuccessMessage(successMsg);
      setShowSuccessPopup(true);

      setTimeout(() => {
        setSuccessMessage("");
        setShowSuccessPopup(false);
      }, 3000); // Show popup for 3 seconds

      // Refresh vehicle data to show new images in the form
      try {
        const response = await vehicleApi.getVehicleById(currentVehicle.id);
        const updatedVehicle = response.data?.data || response.data;

        // Only update if we got valid data with images
        if (updatedVehicle && updatedVehicle.images) {
          setCurrentVehicle(updatedVehicle);
          setImageRefreshKey((prev) => prev + 1);
        }
      } catch (err) {
        // Silent error handling
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Upload failed";
      setError(errorMessage);
      alert(`Upload thất bại: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!currentVehicle) return;

    try {
      await vehicleApi.deleteImage(currentVehicle.id, imageId);

      const successMsg = "Xóa ảnh thành công!";
      setSuccessMessage(successMsg);
      setShowSuccessPopup(true);

      setTimeout(() => {
        setSuccessMessage("");
        setShowSuccessPopup(false);
      }, 3000);

      // Refresh vehicle data to show updated images immediately
      try {
        const response = await vehicleApi.getVehicleById(currentVehicle.id);
        const updatedVehicle = response.data?.data || response.data;

        if (updatedVehicle && updatedVehicle.images) {
          setCurrentVehicle(updatedVehicle);
          setImageRefreshKey((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Failed to fetch updated vehicle after delete:", err);
      }
    } catch (error: any) {
      setError(error.message || "Delete failed");
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    if (!currentVehicle) return;

    try {
      await vehicleApi.setMainImage(currentVehicle.id, imageId);

      const successMsg = "Đặt ảnh chính thành công!";
      setSuccessMessage(successMsg);
      setShowSuccessPopup(true);

      setTimeout(() => {
        setSuccessMessage("");
        setShowSuccessPopup(false);
      }, 3000);

      // Refresh vehicle data to show updated main image immediately
      try {
        const response = await vehicleApi.getVehicleById(currentVehicle.id);
        const updatedVehicle = response.data?.data || response.data;

        if (updatedVehicle && updatedVehicle.images) {
          setCurrentVehicle(updatedVehicle);
          setImageRefreshKey((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Failed to fetch updated vehicle after set main:", err);
      }
    } catch (error: any) {
      setError(error.message || "Set main image failed");
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border-2 border-gray-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-scrollbar">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="text-xl font-bold text-white">
            {vehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">Lỗi:</p>
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
                  Hãng xe <span className="text-red-500">*</span>
                </label>
                {loadingManufacturers ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Đang tải hãng xe...
                  </div>
                ) : (
                  <select
                    value={formData.manufacturerId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manufacturerId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    <option value="">Chọn hãng xe</option>
                    {manufacturers.map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name} ({manufacturer.country})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.model || ""}
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
                  value={formData.variant || ""}
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
                  value={formData.year || new Date().getFullYear()}
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
                  value={formData.bodyType || "SUV"}
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
                  value={formData.color || "WHITE"}
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
                  value={formData.status || "ACTIVE"}
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
                <select
                  value={formData.batteryCapacity || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      batteryCapacity: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value={0}>Chọn dung lượng pin</option>
                  <option value={40}>40 kWh</option>
                  <option value={50}>50 kWh</option>
                  <option value={60}>60 kWh</option>
                  <option value={75}>75 kWh</option>
                  <option value={85}>85 kWh</option>
                  <option value={100}>100 kWh</option>
                  <option value={120}>120 kWh</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phạm vi (km) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.range || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      range: parseInt(e.target.value),
                    })
                  }
                  placeholder="Ví dụ: 541, 725"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={100}
                  max={1000}
                  step={1}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Phạm vi hoạt động một lần sạc
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian sạc nhanh (phút)
                </label>
                <select
                  value={formData.chargingTime || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chargingTime: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value={0}>Không xác định</option>
                  <option value={15}>15 phút (0-80%)</option>
                  <option value={20}>20 phút (0-80%)</option>
                  <option value={25}>25 phút (0-80%)</option>
                  <option value={30}>30 phút (0-80%)</option>
                  <option value={35}>35 phút (0-80%)</option>
                  <option value={40}>40 phút (0-80%)</option>
                  <option value={45}>45 phút (0-80%)</option>
                  <option value={60}>60 phút (0-80%)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian sạc từ 0-80% với sạc nhanh DC
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Công suất động cơ (kW)
                </label>
                <select
                  value={formData.motorPower || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      motorPower: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value={0}>Không xác định</option>
                  <option value={100}>100 kW</option>
                  <option value={150}>150 kW</option>
                  <option value={200}>200 kW</option>
                  <option value={250}>250 kW</option>
                  <option value={300}>300 kW</option>
                  <option value={350}>350 kW</option>
                  <option value={400}>400 kW</option>
                  <option value={500}>500 kW</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Công suất tối đa của động cơ điện
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tốc độ tối đa (km/h)
                </label>
                <input
                  type="number"
                  value={formData.topSpeed || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      topSpeed: parseInt(e.target.value),
                    })
                  }
                  placeholder="Ví dụ: 200"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={80}
                  max={350}
                  step={1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tốc độ tối đa có thể đạt được
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tăng tốc 0-100 km/h (giây)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.acceleration || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acceleration: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Ví dụ: 4.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min={2}
                  max={15}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian tăng tốc từ 0-100 km/h
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ghế <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.seats || 5}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      seats: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value={2}>2 ghế</option>
                  <option value={4}>4 ghế</option>
                  <option value={5}>5 ghế</option>
                  <option value={6}>6 ghế</option>
                  <option value={7}>7 ghế</option>
                  <option value={8}>8 ghế</option>
                  <option value={9}>9 ghế</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số cửa <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.doors || 4}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      doors: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value={2}>2 cửa</option>
                  <option value={3}>3 cửa</option>
                  <option value={4}>4 cửa</option>
                  <option value={5}>5 cửa</option>
                </select>
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
                  type="text"
                  value={
                    formData.wholesalePrice
                      ? formData.wholesalePrice.toLocaleString("vi-VN")
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, "");
                    setFormData({
                      ...formData,
                      wholesalePrice: value ? parseFloat(value) : 0,
                    });
                  }}
                  placeholder="Ví dụ: 1,500,000,000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.wholesalePrice
                    ? `${formData.wholesalePrice.toLocaleString("vi-VN")} VNĐ`
                    : ""}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá bán lẻ (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={
                    formData.retailPrice
                      ? formData.retailPrice.toLocaleString("vi-VN")
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, "");
                    setFormData({
                      ...formData,
                      retailPrice: value ? parseFloat(value) : 0,
                    });
                  }}
                  placeholder="Ví dụ: 1,800,000,000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.retailPrice
                    ? `${formData.retailPrice.toLocaleString("vi-VN")} VNĐ`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Mô tả</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                rows={4}
                required
                placeholder="Nhập mô tả chi tiết về xe..."
              />
            </div>
          </div>

          {/* Image Management Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Quản lý hình ảnh
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              {currentVehicle && (
                <p className="text-sm text-gray-600 mb-3">
                  Hiện tại xe có {currentVehicle?.images?.length || 0} hình ảnh
                </p>
              )}

              {/* Upload Section */}
              <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    Chọn ảnh để upload (JPG, PNG, GIF, WebP - tối đa 10MB/ảnh)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Chọn ảnh
                  </label>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Đã chọn {selectedFiles.length} ảnh:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-white px-3 py-1 rounded border"
                        >
                          <span className="text-sm text-gray-700 mr-2">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFiles((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadImages}
                      disabled={uploading || selectedFiles.length === 0}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {uploading
                        ? "Đang upload..."
                        : selectedFiles.length === 0
                        ? "Chọn ảnh trước"
                        : currentVehicle
                        ? "Upload ảnh"
                        : "Ảnh sẽ tự động upload sau khi tạo xe"}
                    </button>
                  </div>
                )}
              </div>

              {/* Existing Images */}
              {currentVehicle &&
              currentVehicle?.images &&
              currentVehicle.images.length > 0 ? (
                <div
                  key={imageRefreshKey}
                  className="grid grid-cols-2 md:grid-cols-3 gap-3"
                >
                  {currentVehicle.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`${currentVehicle.model} ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />

                      {/* Main Image Badge */}
                      {image.isMain && (
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          Chính
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(image.id)}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                            title="Đặt làm ảnh chính"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có hình ảnh nào</p>
                  <p className="text-sm mt-1">Chọn và upload ảnh để hiển thị</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
              disabled={loading || isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 font-medium shadow-lg"
              disabled={loading || isSubmitting}
            >
              {loading ? "Đang xử lý..." : vehicle ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Toast Notification */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white rounded-lg shadow-lg border border-green-200 p-4 flex items-center gap-3 max-w-sm">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
