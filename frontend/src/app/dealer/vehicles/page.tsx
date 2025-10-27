// frontend/src/app/dealer/vehicles/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import VehicleList from "@/components/vehicles/VehicleList";
import { Vehicle, vehicleApi } from "@/lib/api/vehicleApi";
import ContractForm from "@/components/contracts/ContractForm";
import { useAuth } from "@/contexts/AuthContext";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function VehiclesPage() {
  const { user } = useAuth();

  // Debug user info
  console.log("👤 User in dealer/vehicles:", user);
  console.log("🏢 User dealerId:", (user as any)?.dealerId);
  console.log("🏢 User dealer:", (user as any)?.dealer);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Contract creation states
  const [showContractForm, setShowContractForm] = useState(false);
  const [preselectedVehicle, setPreselectedVehicle] = useState<Vehicle | null>(
    null
  );

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      console.log("Fetching dealer vehicles - Page:", page, "Limit:", limit);

      // Dealer should use getDealerVehicles API to filter by dealer inventory
      const res = await vehicleApi.getDealerVehicles(
        user?.dealerId || "",
        { search: searchTerm, status: filterStatus },
        { page, limit }
      );

      console.log("API Response:", res);

      // Xử lý cấu trúc response từ backend
      // Backend trả về: { success: true, data: { data: [...], meta: {...} } }
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

  const handleCreateContractFromVehicle = (vehicle: Vehicle) => {
    setPreselectedVehicle(vehicle);
    setShowContractForm(true);
  };

  const handleContractSuccess = (contract: any) => {
    console.log("Contract created successfully:", contract);
    setShowContractForm(false);
    setPreselectedVehicle(null);
    // Refresh vehicle list after contract creation
    fetchVehicles();
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
        user={user} // Pass user để lấy dealerId
        onExportClick={handleExport}
        onCreateContractFromVehicle={handleCreateContractFromVehicle}
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }}
        onPageChange={handlePageChange}
      />

      {/* Contract Form Modal */}
      {showContractForm && (
        <ContractForm
          isOpen={showContractForm}
          onClose={() => {
            setShowContractForm(false);
            setPreselectedVehicle(null);
          }}
          onSuccess={handleContractSuccess}
          selectedVehicle={preselectedVehicle || undefined}
          dealerId={(user as any)?.dealerId}
          userId={(user as any)?.id}
          dealerInfo={{
            name: (user as any)?.dealer?.name || "N/A",
            address: (user as any)?.dealer?.address,
            phone: (user as any)?.dealer?.phone,
            email: (user as any)?.dealer?.email,
          }}
          staffInfo={{
            firstName: (user as any)?.firstName || "",
            lastName: (user as any)?.lastName || "",
          }}
        />
      )}
    </div>
  );
}
