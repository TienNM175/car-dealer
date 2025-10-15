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

  const fetchVehicles = async () => {
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
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterStatus]);

  const handleSave = async (data: CreateVehicleInput | UpdateVehicleInput) => {
    try {
      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle.id, data);
      } else {
        await vehicleApi.createVehicle(data as CreateVehicleInput);
      }
      setShowForm(false);
      setEditingVehicle(null);
      setPage(1);
      fetchVehicles();
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

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`Bạn có chắc muốn xóa xe ${vehicle.model}?`)) {
      return;
    }

    try {
      await vehicleApi.deleteVehicle(vehicle.id);
      if (vehicles.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchVehicles();
      }
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      alert("Có lỗi xảy ra khi xóa xe");
    }
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
        />
      )}
    </div>
  );
}
