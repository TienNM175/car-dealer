// frontend/src/app/dealer/vehicles/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import VehicleList from "@/components/vehicles/VehicleList";
import { Vehicle, vehicleApi } from "@/lib/api/vehicleApi";

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

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      console.log("Fetching vehicles - Page:", page, "Limit:", limit);

      const res = await vehicleApi.getAllVehicles(
        { search: searchTerm, status: filterStatus },
        { page, limit }
      );

      console.log("API Response:", res);

      // Xử lý cấu trúc response từ backend
      // Backend trả về: { success: true, data: { data: [...], meta: {...} } }
      const responseData = res.data.data || res.data;
      const vehicles = responseData.data || responseData;
      const meta = responseData.meta || res.data.meta;

      console.log("Processed vehicles:", vehicles);
      console.log("Meta:", meta);

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
    console.log(
      "useEffect triggered - page:",
      page,
      "searchTerm:",
      searchTerm,
      "filterStatus:",
      filterStatus
    );
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterStatus]);

  // handleView removed - now handled by VehicleList internally

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
    console.log("Page change requested:", newPage);
    setPage(newPage);
    // Scroll to top khi chuyển trang
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          setPage(1); // Reset về trang 1 khi search
        }}
        onFilterChange={(key, value) => {
          if (key === "status") setFilterStatus(value);
          setPage(1); // Reset về trang 1 khi filter
        }}
        userRole={"DEALER_STAFF"} // Dealer chỉ được xem, không CRUD
        onExportClick={handleExport}
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
