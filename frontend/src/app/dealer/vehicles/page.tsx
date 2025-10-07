// frontend/src/app/dealer/vehicles/page.tsx
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

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function VehiclesPage() {
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

      const data = res.data.data || res.data;
      const totalCount = res.data.total ?? data.length ?? 0;

      setVehicles(data);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, searchTerm, filterStatus]);

  const handleSave = async (data: CreateVehicleInput | UpdateVehicleInput) => {
    if (editingVehicle) {
      await vehicleApi.updateVehicle(editingVehicle.id, data);
    } else {
      await vehicleApi.createVehicle(data as CreateVehicleInput);
    }
    setShowForm(false);
    setEditingVehicle(null);
    fetchVehicles();
  };

  const handleView = (vehicle: Vehicle) => {
    console.log("View vehicle:", vehicle);
    // TODO: Navigate to vehicle detail page
  };

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
      fetchVehicles();
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

  return (
    <div className="p-6">
      <VehicleList
        vehicles={vehicles}
        loading={loading}
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterStatus}
        onCreateClick={handleCreate}
        onViewClick={handleView}
        onEditClick={handleEdit}
        onDeleteClick={handleDelete}
        onExportClick={handleExport}
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }}
        onPageChange={setPage}
      />

      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
