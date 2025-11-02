"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import axiosClient from "@/lib/utils/axiosClient";
import {
  ChevronLeft,
  Package,
  FileText,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";

interface VehicleDetail {
  vehicle: {
    id: string;
    model: string;
    variant: string;
    year: number;
    bodyType: string;
    retailPrice: number;
    manufacturer: {
      id: string;
      name: string;
      code: string;
    };
  };
  evmInventory: {
    quantity: number;
    reserved: number;
    available: number;
  };
  dealerInventories: Array<{
    dealerId: string;
    quantity: number;
    available: number;
    reserved: number;
    sold: number;
    dealer: {
      id: string;
      name: string;
      code: string;
      city: string;
    };
  }>;
  contracts: Array<{
    id: string;
    contractCode: string;
    status: string;
    basePrice: number;
    discount: number;
    tax: number;
    finalPrice: number;
    createdAt: string;
    updatedAt: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
    };
    staff: {
      id: string;
      firstName: string;
      lastName: string;
      dealerId: string;
      dealer: {
        id: string;
        name: string;
        code: string;
        city: string;
      };
    };
  }>;
  contractsStats: {
    total: number;
    byStatus: {
      DRAFT: number;
      PENDING: number;
      SIGNED: number;
      COMPLETED: number;
      CANCELLED: number;
    };
    totalRevenue: number;
  };
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const vehicleId = params.vehicleId as string;

  const [data, setData] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && user.role !== "EVM_STAFF")) {
      toast.error("Bạn không có quyền truy cập trang này");
      router.push("/evm/reports");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Không có filter thời gian - lấy tất cả
        const res = await axiosClient.get(`/reports/vehicles/${vehicleId}`);
        setData(res.data?.data || res.data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Không thể tải dữ liệu. Vui lòng thử lại."
        );
        if (err.response?.status === 404) {
          router.push("/evm/reports");
        }
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchData();
    }
  }, [vehicleId, router]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      SIGNED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Nháp",
      PENDING: "Chờ duyệt",
      SIGNED: "Đã ký",
      COMPLETED: "Hoàn tất",
      CANCELLED: "Hủy",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || "Không tìm thấy dữ liệu"}</p>
          </div>
        </div>
      </div>
    );
  }

  const vehicleName = `${data.vehicle.manufacturer.name} ${data.vehicle.model} ${data.vehicle.variant}`;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/evm/reports")}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Quay lại báo cáo
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{vehicleName}</h1>
          <p className="text-gray-600 mt-2">
            Năm sản xuất: {data.vehicle.year} | Loại: {data.vehicle.bodyType}
          </p>
        </div>

        {/* Inventory Section */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            Tồn kho
          </h2>

          {/* EVM Inventory */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">
              Kho trung tâm (EVM)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">Tổng số:</span>
                <p className="text-lg font-bold text-gray-900">
                  {data.evmInventory.quantity} xe
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Đã đặt:</span>
                <p className="text-lg font-bold text-yellow-600">
                  {data.evmInventory.reserved} xe
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Có sẵn:</span>
                <p className="text-lg font-bold text-green-600">
                  {data.evmInventory.available} xe
                </p>
              </div>
            </div>
          </div>

          {/* Dealer Inventories */}
          {data.dealerInventories.length > 0 ? (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Tồn kho tại các đại lý
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.dealerInventories.map((inv, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {inv.dealer.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {inv.dealer.city}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Tổng:</span>
                        <p className="font-semibold text-gray-900">
                          {inv.quantity} xe
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Có sẵn:</span>
                        <p className="font-semibold text-green-600">
                          {inv.available} xe
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Đã đặt:</span>
                        <p className="font-semibold text-yellow-600">
                          {inv.reserved} xe
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Đã bán:</span>
                        <p className="font-semibold text-orange-600">
                          {inv.sold} xe
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Chưa có tồn kho tại đại lý nào</p>
          )}
        </div>

        {/* Contracts Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-blue-600" />
              Hợp đồng đã ký
            </h2>
            <div className="text-right">
              <p className="text-sm text-gray-600">Tổng hợp đồng</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.contractsStats.total}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Doanh thu: {formatMoney(data.contractsStats.totalRevenue)}
              </p>
            </div>
          </div>

          {/* Stats by Status */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {Object.entries(data.contractsStats.byStatus).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="p-3 bg-gray-50 rounded-lg text-center"
                >
                  <p className="text-sm text-gray-600">
                    {getStatusLabel(status)}
                  </p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              )
            )}
          </div>

          {/* Contracts List */}
          {data.contracts.length > 0 ? (
            <div className="space-y-4">
              {data.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {contract.contractCode}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            contract.status
                          )}`}
                        >
                          {getStatusLabel(contract.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Ngày ký: {formatDate(contract.createdAt)}</span>
                        </div>
                        {contract.status === "COMPLETED" && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>
                              Ngày bán: {formatDate(contract.updatedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="text-lg font-bold text-gray-900">
                          {formatMoney(contract.finalPrice)}
                        </span>
                      </div>
                      {contract.discount > 0 && (
                        <p className="text-xs text-gray-500">
                          Giảm: {formatMoney(contract.discount)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Building className="w-4 h-4 mr-1" />
                        <span className="font-medium">Đại lý:</span>
                      </div>
                      <p className="text-gray-900">
                        {contract.staff.dealer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {contract.staff.dealer.city}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <User className="w-4 h-4 mr-1" />
                        <span className="font-medium">Khách hàng:</span>
                      </div>
                      <p className="text-gray-900">
                        {contract.customer.firstName}{" "}
                        {contract.customer.lastName}
                      </p>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>{contract.customer.phone}</p>
                        {contract.customer.email && (
                          <p>{contract.customer.email}</p>
                        )}
                        {contract.customer.address && (
                          <div className="flex items-start">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5" />
                            <span>
                              {contract.customer.address},{" "}
                              {contract.customer.city}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Chưa có hợp đồng nào cho xe này
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
