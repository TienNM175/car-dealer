"use client";
import React, { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
} from "lucide-react";

interface UnifiedReportsProps {
  userRole: "dealer_staff" | "dealer_manager" | "evm_staff" | "evm_admin";
}

interface Report {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export default function UnifiedReports({ userRole }: UnifiedReportsProps) {
  const isDealer = userRole.startsWith("dealer");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Reports based on role
  const getReports = (): Report[] => {
    if (isDealer) {
      return [
        {
          id: "sales",
          title: "Báo cáo doanh số",
          description: "Thống kê doanh số bán hàng theo thời gian",
          icon: TrendingUp,
          color: "bg-blue-500",
        },
        {
          id: "inventory",
          title: "Báo cáo tồn kho",
          description: "Theo dõi xe có sẵn và đã bán",
          icon: Package,
          color: "bg-green-500",
        },
        {
          id: "customers",
          title: "Báo cáo khách hàng",
          description: "Phân tích khách hàng và xu hướng mua",
          icon: FileText,
          color: "bg-purple-500",
        },
        {
          id: "revenue",
          title: "Báo cáo doanh thu",
          description: "Chi tiết doanh thu và lợi nhuận",
          icon: DollarSign,
          color: "bg-orange-500",
        },
      ];
    } else {
      return [
        {
          id: "dealers",
          title: "Báo cáo đại lý",
          description: "Hiệu suất và doanh số của các đại lý",
          icon: TrendingUp,
          color: "bg-blue-500",
        },
        {
          id: "inventory",
          title: "Báo cáo tồn kho toàn hệ thống",
          description: "Tổng quan tồn kho tất cả đại lý",
          icon: Package,
          color: "bg-green-500",
        },
        {
          id: "distribution",
          title: "Báo cáo phân phối",
          description: "Thống kê giao hàng và logistics",
          icon: FileText,
          color: "bg-purple-500",
        },
        {
          id: "revenue",
          title: "Báo cáo doanh thu tổng",
          description: "Doanh thu toàn hệ thống đại lý",
          icon: DollarSign,
          color: "bg-orange-500",
        },
      ];
    }
  };

  const reports = getReports();

  const handleDownload = (reportId: string) => {
    console.log(
      `Downloading report: ${reportId} for period: ${selectedPeriod}`
    );
    // Implement download logic
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isDealer ? "Báo cáo Đại lý" : "Báo cáo Hệ thống"}
          </h2>
          <p className="text-gray-600 mt-1">
            {isDealer
              ? "Xem và tải xuống các báo cáo kinh doanh"
              : "Báo cáo tổng hợp từ tất cả đại lý"}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-1">
          <button
            onClick={() => setSelectedPeriod("week")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              selectedPeriod === "week"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setSelectedPeriod("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              selectedPeriod === "month"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setSelectedPeriod("quarter")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              selectedPeriod === "quarter"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Quý
          </button>
          <button
            onClick={() => setSelectedPeriod("year")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              selectedPeriod === "year"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Năm
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => handleDownload(report.id)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span className="font-medium">Tải xuống</span>
                </button>
                <button
                  aria-label="Chọn kỳ báo cáo"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Calendar className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Kỳ báo cáo:{" "}
              {selectedPeriod === "week"
                ? "Tuần này"
                : selectedPeriod === "month"
                ? "Tháng này"
                : selectedPeriod === "quarter"
                ? "Quý này"
                : "Năm nay"}
            </h3>
            <p className="text-blue-100">
              {isDealer
                ? "Tổng doanh số: 3.2 tỷ VNĐ | Tăng trưởng: +8%"
                : "Tổng doanh số hệ thống: 48.5 tỷ VNĐ | Tăng trưởng: +18%"}
            </p>
          </div>
          <FileText className="w-12 h-12 text-blue-200" />
        </div>
      </div>
    </div>
  );
}
