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
  userRole?: "DEALER_STAFF" | "DEALER_MANAGER";
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
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = contract.status === "DRAFT" || contract.status === "PENDING";
  const canChangeStatus = availableTransitions.length > 0 && !loading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border-2 border-gray-700 shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto modal-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">Chi tiết hợp đồng</h2>
              <p className="text-blue-100">#{contract.contractCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-white/30 ${currentStatusConfig?.color
                .replace("text-", "text-white bg-white/20")
                .replace("bg-", "")}`}
            >
              {React.createElement(currentStatusConfig?.icon || Clock, {
                className: "w-5 h-5 text-white",
              })}
              <span className="text-white font-medium">
                {currentStatusConfig?.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Description */}
          <div
            className={`${currentStatusConfig?.color} p-4 rounded-lg border`}
          >
            <div className="flex items-center gap-3">
              {React.createElement(currentStatusConfig?.icon || Clock, {
                className: "w-5 h-5",
              })}
              <div>
                <p className="font-medium">{currentStatusConfig?.label}</p>
                <p className="text-sm opacity-80">
                  {currentStatusConfig?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Thông tin khách hàng
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Họ tên</p>
                  <p className="font-medium text-gray-900">
                    {contract.customer?.firstName} {contract.customer?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {contract.customer?.email}
                  </p>
                </div>
                {contract.customer?.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Điện thoại</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      {contract.customer.phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Car className="w-5 h-5 text-green-600" />
                Thông tin xe
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Xe</p>
                  <p className="font-medium text-gray-900">
                    {contract.vehicle?.manufacturer?.name}{" "}
                    {contract.vehicle?.model}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Năm</p>
                    <p className="font-medium">N/A</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Màu sắc</p>
                    <p className="font-medium">N/A</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Chi tiết thanh toán
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Giá gốc</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatMoney(contract.basePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chiết khấu</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatMoney(contract.discount || 0)}
                  </p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Thành tiền</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMoney(contract.finalPrice)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Hình thức</p>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
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
                      <p className="text-sm text-gray-600">Trả trước</p>
                      <p className="font-semibold">{formatMoney(0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hàng tháng</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatMoney(contract.monthlyPayment || 0)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Ngày tạo</p>
                  <p className="font-medium">
                    {new Date(contract.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                {contract.signedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Ngày ký</p>
                    <p className="font-medium text-green-600">
                      {new Date(contract.signedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                )}
                {contract.completedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Ngày hoàn tất</p>
                    <p className="font-medium text-green-600">
                      {new Date(contract.completedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                )}
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
