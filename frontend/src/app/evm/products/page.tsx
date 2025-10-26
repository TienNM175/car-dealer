"use client";
import React, { useEffect, useState } from "react";
import VehicleList from "@/components/vehicles/VehicleList";
import VehicleForm from "@/components/vehicles/VehicleForm";
import {
  Vehicle,
  vehicleApi,
  CreateVehicleInput,
  UpdateVehicleInput,
} from "@/lib/api/vehicleApi";
import { useAuth } from "@/contexts/AuthContext";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ProductsPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Debounce fetchVehicles to prevent multiple calls
  const fetchVehicles = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await vehicleApi.getAllVehicles(
        { search: searchTerm, status: filterStatus },
        { page, limit }
      );

      const responseData = res.data.data || res.data;
      const vehicles = responseData.data || responseData;
      const meta = responseData.meta || res.data.meta;

      setVehicles(Array.isArray(vehicles) ? vehicles : []);
      setTotal(meta?.total || vehicles?.length || 0);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setVehicles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, page, limit]);

  // Debounced refresh function
  const debouncedRefresh = React.useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    const timeout = setTimeout(() => {
      fetchVehicles();
    }, 500); // 500ms debounce
    setRefreshTimeout(timeout);
  }, [fetchVehicles, refreshTimeout]);

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterStatus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refreshTimeout]);

  // Auto-refresh when window gains focus (user returns from another tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchVehicles();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleSave = async (data: CreateVehicleInput | UpdateVehicleInput) => {
    try {
      let createdVehicle: Vehicle | null = null;

      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle.id, data);
        // For editing, close form and refresh immediately
        setShowForm(false);
        setEditingVehicle(null);
        setPage(1);
        fetchVehicles();
      } else {
        const response = await vehicleApi.createVehicle(
          data as CreateVehicleInput
        );
        createdVehicle = response.data?.data || response.data;
        // For new vehicle, don't close form yet - let VehicleForm handle it after image upload
      }

      return createdVehicle; // Return created vehicle for image upload
    } catch (err) {
      console.error("Error saving vehicle:", err);
      throw err;
    }
  };

  // handleView removed - now handled by VehicleList internally

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      await vehicleApi.deleteVehicle(vehicleToDelete.id);

      // Show success message like upload
      const successMsg = `Xóa xe ${vehicleToDelete.model} thành công!`;
      setSuccessMessage(successMsg);
      setShowSuccessPopup(true);

      setTimeout(() => {
        setSuccessMessage("");
        setShowSuccessPopup(false);
      }, 3000);

      // Refresh the list
      fetchVehicles();
    } catch (err: any) {
      console.error("Error deleting vehicle:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi xảy ra khi xóa xe";
      setSuccessMessage(`❌ ${errorMsg}`);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setSuccessMessage("");
        setShowSuccessPopup(false);
      }, 5000); // Show error longer
    } finally {
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setVehicleToDelete(null);
  };

  const handleCreate = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      vehicles.map((v) => ({
        Hãng: v.manufacturer?.name || "",
        Model: v.model,
        "Phiên bản": v.variant || "",
        Năm: v.year,
        "Kiểu dáng": v.bodyType,
        "Pin (kWh)": v.batteryCapacity,
        "Phạm vi (km)": v.range,
        "Công suất (kW)": v.motorPower || "",
        "Số ghế": v.seats,
        "Giá bán lẻ": v.retailPrice,
        "Giá sỉ": v.wholesalePrice,
        "Trạng thái": v.status,
        "Ngày tạo": new Date(v.createdAt).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Xe điện");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `vehicles_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Determine user role for permission
  const userRole = user?.role?.toUpperCase() as
    | "EVM_STAFF"
    | "ADMIN"
    | undefined;

  return (
    <div className="p-6">
      <VehicleList
        vehicles={vehicles}
        loading={loading}
        searchTerm={searchTerm}
        filters={{
          status: filterStatus,
          manufacturer: "",
          bodyType: "",
          priceMin: "",
          priceMax: "",
        }}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onFilterChange={(key, value) => {
          if (key === "status") setFilterStatus(value);
          setPage(1);
        }}
        onCreateClick={handleCreate}
        onEditClick={handleEdit}
        onDeleteClick={handleDelete}
        onExportClick={handleExport}
        userRole={userRole || "EVM_STAFF"} // EVM staff có full quyền
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }}
        onPageChange={handlePageChange}
      />

      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => {
            setShowForm(false);
            setEditingVehicle(null);
          }}
          onSave={handleSave}
          onRefresh={debouncedRefresh}
        />
      )}

      {/* Success Toast - Same as VehicleForm */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-700 overflow-hidden w-full max-w-sm mx-4">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 text-center">
              <h3 className="text-base font-semibold text-white">
                Xác nhận xóa xe
              </h3>
            </div>
            <div className="p-4 text-center">
              <div className="text-red-500 text-2xl mb-3">⚠️</div>
              <p className="text-gray-600 mb-4 text-sm">
                Xóa xe <strong>{vehicleToDelete.model}</strong>?
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={cancelDelete}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
