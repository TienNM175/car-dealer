// frontend/src/components/vehicles/VehicleCompareModal.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Car,
  Battery,
  Zap,
  Gauge,
  Users,
  DollarSign,
  Search,
  ChevronDown,
} from "lucide-react";
import { Vehicle, vehicleApi } from "@/lib/api/vehicleApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface VehicleCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle?: Vehicle | null; // Xe đã chọn sẵn (từ nút so sánh ở hành động)
}

const bodyTypeConfig = {
  SEDAN: "Sedan",
  SUV: "SUV",
  HATCHBACK: "Hatchback",
  COUPE: "Coupe",
  CONVERTIBLE: "Convertible",
  WAGON: "Wagon",
  TRUCK: "Truck",
  VAN: "Van",
};

export default function VehicleCompareModal({
  isOpen,
  onClose,
  selectedVehicle,
}: VehicleCompareModalProps) {
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFirstVehicle, setSelectedFirstVehicle] =
    useState<Vehicle | null>(null);
  const [selectedSecondVehicle, setSelectedSecondVehicle] =
    useState<Vehicle | null>(null);
  const [showFirstDropdown, setShowFirstDropdown] = useState(false);
  const [showSecondDropdown, setShowSecondDropdown] = useState(false);
  const [searchFirst, setSearchFirst] = useState("");
  const [searchSecond, setSearchSecond] = useState("");

  // Memoized filtered lists để đảm bảo re-render khi state thay đổi
  const filteredFirstVehicles = useMemo(() => {
    if (!Array.isArray(allVehicles)) return [];

    return allVehicles.filter((v) => {
      const isExcluded = v.id === selectedSecondVehicle?.id;
      const matchesSearch =
        searchFirst === "" ||
        v.model?.toLowerCase().includes(searchFirst.toLowerCase()) ||
        v.manufacturer?.name
          ?.toLowerCase()
          .includes(searchFirst.toLowerCase()) ||
        v.variant?.toLowerCase().includes(searchFirst.toLowerCase());

      return !isExcluded && matchesSearch;
    });
  }, [allVehicles, selectedSecondVehicle?.id, searchFirst]);

  const filteredSecondVehicles = useMemo(() => {
    if (!Array.isArray(allVehicles)) return [];

    return allVehicles.filter((v) => {
      const isExcluded = v.id === selectedFirstVehicle?.id;
      const matchesSearch =
        searchSecond === "" ||
        v.model?.toLowerCase().includes(searchSecond.toLowerCase()) ||
        v.manufacturer?.name
          ?.toLowerCase()
          .includes(searchSecond.toLowerCase()) ||
        v.variant?.toLowerCase().includes(searchSecond.toLowerCase());

      return !isExcluded && matchesSearch;
    });
  }, [allVehicles, selectedFirstVehicle?.id, searchSecond]);

  useEffect(() => {
    if (isOpen) {
      // Reset all states first
      setAllVehicles([]);
      setSelectedFirstVehicle(null);
      setSelectedSecondVehicle(null);
      setSearchTerm("");
      setSearchFirst("");
      setSearchSecond("");
      setShowFirstDropdown(false);
      setShowSecondDropdown(false);
      setComparisonData(null);

      // Then fetch fresh data
      fetchAllVehicles();

      // Set initial vehicle if provided
      if (selectedVehicle) {
        setSelectedFirstVehicle(selectedVehicle);
      }
    } else {
      // Reset khi đóng modal
      setSearchTerm("");
      setSearchFirst("");
      setSearchSecond("");
      setShowFirstDropdown(false);
      setShowSecondDropdown(false);
      setSelectedSecondVehicle(null);
      setSelectedFirstVehicle(null);
      setComparisonData(null);
      setAllVehicles([]);
    }
  }, [isOpen, selectedVehicle]);

  useEffect(() => {
    if (selectedFirstVehicle && selectedSecondVehicle) {
      fetchComparison();
    }
  }, [selectedFirstVehicle, selectedSecondVehicle]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setShowFirstDropdown(false);
        setShowSecondDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const fetchAllVehicles = async () => {
    try {
      console.log("🚀 FETCHING VEHICLES - START");
      const response = await vehicleApi.getAllVehicles(
        {},
        { page: 1, limit: 100 }
      );

      const vehicles = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      console.log("Raw vehicles count:", vehicles.length);

      // Check for duplicates
      const ids = vehicles.map((v: Vehicle) => v.id);
      const uniqueIds = [...new Set(ids)];
      console.log("Unique IDs count:", uniqueIds.length);

      if (ids.length !== uniqueIds.length) {
        console.log("DUPLICATES FOUND in backend data!");
        console.log(
          "Duplicate IDs:",
          ids.filter((id: string, index: number) => ids.indexOf(id) !== index)
        );

        // Log first few vehicles to see pattern
        console.log(
          "First 5 vehicles:",
          vehicles
            .slice(0, 5)
            .map((v: Vehicle) => `${v.id} - ${v.manufacturer?.name} ${v.model}`)
        );
        console.log(
          "Vehicles 16-20:",
          vehicles
            .slice(15, 20)
            .map((v: Vehicle) => `${v.id} - ${v.manufacturer?.name} ${v.model}`)
        );
      }

      // Merge duplicate vehicles (same ID but different _count data)
      const vehicleMap = new Map<string, Vehicle>();

      vehicles.forEach((vehicle: Vehicle) => {
        if (!vehicleMap.has(vehicle.id)) {
          vehicleMap.set(vehicle.id, vehicle);
        } else {
          // Merge _count data if exists
          const existing = vehicleMap.get(vehicle.id)!;
          console.log(
            `Merging duplicate vehicle: ${vehicle.id} - ${vehicle.manufacturer?.name} ${vehicle.model}`
          );

          if (vehicle._count && existing._count) {
            console.log("Existing _count:", existing._count);
            console.log("New _count:", vehicle._count);

            // Merge _count data - take the higher values or combine
            const mergedCount = {
              ...existing._count,
              ...vehicle._count,
              // If both have same keys, take the sum or max
              evmInventories: Math.max(
                existing._count.evmInventories || 0,
                vehicle._count.evmInventories || 0
              ),
              dealerInventories: Math.max(
                existing._count.dealerInventories || 0,
                vehicle._count.dealerInventories || 0
              ),
              contracts: Math.max(
                existing._count.contracts || 0,
                vehicle._count.contracts || 0
              ),
              quotations: Math.max(
                existing._count.quotations || 0,
                vehicle._count.quotations || 0
              ),
              testDrives: Math.max(
                existing._count.testDrives || 0,
                vehicle._count.testDrives || 0
              ),
              dealerOrders: Math.max(
                existing._count.dealerOrders || 0,
                vehicle._count.dealerOrders || 0
              ),
            };

            console.log("Merged _count:", mergedCount);
            vehicleMap.set(vehicle.id, { ...existing, _count: mergedCount });
          }
        }
      });

      const uniqueVehicles = Array.from(vehicleMap.values());
      console.log("Final unique vehicles count:", uniqueVehicles.length);
      console.log("🚀 FETCHING VEHICLES - COMPLETED");

      setAllVehicles(uniqueVehicles);
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
      setAllVehicles([]);
    }
  };

  const fetchComparison = async () => {
    if (!selectedFirstVehicle || !selectedSecondVehicle) return;

    setLoading(true);
    try {
      const response = await vehicleApi.compareVehicles([
        selectedFirstVehicle.id,
        selectedSecondVehicle.id,
      ]);
      setComparisonData(response);
    } catch (error) {
      console.error("Error comparing vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl w-[95vw] max-w-6xl h-[90vh] overflow-hidden flex flex-col border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">So sánh xe</h2>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex justify-center">
            <div className="overflow-x-auto">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
                <table className="w-full text-base table-fixed">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th
                        className="text-left p-4 font-bold text-gray-800 border-r border-gray-200 h-48"
                        style={{ width: "200px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Tiêu chí so sánh
                          </span>
                        </div>
                      </th>
                      {/* Cột xe thứ 1 */}
                      <th className="text-center p-4 flex-1 h-48 border-r border-gray-200">
                        <div className="space-y-3 h-full flex flex-col">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <Car className="w-8 h-8 text-white" />
                          </div>
                          <div className="space-y-2">
                            {/* Custom Dropdown cho xe thứ 1 */}
                            <div className="relative dropdown-container">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowFirstDropdown(!showFirstDropdown);
                                  setShowSecondDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-left flex items-center justify-between"
                              >
                                <span>
                                  {selectedFirstVehicle
                                    ? `${selectedFirstVehicle.manufacturer?.name} ${selectedFirstVehicle.model} ${selectedFirstVehicle.variant}`
                                    : "🔍 Chọn xe thứ 1"}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    showFirstDropdown ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {showFirstDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                  {/* Search input */}
                                  <div className="p-2 border-b border-gray-200">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        placeholder="Tìm kiếm xe..."
                                        value={searchFirst}
                                        onChange={(e) =>
                                          setSearchFirst(e.target.value)
                                        }
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        autoFocus
                                      />
                                    </div>
                                  </div>

                                  {/* Options list */}
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredFirstVehicles.map((vehicle) => (
                                      <div
                                        key={vehicle.id}
                                        onClick={() => {
                                          setSelectedFirstVehicle(vehicle);
                                          setShowFirstDropdown(false);
                                          setSearchFirst("");
                                          // Nếu chọn xe thứ 1 trùng với xe thứ 2, reset xe thứ 2
                                          if (
                                            selectedSecondVehicle?.id ===
                                            vehicle.id
                                          ) {
                                            setSelectedSecondVehicle(null);
                                          }
                                        }}
                                        className="px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer flex items-center space-x-2"
                                      >
                                        <Car className="w-4 h-4 text-gray-400" />
                                        <span>
                                          {vehicle.manufacturer?.name}{" "}
                                          {vehicle.model} {vehicle.variant}
                                        </span>
                                      </div>
                                    ))}
                                    {filteredFirstVehicles.length === 0 && (
                                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                        Không tìm thấy xe nào
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {selectedFirstVehicle && (
                              <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm h-20 flex flex-col justify-center">
                                <p className="font-bold text-sm text-gray-900 truncate">
                                  {selectedFirstVehicle?.manufacturer?.name}{" "}
                                  {selectedFirstVehicle?.model}
                                </p>
                                {selectedFirstVehicle?.variant && (
                                  <p className="text-xs text-blue-600 font-medium truncate">
                                    {selectedFirstVehicle.variant}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {selectedFirstVehicle?.year} •{" "}
                                  {(bodyTypeConfig as any)[
                                    selectedFirstVehicle?.bodyType || ""
                                  ] || selectedFirstVehicle?.bodyType}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </th>

                      {/* Cột xe thứ 2 */}
                      <th className="text-center p-4 flex-1 h-48 border-r border-gray-200 last:border-r-0">
                        <div className="space-y-3 h-full flex flex-col">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg bg-gradient-to-br from-green-500 to-green-600">
                            <Car className="w-8 h-8 text-white" />
                          </div>
                          <div className="space-y-2">
                            {/* Custom Dropdown cho xe thứ 2 */}
                            <div className="relative dropdown-container">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowSecondDropdown(!showSecondDropdown);
                                  setShowFirstDropdown(false);
                                }}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-left flex items-center justify-between"
                              >
                                <span>
                                  {selectedSecondVehicle
                                    ? `${selectedSecondVehicle.manufacturer?.name} ${selectedSecondVehicle.model} ${selectedSecondVehicle.variant}`
                                    : "🔍 Chọn xe thứ 2"}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    showSecondDropdown ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {showSecondDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                  {/* Search input */}
                                  <div className="p-2 border-b border-gray-200">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                      <input
                                        type="text"
                                        placeholder="Tìm kiếm xe..."
                                        value={searchSecond}
                                        onChange={(e) =>
                                          setSearchSecond(e.target.value)
                                        }
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                        autoFocus
                                      />
                                    </div>
                                  </div>

                                  {/* Options list */}
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredSecondVehicles.map((vehicle) => (
                                      <div
                                        key={vehicle.id}
                                        onClick={() => {
                                          setSelectedSecondVehicle(vehicle);
                                          setShowSecondDropdown(false);
                                          setSearchSecond("");
                                          // Nếu chọn xe thứ 2 trùng với xe thứ 1, reset xe thứ 1
                                          if (
                                            selectedFirstVehicle?.id ===
                                            vehicle.id
                                          ) {
                                            setSelectedFirstVehicle(null);
                                          }
                                        }}
                                        className="px-3 py-2 text-sm text-gray-900 hover:bg-green-50 cursor-pointer flex items-center space-x-2"
                                      >
                                        <Car className="w-4 h-4 text-gray-400" />
                                        <span>
                                          {vehicle.manufacturer?.name}{" "}
                                          {vehicle.model} {vehicle.variant}
                                        </span>
                                      </div>
                                    ))}
                                    {filteredSecondVehicles.length === 0 && (
                                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                        Không tìm thấy xe nào
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {selectedSecondVehicle && (
                              <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm h-20 flex flex-col justify-center">
                                <p className="font-bold text-sm text-gray-900 truncate">
                                  {selectedSecondVehicle?.manufacturer?.name}{" "}
                                  {selectedSecondVehicle?.model}
                                </p>
                                {selectedSecondVehicle?.variant && (
                                  <p className="text-xs text-blue-600 font-medium truncate">
                                    {selectedSecondVehicle.variant}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {selectedSecondVehicle?.year} •{" "}
                                  {(bodyTypeConfig as any)[
                                    selectedSecondVehicle?.bodyType || ""
                                  ] || selectedSecondVehicle?.bodyType}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Giá bán lẻ */}
                    <tr className="hover:bg-gray-50 transition-colors h-16">
                      <td
                        className="p-4 font-semibold text-gray-800 border-r bg-gradient-to-r from-gray-50 to-gray-100 h-16 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                        style={{ width: "110px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Giá bán lẻ
                          </span>
                        </div>
                      </td>
                      {[selectedFirstVehicle, selectedSecondVehicle].map(
                        (vehicle, index) => (
                          <td
                            key={`row-${index}`}
                            className="p-3 text-center border-r last:border-r-0 flex-1 h-16"
                          >
                            <span className="font-semibold text-green-700">
                              {vehicle
                                ? formatMoney(
                                    vehicle.retailPrice || 0,
                                    vehicle.currency
                                  )
                                : "--"}
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    {/* Giá sỉ */}
                    <tr className="hover:bg-gray-50 transition-colors h-16">
                      <td
                        className="p-4 font-semibold text-gray-800 border-r bg-gradient-to-r from-gray-50 to-gray-100 h-16 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                        style={{ width: "110px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Giá sỉ
                          </span>
                        </div>
                      </td>
                      {[selectedFirstVehicle, selectedSecondVehicle].map(
                        (vehicle, index) => (
                          <td
                            key={`row-${index}`}
                            className="p-3 text-center border-r last:border-r-0 flex-1 h-16"
                          >
                            <span className="font-semibold text-blue-700">
                              {vehicle
                                ? formatMoney(
                                    vehicle.wholesalePrice || 0,
                                    vehicle.currency
                                  )
                                : "--"}
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    {/* Dung lượng pin */}
                    <tr className="hover:bg-gray-50 transition-colors h-16">
                      <td
                        className="p-4 font-semibold text-gray-800 border-r bg-gradient-to-r from-gray-50 to-gray-100 h-16 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                        style={{ width: "110px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Dung lượng pin
                          </span>
                        </div>
                      </td>
                      {[selectedFirstVehicle, selectedSecondVehicle].map(
                        (vehicle, index) => (
                          <td
                            key={`row-${index}`}
                            className="p-3 text-center border-r last:border-r-0 flex-1 h-16"
                          >
                            <span className="font-semibold text-gray-900">
                              {vehicle?.batteryCapacity || 0} kWh
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    {/* Phạm vi hoạt động */}
                    <tr className="hover:bg-gray-50 transition-colors h-16">
                      <td
                        className="p-4 font-semibold text-gray-800 border-r bg-gradient-to-r from-gray-50 to-gray-100 h-16 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                        style={{ width: "110px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Phạm vi hoạt động
                          </span>
                        </div>
                      </td>
                      {[selectedFirstVehicle, selectedSecondVehicle].map(
                        (vehicle, index) => (
                          <td
                            key={`row-${index}`}
                            className="p-3 text-center border-r last:border-r-0 flex-1 h-16"
                          >
                            <span className="font-semibold text-gray-900">
                              {vehicle?.range || 0} km
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    {/* Công suất */}
                    <tr className="hover:bg-gray-50 transition-colors h-16">
                      <td
                        className="p-4 font-semibold text-gray-800 border-r bg-gradient-to-r from-gray-50 to-gray-100 h-16 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                        style={{ width: "110px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Công suất
                          </span>
                        </div>
                      </td>
                      {[selectedFirstVehicle, selectedSecondVehicle].map(
                        (vehicle, index) => (
                          <td
                            key={`row-${index}`}
                            className="p-3 text-center border-r last:border-r-0 flex-1 h-16"
                          >
                            <span className="font-semibold text-gray-900">
                              {vehicle?.motorPower || "N/A"} kW
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    {/* Số ghế */}
                    <tr className="hover:bg-gray-50 transition-colors h-16">
                      <td
                        className="p-4 font-semibold text-gray-800 border-r bg-gradient-to-r from-gray-50 to-gray-100 h-16 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                        style={{ width: "110px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Số ghế
                          </span>
                        </div>
                      </td>
                      {[selectedFirstVehicle, selectedSecondVehicle].map(
                        (vehicle, index) => (
                          <td
                            key={`row-${index}`}
                            className="p-3 text-center border-r last:border-r-0 flex-1 h-16"
                          >
                            <span className="font-semibold text-gray-900">
                              {vehicle?.seats || 0} chỗ
                            </span>
                          </td>
                        )
                      )}
                    </tr>

                    {/* Trạng thái */}
                    <tr className="hover:bg-gray-50 transition-colors h-16">
                      <td
                        className="p-4 font-semibold text-gray-800 border-r bg-gradient-to-r from-gray-50 to-gray-100 h-16 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                        style={{ width: "110px" }}
                      >
                        <div className="flex items-center h-full">
                          <span className="whitespace-nowrap text-sm">
                            Trạng thái
                          </span>
                        </div>
                      </td>
                      {[selectedFirstVehicle, selectedSecondVehicle].map(
                        (vehicle, index) => (
                          <td
                            key={`row-${index}`}
                            className="p-3 text-center border-r last:border-r-0 flex-1 h-16"
                          >
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                vehicle?.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {vehicle?.status === "ACTIVE"
                                ? "Đang bán"
                                : "Ngừng bán"}
                            </span>
                          </td>
                        )
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
