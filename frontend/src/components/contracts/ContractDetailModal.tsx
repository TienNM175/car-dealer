// frontend/src/components/contracts/ContractDetailModal.tsx
"use client";
import React, { useState } from "react";
import {
  X,
  FileText,
  User,
  Car,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  Printer,
  Download,
  Edit,
  ArrowRight,
  Building,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Contract } from "@/lib/api/contractApi";
import { formatMoney } from "@/lib/utils/formatMoney";

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onStatusChange?: (contractId: string, newStatus: Contract["status"]) => void;
  onEditClick?: (contract: Contract) => void;
  userRole?: "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN";
}

const statusConfig = {
  DRAFT: {
    label: "Nháp",
    color: "bg-gray-100 text-gray-700",
    icon: Edit,
    description: "Hợp đồng đang được soạn thảo",
  },
  PENDING: {
    label: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
    description: "Chờ khách hàng xác nhận và ký",
  },
  SIGNED: {
    label: "Đã ký",
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
    description: "Hợp đồng đã được ký, chuẩn bị giao xe",
  },
  DELIVERING: {
    label: "Đang giao",
    color: "bg-purple-100 text-purple-700",
    icon: ArrowRight,
    description: "Đang trong quá trình giao xe cho khách",
  },
  COMPLETED: {
    label: "Hoàn tất",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
    description: "Hợp đồng hoàn tất, xe đã giao thành công",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
    description: "Hợp đồng đã bị hủy bỏ",
  },
};

const paymentTypeConfig = {
  FULL: { label: "Trả thẳng", color: "bg-green-100 text-green-700" },
  INSTALLMENT: { label: "Trả góp", color: "bg-blue-100 text-blue-700" },
};

// Valid status transitions
const statusTransitions: Record<Contract["status"], Contract["status"][]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["SIGNED", "CANCELLED"],
  SIGNED: ["DELIVERING", "CANCELLED"],
  DELIVERING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export default function ContractDetailModal({
  isOpen,
  onClose,
  contract,
  onStatusChange,
  onEditClick,
  userRole = "DEALER_STAFF",
}: ContractDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  if (!isOpen || !contract) return null;

  const currentStatusConfig =
    statusConfig[contract.status as keyof typeof statusConfig];
  const availableTransitions = statusTransitions[contract.status] || [];

  const handleStatusChange = async (newStatus: Contract["status"]) => {
    if (!onStatusChange) return;

    setLoading(true);
    try {
      await onStatusChange(contract.id, newStatus);
      setShowStatusChange(false);
    } catch (error: any) {
      console.error("Error updating status:", error);
      const errorMessage =
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = contract.status === "DRAFT" || contract.status === "PENDING";
  const canChangeStatus = availableTransitions.length > 0 && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
      <div className="bg-white shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-300">
        {/* Contract Header - Giống letterhead */}
        <div className="bg-white border-b-2 border-gray-800 p-4 relative">
          {/* Close button - góc phải */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center pr-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              HỢP ĐỒNG MUA BÁN XE ĐIỆN
            </h1>
            <div className="flex justify-center items-center gap-8 text-sm text-gray-600">
              <div>
                <p className="font-medium">Số hợp đồng:</p>
                <p className="text-blue-600 font-bold">
                  {contract.contractNumber}
                </p>
              </div>
              <div>
                <p className="font-medium">Ngày tạo:</p>
                <p className="text-black">
                  {new Date(contract.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <div>
                <p className="font-medium">Trạng thái:</p>
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${currentStatusConfig?.color}`}
                >
                  {React.createElement(currentStatusConfig?.icon || Clock, {
                    className: "w-3 h-3",
                  })}
                  {currentStatusConfig?.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 modal-scrollbar">
          {/* Section 1: Thông tin các bên */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              THÔNG TIN CÁC BÊN
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bên mua (Khách hàng) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-300 pb-2">
                  Bên mua (Khách hàng)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Họ và tên:</p>
                    <p className="font-medium text-black">
                      {contract.customer?.firstName}{" "}
                      {contract.customer?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-medium text-black">
                      {contract.customer?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại:</p>
                    <p className="font-medium text-black">
                      {contract.customer?.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa chỉ:</p>
                    <p className="font-medium text-black">
                      {contract.customer?.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bên bán (Đại lý) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-300 pb-2">
                  Bên bán (Đại lý)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Tên đại lý:</p>
                    <p className="font-medium text-black">
                      {contract.dealer?.name || "Đại lý EVM"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa chỉ:</p>
                    <p className="font-medium text-black">
                      {contract.dealer?.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Số điện thoại:</p>
                    <p className="font-medium text-black">
                      {contract.dealer?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Nhân viên phụ trách:
                    </p>
                    <p className="font-medium text-black">
                      {contract.staff?.firstName} {contract.staff?.lastName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Đối tượng hợp đồng */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              ĐỐI TƯỢNG HỢP ĐỒNG
            </h2>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Hãng xe:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.manufacturer?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phiên bản:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.variant || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Năm sản xuất:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.year}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Màu sắc:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.color}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dung lượng pin:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.batteryCapacity} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tầm hoạt động:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.range} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Công suất:</p>
                    <p className="font-medium text-black">
                      {contract.vehicle?.motorPower || "N/A"} kW
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Giá cả và thanh toán */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              GIÁ CẢ VÀ THANH TOÁN
            </h2>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Giá cả */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    Chi tiết giá cả
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giá niêm yết:</span>
                      <span className="font-medium text-black">
                        {formatMoney(contract.basePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Chiết khấu/Khuyến mãi:
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatMoney(contract.discount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Thuế VAT:
                      </span>
                      <span className="font-medium text-blue-600">
                        {formatMoney(contract.tax || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                      <span className="font-semibold text-gray-800">
                        TỔNG CỘNG PHẢI TRẢ:
                      </span>
                      <span className="font-bold text-lg text-green-600">
                        {formatMoney(contract.finalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hình thức thanh toán */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    Hình thức thanh toán
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">Phương thức:</span>
                      <span
                        className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                          paymentTypeConfig[contract.paymentType]?.color
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        {contract.paymentType === "INSTALLMENT" &&
                        contract.installmentMonths
                          ? `Trả góp ${contract.installmentMonths} tháng`
                          : paymentTypeConfig[contract.paymentType]?.label}
                      </span>
                    </div>

                    {contract.paymentType === "INSTALLMENT" && (
                      <>
                        <div>
                          <span className="text-gray-600">Lãi suất:</span>
                          <span className="ml-2 font-medium text-black">
                            {contract.interestRate}% / năm
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Trả hàng tháng:</span>
                          <span className="ml-2 font-bold text-blue-600">
                            {formatMoney(contract.monthlyPayment || 0)}
                          </span>
                        </div>
                      </>
                    )}

                    <div>
                      <span className="text-gray-600">
                        Ngày giao xe dự kiến:
                      </span>
                      <span className="ml-2 font-medium text-black">
                        {contract.deliveryDate
                          ? new Date(contract.deliveryDate).toLocaleDateString(
                              "vi-VN"
                            )
                          : "Chưa xác định"}
                      </span>
                    </div>

                    {contract.promotion && (
                      <div>
                        <span className="text-gray-600">Mã khuyến mãi:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {contract.promotion.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staff & Dealer Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Thông tin đại lý & nhân viên
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nhân viên phụ trách</p>
                  <p className="font-medium text-gray-900">
                    {contract.staff?.firstName} {contract.staff?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Đại lý</p>
                  <p className="font-medium text-gray-900">N/A</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Mã đại lý</p>
                  <p className="font-medium text-gray-900">N/A</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Địa điểm</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    N/A
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {contract.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                Ghi chú
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {contract.notes}
              </p>
            </div>
          )}

          {/* Status Change Section */}
          {canChangeStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800">
                  Cập nhật trạng thái hợp đồng
                </h3>
                <button
                  onClick={() => setShowStatusChange(!showStatusChange)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showStatusChange ? "Hủy" : "Thay đổi trạng thái"}
                </button>
              </div>

              {showStatusChange && (
                <div className="space-y-4">
                  <p className="text-sm text-blue-700">
                    Chọn trạng thái mới cho hợp đồng:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableTransitions.map((status) => {
                      const statusInfo =
                        statusConfig[status as keyof typeof statusConfig];
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          disabled={loading}
                          className={`flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${statusInfo?.color
                            .replace("text-", "text-")
                            .replace("bg-", "bg-white border-")}`}
                        >
                          {React.createElement(statusInfo?.icon || Clock, {
                            className: "w-5 h-5",
                          })}
                          <div className="text-left">
                            <p className="font-medium">{statusInfo?.label}</p>
                            <p className="text-xs opacity-80">
                              {statusInfo?.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>

            {canEdit && onEditClick && (
              <button
                onClick={() => onEditClick(contract)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              In hợp đồng
            </button>

            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Tải xuống PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
