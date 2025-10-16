"use client";
import React, { useState, useEffect, useMemo } from "react";
import { X, Car, Search, ChevronDown } from "lucide-react";
import { Vehicle, vehicleApi } from "@/lib/api/vehicleApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface VehicleCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle?: Vehicle | null;
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
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [selectedFirstVehicle, setSelectedFirstVehicle] =
    useState<Vehicle | null>(null);
  const [selectedSecondVehicle, setSelectedSecondVehicle] =
    useState<Vehicle | null>(null);
  const [showFirstDropdown, setShowFirstDropdown] = useState(false);
  const [showSecondDropdown, setShowSecondDropdown] = useState(false);
  const [searchFirst, setSearchFirst] = useState("");
  const [searchSecond, setSearchSecond] = useState("");

  // Memoized filtered lists
  const filteredFirstVehicles = useMemo(() => {
    if (!Array.isArray(allVehicles)) return [];

    // Remove duplicates by id
    const uniqueVehicles = allVehicles.filter(
      (vehicle, index, self) =>
        index === self.findIndex((v) => v.id === vehicle.id)
    );

    return uniqueVehicles.filter((v) => {
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

    // Remove duplicates by id
    const uniqueVehicles = allVehicles.filter(
      (vehicle, index, self) =>
        index === self.findIndex((v) => v.id === vehicle.id)
    );

    return uniqueVehicles.filter((v) => {
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
      setAllVehicles([]);
      setSelectedFirstVehicle(null);
      setSelectedSecondVehicle(null);
      setSearchFirst("");
      setSearchSecond("");
      setShowFirstDropdown(false);
      setShowSecondDropdown(false);
      fetchAllVehicles();
      if (selectedVehicle) {
        setSelectedFirstVehicle(selectedVehicle);
      }
    } else {
      setSearchFirst("");
      setSearchSecond("");
      setShowFirstDropdown(false);
      setShowSecondDropdown(false);
      setSelectedSecondVehicle(null);
      setSelectedFirstVehicle(null);
      setAllVehicles([]);
    }
  }, [isOpen, selectedVehicle]);

  // Close dropdown when click outside
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
      const response = await vehicleApi.getAllVehicles(
        {},
        { page: 1, limit: 100 }
      );
      // API trả về response.data.data
      const vehicles = response.data?.data || [];
      console.log("Raw vehicles data:", vehicles);
      console.log("Vehicles count:", vehicles.length);

      // Check for duplicates
      const ids = vehicles.map((v: Vehicle) => v.id);
      const uniqueIds = [...new Set(ids)];
      console.log("Unique IDs count:", uniqueIds.length);
      console.log("Has duplicates:", ids.length !== uniqueIds.length);

      setAllVehicles(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-700 max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-t-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  So sánh xe điện
                </h3>
                <p className="text-sm text-blue-100 mt-1 font-medium">
                  Chọn 2 xe để so sánh chi tiết thông số
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 text-white hover:scale-105"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto p-6 modal-scrollbar">
          {/* Vehicle Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Vehicle 1 Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Xe thứ nhất
                </h3>
              </div>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => {
                    setShowFirstDropdown(!showFirstDropdown);
                    setShowSecondDropdown(false);
                  }}
                  className={`w-full px-4 py-4 text-sm rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                    selectedFirstVehicle
                      ? "bg-blue-50 border-2 border-blue-200 shadow-md"
                      : "bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <div className="flex items-center space-x-3">
                    {selectedFirstVehicle ? (
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-800">
                          {selectedFirstVehicle?.manufacturer?.name}{" "}
                          {selectedFirstVehicle?.model}{" "}
                          {selectedFirstVehicle?.variant}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Chọn xe thứ 1</span>
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform text-gray-400 ${
                      showFirstDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showFirstDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden backdrop-blur-sm">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm xe..."
                          value={searchFirst}
                          onChange={(e) => setSearchFirst(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto form-scrollbar">
                      {filteredFirstVehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          onClick={() => {
                            setSelectedFirstVehicle(vehicle);
                            setShowFirstDropdown(false);
                            setSearchFirst("");
                            if (selectedSecondVehicle?.id === vehicle.id) {
                              setSelectedSecondVehicle(null);
                            }
                          }}
                          className="px-4 py-3 text-sm text-gray-800 hover:bg-blue-50 cursor-pointer flex items-center space-x-3 transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Car className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {vehicle.manufacturer?.name} {vehicle.model}
                            </div>
                            {vehicle.variant && (
                              <div className="text-xs text-gray-500">
                                {vehicle.variant}
                              </div>
                            )}
                          </div>
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

              {/* Vehicle 1 Display */}
              {selectedFirstVehicle && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden mb-4 shadow-md">
                    {selectedFirstVehicle?.images?.find((img) => img.isMain) ? (
                      <img
                        src={
                          selectedFirstVehicle?.images.find((img) => img.isMain)
                            ?.url
                        }
                        alt={`${selectedFirstVehicle?.manufacturer?.name} ${selectedFirstVehicle?.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl text-gray-800 mb-1">
                      {selectedFirstVehicle?.manufacturer?.name}{" "}
                      {selectedFirstVehicle?.model}
                    </p>
                    {selectedFirstVehicle?.variant && (
                      <p className="text-sm text-blue-600 font-medium mb-2">
                        {selectedFirstVehicle?.variant}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-1 inline-block">
                      {selectedFirstVehicle?.year} •{" "}
                      {(bodyTypeConfig as any)[
                        selectedFirstVehicle?.bodyType || ""
                      ] || selectedFirstVehicle?.bodyType}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle 2 Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Xe thứ hai
                </h3>
              </div>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondDropdown(!showSecondDropdown);
                    setShowFirstDropdown(false);
                  }}
                  className={`w-full px-4 py-4 text-sm rounded-xl text-left flex items-center justify-between transition-all duration-200 ${
                    selectedSecondVehicle
                      ? "bg-green-50 border-2 border-green-200 shadow-md"
                      : "bg-white border-2 border-gray-200 hover:border-green-300 hover:shadow-sm"
                  } focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                >
                  <div className="flex items-center space-x-3">
                    {selectedSecondVehicle ? (
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-800">
                          {selectedSecondVehicle.manufacturer?.name}{" "}
                          {selectedSecondVehicle.model}{" "}
                          {selectedSecondVehicle.variant}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Chọn xe thứ 2</span>
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform text-gray-400 ${
                      showSecondDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showSecondDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-hidden backdrop-blur-sm">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Tìm kiếm xe..."
                          value={searchSecond}
                          onChange={(e) => setSearchSecond(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 bg-white"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto form-scrollbar">
                      {filteredSecondVehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          onClick={() => {
                            setSelectedSecondVehicle(vehicle);
                            setShowSecondDropdown(false);
                            setSearchSecond("");
                            if (selectedFirstVehicle?.id === vehicle.id) {
                              setSelectedFirstVehicle(null);
                            }
                          }}
                          className="px-4 py-3 text-sm text-gray-800 hover:bg-green-50 cursor-pointer flex items-center space-x-3 transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Car className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {vehicle.manufacturer?.name} {vehicle.model}
                            </div>
                            {vehicle.variant && (
                              <div className="text-xs text-gray-500">
                                {vehicle.variant}
                              </div>
                            )}
                          </div>
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

              {/* Vehicle 2 Display */}
              {selectedSecondVehicle && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-lg border border-green-200">
                  <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-xl overflow-hidden mb-4 shadow-md">
                    {selectedSecondVehicle.images?.find((img) => img.isMain) ? (
                      <img
                        src={
                          selectedSecondVehicle.images.find((img) => img.isMain)
                            ?.url
                        }
                        alt={`${selectedSecondVehicle?.manufacturer?.name} ${selectedSecondVehicle?.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-green-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-xl text-gray-800 mb-1">
                      {selectedSecondVehicle?.manufacturer?.name}{" "}
                      {selectedSecondVehicle?.model}
                    </p>
                    {selectedSecondVehicle?.variant && (
                      <p className="text-sm text-green-600 font-medium mb-2">
                        {selectedSecondVehicle.variant}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-1 inline-block">
                      {selectedSecondVehicle?.year} •{" "}
                      {(bodyTypeConfig as any)[
                        selectedSecondVehicle?.bodyType || ""
                      ] || selectedSecondVehicle?.bodyType}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Table */}
          {(selectedFirstVehicle || selectedSecondVehicle) && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Bảng so sánh chi tiết
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    So sánh các thông số kỹ thuật và giá cả
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <th className="text-left p-6 font-semibold text-lg">
                        Thông số
                      </th>
                      <th className="text-center p-6 font-semibold min-w-[200px]">
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              1
                            </span>
                          </div>
                          <span className="text-sm opacity-90">
                            Xe thứ nhất
                          </span>
                          <span className="font-bold text-base">
                            {selectedFirstVehicle
                              ? `${selectedFirstVehicle?.manufacturer?.name} ${selectedFirstVehicle?.model}`
                              : "Chưa chọn"}
                          </span>
                        </div>
                      </th>
                      <th className="text-center p-6 font-semibold min-w-[200px]">
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              2
                            </span>
                          </div>
                          <span className="text-sm opacity-90">Xe thứ hai</span>
                          <span className="font-bold text-base">
                            {selectedSecondVehicle
                              ? `${selectedSecondVehicle.manufacturer?.name} ${selectedSecondVehicle.model}`
                              : "Chưa chọn"}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Thông tin cơ bản */}
                    <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                      <td
                        colSpan={3}
                        className="p-4 font-bold text-blue-800 bg-blue-100 text-center text-lg"
                      >
                        THÔNG TIN CƠ BẢN
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="p-4 font-semibold text-gray-800">
                        Phiên bản
                      </td>
                      <td className="p-4 text-center font-medium text-blue-600 bg-blue-50/50">
                        {selectedFirstVehicle?.variant || "-"}
                      </td>
                      <td className="p-4 text-center font-medium text-green-600 bg-green-50/50">
                        {selectedSecondVehicle?.variant || "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="p-4 font-semibold text-gray-800">
                        Năm sản xuất
                      </td>
                      <td className="p-4 text-center text-gray-800 font-medium bg-blue-50/50">
                        {selectedFirstVehicle?.year || "-"}
                      </td>
                      <td className="p-4 text-center text-gray-800 font-medium bg-green-50/50">
                        {selectedSecondVehicle?.year || "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Kiểu dáng</td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.bodyType
                          ? (bodyTypeConfig as any)[
                              selectedFirstVehicle.bodyType
                            ] || selectedFirstVehicle.bodyType
                          : "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle
                          ? (bodyTypeConfig as any)[
                              selectedSecondVehicle.bodyType
                            ] || selectedSecondVehicle.bodyType
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Màu sắc</td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.color || "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle?.color || "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Số ghế</td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.seats
                          ? `${selectedFirstVehicle.seats} chỗ`
                          : "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle
                          ? `${selectedSecondVehicle.seats} chỗ`
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Số cửa</td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.doors
                          ? `${selectedFirstVehicle.doors} cửa`
                          : "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle
                          ? `${selectedSecondVehicle.doors} cửa`
                          : "-"}
                      </td>
                    </tr>

                    {/* Giá cả */}
                    <tr className="bg-green-50">
                      <td
                        colSpan={3}
                        className="p-3 font-bold text-green-800 bg-green-100"
                      >
                        GIÁ CẢ
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Giá bán lẻ</td>
                      <td className="p-4 text-center text-green-600 font-bold text-lg">
                        {formatMoney(
                          selectedFirstVehicle?.retailPrice || 0,
                          selectedFirstVehicle?.currency
                        )}
                      </td>
                      <td className="p-4 text-center text-green-600 font-bold text-lg">
                        {selectedSecondVehicle
                          ? formatMoney(
                              selectedSecondVehicle.retailPrice || 0,
                              selectedSecondVehicle.currency
                            )
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Giá sỉ</td>
                      <td className="p-4 text-center text-blue-600 font-semibold">
                        {formatMoney(
                          selectedFirstVehicle?.wholesalePrice || 0,
                          selectedFirstVehicle?.currency
                        )}
                      </td>
                      <td className="p-4 text-center text-blue-600 font-semibold">
                        {selectedSecondVehicle
                          ? formatMoney(
                              selectedSecondVehicle.wholesalePrice || 0,
                              selectedSecondVehicle.currency
                            )
                          : "-"}
                      </td>
                    </tr>

                    {/* Thông số kỹ thuật */}
                    <tr className="bg-purple-50">
                      <td
                        colSpan={3}
                        className="p-3 font-bold text-purple-800 bg-purple-100"
                      >
                        THÔNG SỐ KỸ THUẬT
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">
                        Dung lượng pin
                      </td>
                      <td className="p-4 text-center font-semibold text-purple-600">
                        {selectedFirstVehicle?.batteryCapacity || 0} kWh
                      </td>
                      <td className="p-4 text-center font-semibold text-purple-600">
                        {selectedSecondVehicle
                          ? `${selectedSecondVehicle.batteryCapacity || 0} kWh`
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">
                        Phạm vi hoạt động
                      </td>
                      <td className="p-4 text-center font-semibold text-green-600">
                        {selectedFirstVehicle?.range || 0} km
                      </td>
                      <td className="p-4 text-center font-semibold text-green-600">
                        {selectedSecondVehicle
                          ? `${selectedSecondVehicle.range || 0} km`
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">
                        Thời gian sạc
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.chargingTime || 0} phút
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle
                          ? `${selectedSecondVehicle.chargingTime || 0} phút`
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">
                        Công suất động cơ
                      </td>
                      <td className="p-4 text-center font-semibold text-orange-600">
                        {selectedFirstVehicle?.motorPower || 0} kW
                      </td>
                      <td className="p-4 text-center font-semibold text-orange-600">
                        {selectedSecondVehicle
                          ? `${selectedSecondVehicle.motorPower || 0} kW`
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">
                        Tốc độ tối đa
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.topSpeed || 0} km/h
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle
                          ? `${selectedSecondVehicle.topSpeed || 0} km/h`
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">
                        Tăng tốc 0-100km/h
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.acceleration
                          ? `${selectedFirstVehicle.acceleration} giây`
                          : "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle?.acceleration
                          ? `${selectedSecondVehicle.acceleration} giây`
                          : "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Mô tả xe</td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.description || "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle?.description || "-"}
                      </td>
                    </tr>

                    {/* Trạng thái */}
                    <tr className="bg-orange-50">
                      <td
                        colSpan={3}
                        className="p-3 font-bold text-orange-800 bg-orange-100"
                      >
                        TRẠNG THÁI & THÔNG TIN KHÁC
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Trạng thái</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedFirstVehicle?.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : selectedFirstVehicle?.status === "INACTIVE"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-black"
                          }`}
                        >
                          {selectedFirstVehicle?.status === "ACTIVE"
                            ? "Đang bán"
                            : selectedFirstVehicle?.status === "INACTIVE"
                            ? "Ngừng bán"
                            : selectedFirstVehicle?.status === "OUT_OF_STOCK"
                            ? "Hết hàng"
                            : selectedFirstVehicle?.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {selectedSecondVehicle ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              selectedSecondVehicle.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : selectedSecondVehicle.status === "INACTIVE"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-black"
                            }`}
                          >
                            {selectedSecondVehicle.status === "ACTIVE"
                              ? "Đang bán"
                              : selectedSecondVehicle.status === "INACTIVE"
                              ? "Ngừng bán"
                              : selectedSecondVehicle.status === "OUT_OF_STOCK"
                              ? "Hết hàng"
                              : selectedSecondVehicle.status}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Hãng xe</td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.manufacturer?.name || "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle?.manufacturer?.name || "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Quốc gia</td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedFirstVehicle?.manufacturer?.country || "-"}
                      </td>
                      <td className="p-4 text-center text-black font-medium">
                        {selectedSecondVehicle?.manufacturer?.country || "-"}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-black">Ngày tạo</td>
                      <td className="p-4 text-center text-sm text-black font-medium">
                        {selectedFirstVehicle?.createdAt
                          ? new Date(
                              selectedFirstVehicle.createdAt
                            ).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="p-4 text-center text-sm text-black font-medium">
                        {selectedSecondVehicle?.createdAt
                          ? new Date(
                              selectedSecondVehicle.createdAt
                            ).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Thống kê bổ sung */}
          {(selectedFirstVehicle || selectedSecondVehicle) && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-inner mt-6">
              <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Thống kê hoạt động
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Xe thứ nhất */}
                {selectedFirstVehicle && (
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-black mb-4 text-center text-lg">
                      {selectedFirstVehicle?.manufacturer?.name}{" "}
                      {selectedFirstVehicle?.model}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Tồn kho EVM:
                        </span>
                        <span className="font-medium text-black">
                          {selectedFirstVehicle?._count?.evmInventories || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Tồn kho đại lý:
                        </span>
                        <span className="font-medium text-black">
                          {selectedFirstVehicle?._count?.dealerInventories || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Đơn hàng:</span>
                        <span className="font-medium text-black">
                          {selectedFirstVehicle?._count?.dealerOrders || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Báo giá:</span>
                        <span className="font-medium text-black">
                          {selectedFirstVehicle?._count?.quotations || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Hợp đồng:</span>
                        <span className="font-medium text-black">
                          {selectedFirstVehicle?._count?.contracts || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Lái thử:</span>
                        <span className="font-medium text-black">
                          {selectedFirstVehicle?._count?.testDrives || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Xe thứ hai */}
                {selectedSecondVehicle ? (
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-black mb-4 text-center text-lg">
                      {selectedSecondVehicle?.manufacturer?.name}{" "}
                      {selectedSecondVehicle?.model}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Tồn kho EVM:
                        </span>
                        <span className="font-medium text-black">
                          {selectedSecondVehicle?._count?.evmInventories || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Tồn kho đại lý:
                        </span>
                        <span className="font-medium text-black">
                          {selectedSecondVehicle?._count?.dealerInventories ||
                            0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Đơn hàng:</span>
                        <span className="font-medium text-black">
                          {selectedSecondVehicle?._count?.dealerOrders || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Báo giá:</span>
                        <span className="font-medium text-black">
                          {selectedSecondVehicle?._count?.quotations || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Hợp đồng:</span>
                        <span className="font-medium text-black">
                          {selectedSecondVehicle?._count?.contracts || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Lái thử:</span>
                        <span className="font-medium text-black">
                          {selectedSecondVehicle?._count?.testDrives || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 shadow-sm border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">
                        Chọn xe thứ hai để so sánh
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Thống kê sẽ hiển thị khi có 2 xe
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
