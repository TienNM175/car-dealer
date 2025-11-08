// frontend/src/components/contracts/ContractDetailModal.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  Hash,
  Cpu,
  BatteryCharging,
  Truck,
  FilePlus,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ListChecks,
  RefreshCcw,
} from "lucide-react";
import { Contract, contractApi } from "@/lib/api/contractApi";
import { formatMoney } from "@/lib/utils/formatMoney";
import { vehicleExportDocumentApi } from "@/lib/api/vehicleExportDocumentApi";
import { vehicleUnitApi, VehicleUnitSummary } from "@/lib/api/vehicleUnitApi";
import { toast } from "react-hot-toast";

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onStatusChange?: (contractId: string, newStatus: Contract["status"]) => void;
  onEditClick?: (contract: Contract) => void;
  userRole?: "DEALER_STAFF" | "DEALER_MANAGER" | "EVM_STAFF" | "ADMIN";
  isLoading?: boolean;
  onRefreshContract?: (contractId: string) => Promise<Contract | void>;
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
  isLoading = false,
  onRefreshContract,
}: ContractDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [documentActionLoading, setDocumentActionLoading] = useState<
    string | null
  >(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<
    string | null
  >(null);
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    documentId: string;
    reason: string;
  }>({ open: false, documentId: "", reason: "" });
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    documentId: string;
  }>({ open: false, documentId: "" });
  const [exportForm, setExportForm] = useState({
    recipientName: "",
    recipientPhone: "",
    recipientId: "",
    recipientAddress: "",
    notes: "",
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUnits, setAvailableUnits] = useState<VehicleUnitSummary[]>(
    []
  );
  const [availableUnitsLoading, setAvailableUnitsLoading] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const exportStatusConfig = useMemo(
    () => ({
      DRAFT: {
        label: "Nháp",
        className: "bg-yellow-100 text-yellow-800",
      },
      APPROVED: {
        label: "Đã duyệt",
        className: "bg-green-100 text-green-800",
      },
      CANCELLED: {
        label: "Đã hủy",
        className: "bg-red-100 text-red-800",
      },
      ISSUED: {
        label: "Đã phát hành",
        className: "bg-blue-100 text-blue-800",
      },
    }),
    []
  );

  useEffect(() => {
    if (!contract) return;

    const customerFullName = `${contract.customer?.firstName || ""} ${
      contract.customer?.lastName || ""
    }`.trim();

    setExportForm((prev) => ({
      ...prev,
      recipientName: customerFullName || prev.recipientName,
      recipientPhone: contract.customer?.phone || prev.recipientPhone,
      recipientId: contract.customer?.identityCard || prev.recipientId,
      recipientAddress: contract.customer?.address || prev.recipientAddress,
    }));
  }, [contract]);

  if (!isOpen) return null;

  const exportDocuments = contract?.exportDocuments || [];
  const hasPendingExportDocument = exportDocuments.some(
    (doc) => doc.status === "DRAFT" || doc.status === "APPROVED"
  );
  const vehicleUnit = contract?.vehicleUnit;
  const dealerIdFromContract =
    contract?.dealer?.id || vehicleUnit?.dealerId || contract?.dealerId;
  const canCreateExportDocument =
    userRole === "DEALER_MANAGER" &&
    !!vehicleUnit?.id &&
    !!dealerIdFromContract &&
    !hasPendingExportDocument;
  const canManageVehicleUnit =
    userRole === "DEALER_MANAGER" &&
    !!dealerIdFromContract &&
    !!contract?.vehicleId;
  const canChangeVehicleUnit =
    !!vehicleUnit && canManageVehicleUnit && !hasPendingExportDocument;

  const currentStatusConfig = contract
    ? statusConfig[contract.status as keyof typeof statusConfig]
    : undefined;
  const availableTransitions = contract
    ? statusTransitions[contract.status] || []
    : [];

  const handleStatusChange = async (newStatus: Contract["status"]) => {
    if (!contract || !onStatusChange) return;

    setLoading(true);
    try {
      await onStatusChange(contract.id, newStatus);
      setShowStatusChange(false);
    } catch (error: any) {
      console.error("Error updating status:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Có lỗi xảy ra khi cập nhật trạng thái";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenExportModal = () => {
    if (!contract) return;
    const customerFullName = `${contract.customer?.firstName || ""} ${
      contract.customer?.lastName || ""
    }`.trim();
    setExportForm({
      recipientName: customerFullName || "",
      recipientPhone: contract.customer?.phone || "",
      recipientId: contract.customer?.identityCard || "",
      recipientAddress: contract.customer?.address || "",
      notes: "Xuất giấy xuất kho cho hợp đồng " + contract.contractCode,
    });
    setShowExportModal(true);
  };

  const loadAvailableUnits = async (
    vehicleId: string,
    dealerId: string,
    options?: { keepModal?: boolean }
  ) => {
    if (!options?.keepModal) {
      setAvailableUnits([]);
    }
    setAvailableUnitsLoading(true);
    try {
      const res = await vehicleUnitApi.getAvailableUnits(vehicleId, dealerId);
      const payload: any = res.data?.data ?? res.data;
      const units: VehicleUnitSummary[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setAvailableUnits(units);
      if (units.length > 0) {
        setSelectedUnitId((prev) => prev || units[0].id);
      } else {
        setSelectedUnitId("");
      }
    } catch (error: any) {
      console.error("Error loading available vehicle units:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách xe khả dụng."
      );
    } finally {
      setAvailableUnitsLoading(false);
    }
  };

  const handleOpenAssignModal = async () => {
    if (!contract?.vehicleId || !dealerIdFromContract) {
      toast.error(
        "Không xác định được xe hoặc đại lý. Vui lòng kiểm tra lại hợp đồng."
      );
      return;
    }

    setShowAssignModal(true);
    await loadAvailableUnits(contract.vehicleId, dealerIdFromContract, {
      keepModal: true,
    });
  };

  const handleAssignVehicleUnit = async () => {
    if (!contract) return;
    if (!selectedUnitId) {
      toast.error("Vui lòng chọn một xe (VIN) để gán cho hợp đồng.");
      return;
    }

    setAssignSubmitting(true);
    try {
      await contractApi.assignVehicleUnit(contract.id, selectedUnitId);
      toast.success("Đã gán xe cho hợp đồng.");
      setShowAssignModal(false);
      setSelectedUnitId("");
      if (onRefreshContract) {
        await onRefreshContract(contract.id);
      }
    } catch (error: any) {
      console.error("Error assigning vehicle unit:", error);
      const errorMessage =
        error?.response?.data?.message || "Không thể gán xe cho hợp đồng.";
      toast.error(errorMessage);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleRefreshAvailableUnits = async () => {
    if (!contract?.vehicleId || !dealerIdFromContract) return;
    await loadAvailableUnits(contract.vehicleId, dealerIdFromContract, {
      keepModal: true,
    });
  };

  const handleExportFormChange = (
    field: keyof typeof exportForm,
    value: string
  ) => {
    setExportForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateExportDocument = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!contract) return;

    if (!contract.vehicleUnit?.id) {
      toast.error(
        "Hợp đồng chưa gắn xe (VIN). Vui lòng gán trước khi xuất giấy."
      );
      return;
    }

    const dealerId =
      contract.dealer?.id ||
      contract.vehicleUnit?.dealerId ||
      contract.dealerId;

    if (!dealerId) {
      toast.error(
        "Không xác định được đại lý. Vui lòng kiểm tra lại dữ liệu hợp đồng."
      );
      return;
    }

    if (!exportForm.recipientName.trim()) {
      toast.error("Vui lòng nhập tên người nhận.");
      return;
    }

    setExportSubmitting(true);
    try {
      await vehicleExportDocumentApi.create({
        vehicleUnitId: contract.vehicleUnit.id,
        dealerId,
        contractId: contract.id,
        recipientName: exportForm.recipientName.trim(),
        recipientPhone: exportForm.recipientPhone || undefined,
        recipientId: exportForm.recipientId || undefined,
        recipientAddress: exportForm.recipientAddress || undefined,
        notes: exportForm.notes || undefined,
      });

      toast.success("Đã tạo Giấy xuất kho ở trạng thái NHÁP.");
      setShowExportModal(false);
      if (onRefreshContract) {
        await onRefreshContract(contract.id);
      }
    } catch (error: any) {
      console.error("Error creating export document:", error);
      const errorMessage =
        error?.response?.data?.message || "Không thể tạo Giấy xuất kho.";
      toast.error(errorMessage);
    } finally {
      setExportSubmitting(false);
    }
  };

  const handleApproveDocument = (documentId: string) => {
    if (!contract) return;
    setApproveDialog({ open: true, documentId });
  };

  const handleOpenCancelDialog = (documentId: string) => {
    setCancelDialog({ open: true, documentId, reason: "" });
  };

  const handleSubmitCancelDocument = async () => {
    if (!contract || !cancelDialog.documentId) return;

    try {
      setDocumentActionLoading(cancelDialog.documentId);
      await vehicleExportDocumentApi.cancel(cancelDialog.documentId, {
        reason: cancelDialog.reason || undefined,
        notes: cancelDialog.reason || undefined,
      });
      toast.success("Đã hủy Giấy xuất kho.");
      if (onRefreshContract) {
        await onRefreshContract(contract.id);
      }
      setCancelDialog({ open: false, documentId: "", reason: "" });
    } catch (error: any) {
      console.error("Error cancelling export document:", error);
      const errorMessage =
        error?.response?.data?.message || "Không thể hủy Giấy xuất kho.";
      toast.error(errorMessage);
    } finally {
      setDocumentActionLoading(null);
    }
  };

  const handleCloseCancelDialog = () => {
    setCancelDialog({ open: false, documentId: "", reason: "" });
  };

  const handleConfirmApproveDocument = async () => {
    if (!contract || !approveDialog.documentId) return;

    try {
      setDocumentActionLoading(approveDialog.documentId);
      await vehicleExportDocumentApi.approve(approveDialog.documentId);
      toast.success("Đã duyệt Giấy xuất kho.");
      if (onRefreshContract) {
        await onRefreshContract(contract.id);
      }
      setApproveDialog({ open: false, documentId: "" });
    } catch (error: any) {
      console.error("Error approving export document:", error);
      const errorMessage =
        error?.response?.data?.message || "Không thể duyệt Giấy xuất kho.";
      toast.error(errorMessage);
    } finally {
      setDocumentActionLoading(null);
    }
  };

  const handleDownloadDocument = async (documentId: string, code: string) => {
    try {
      setDownloadingDocumentId(documentId);
      const response = await vehicleExportDocumentApi.download(documentId);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải Giấy xuất kho.");
    } catch (error: any) {
      console.error("Error downloading export document:", error);
      const errorMessage =
        error?.response?.data?.message || "Không thể tải Giấy xuất kho.";
      toast.error(errorMessage);
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const canEdit =
    contract?.status === "DRAFT" || contract?.status === "PENDING";
  const canChangeStatus = availableTransitions.length > 0 && !loading;

  if (!contract || isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
        <div className="bg-white shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-300 items-center justify-center gap-4 py-12">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-700 font-medium">
            Đang tải chi tiết hợp đồng...
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

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

          {/* Vehicle Unit Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Thông tin xe (VIN)
              </h3>
              {!vehicleUnit && (
                <span className="inline-flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  Chưa gán xe cụ thể
                </span>
              )}
            </div>

            {vehicleUnit ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">VIN</p>
                      <p className="font-semibold text-gray-900">
                        {vehicleUnit.vin}
                      </p>
                    </div>
                  </div>
                  {vehicleUnit.engineNumber && (
                    <div className="flex items-center gap-3">
                      <Cpu className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Số động cơ</p>
                        <p className="font-medium text-gray-900">
                          {vehicleUnit.engineNumber}
                        </p>
                      </div>
                    </div>
                  )}
                  {vehicleUnit.batterySerial && (
                    <div className="flex items-center gap-3">
                      <BatteryCharging className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">PIN/Battery</p>
                        <p className="font-medium text-gray-900">
                          {vehicleUnit.batterySerial}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                      <ShieldCheck className="w-4 h-4" />
                      {vehicleUnit.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kho lưu trữ</p>
                    <p className="font-medium text-gray-900">
                      {vehicleUnit.storageType === "DEALER"
                        ? "Tại đại lý"
                        : "Kho hãng (EVM)"}
                    </p>
                  </div>
                  {vehicleUnit.location && (
                    <div>
                      <p className="text-sm text-gray-600">Vị trí</p>
                      <p className="font-medium text-gray-900">
                        {vehicleUnit.location}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Giữ chỗ</p>
                      <p className="font-medium text-gray-900">
                        {vehicleUnit.reservedAt
                          ? new Date(vehicleUnit.reservedAt).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Giao xe</p>
                      <p className="font-medium text-gray-900">
                        {vehicleUnit.deliveredAt
                          ? new Date(
                              vehicleUnit.deliveredAt
                            ).toLocaleDateString("vi-VN")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
                {canChangeVehicleUnit && (
                  <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleOpenAssignModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Đổi xe khác
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  Hãy gán một xe cụ thể (VIN) cho hợp đồng trước khi xuất Giấy
                  xuất kho.
                </p>
                {canManageVehicleUnit && (
                  <button
                    onClick={handleOpenAssignModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <ListChecks className="w-4 h-4" />
                    Chọn xe (VIN)
                  </button>
                )}
              </div>
            )}
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
                      <span className="text-gray-600">Thuế VAT:</span>
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

          {/* Export Documents */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Giấy xuất kho
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý chứng từ phục vụ đăng ký xe cho khách hàng
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hasPendingExportDocument && (
                  <span className="text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    Đã có giấy xuất kho đang hiệu lực
                  </span>
                )}
                <button
                  onClick={handleOpenExportModal}
                  disabled={!canCreateExportDocument}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                    canCreateExportDocument
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <FilePlus className="w-4 h-4" />
                  Xuất giấy xuất kho
                </button>
              </div>
            </div>

            {exportDocuments.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                Chưa có Giấy xuất kho nào cho hợp đồng này.
              </div>
            ) : (
              <div className="space-y-3">
                {exportDocuments.map((doc) => {
                  const statusInfo =
                    exportStatusConfig[
                      doc.status as keyof typeof exportStatusConfig
                    ] || exportStatusConfig.DRAFT;
                  return (
                    <div
                      key={doc.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-800">
                            {doc.code}
                          </span>
                          <span
                            className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full ${statusInfo.className}`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                          <p>
                            <span className="text-gray-500">Người nhận:</span>{" "}
                            <span className="text-gray-800 font-medium">
                              {doc.recipientName || "(Chưa cập nhật)"}
                            </span>
                          </p>
                          <p>
                            <span className="text-gray-500">SĐT:</span>{" "}
                            <span className="text-gray-800">
                              {doc.recipientPhone || "-"}
                            </span>
                          </p>
                          <p>
                            <span className="text-gray-500">CMND/CCCD:</span>{" "}
                            <span className="text-gray-800">
                              {doc.recipientId || "-"}
                            </span>
                          </p>
                          <p>
                            <span className="text-gray-500">Ngày tạo:</span>{" "}
                            <span className="text-gray-800">
                              {new Date(doc.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </p>
                          {doc.approvedAt && (
                            <p>
                              <span className="text-gray-500">Duyệt:</span>{" "}
                              <span className="text-gray-800">
                                {new Date(doc.approvedAt).toLocaleString(
                                  "vi-VN"
                                )}
                              </span>
                            </p>
                          )}
                          {doc.cancelledAt && (
                            <p>
                              <span className="text-gray-500">Hủy:</span>{" "}
                              <span className="text-gray-800">
                                {new Date(doc.cancelledAt).toLocaleString(
                                  "vi-VN"
                                )}
                              </span>
                            </p>
                          )}
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-gray-500 bg-gray-100 rounded px-3 py-2">
                            {doc.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center">
                        {doc.status === "APPROVED" ? (
                          <button
                            onClick={() =>
                              handleDownloadDocument(doc.id, doc.code)
                            }
                            disabled={downloadingDocumentId === doc.id}
                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm flex items-center gap-2 disabled:opacity-60"
                          >
                            {downloadingDocumentId === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            Tải PDF
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                            Chứng từ cần được duyệt để tải PDF
                          </span>
                        )}

                        {userRole === "DEALER_MANAGER" &&
                          doc.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => handleApproveDocument(doc.id)}
                                disabled={documentActionLoading === doc.id}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2 disabled:opacity-60"
                              >
                                {documentActionLoading === doc.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleOpenCancelDialog(doc.id)}
                                disabled={documentActionLoading === doc.id}
                                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm flex items-center gap-2 disabled:opacity-60"
                              >
                                {documentActionLoading === doc.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                Hủy
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Xuất giấy xuất kho
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vui lòng xác nhận thông tin người nhận trước khi tạo chứng từ.
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateExportDocument}>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Người nhận (bắt buộc)
                </label>
                <input
                  value={exportForm.recipientName}
                  onChange={(e) =>
                    handleExportFormChange("recipientName", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Họ và tên người nhận"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Số điện thoại
                  </label>
                  <input
                    value={exportForm.recipientPhone}
                    onChange={(e) =>
                      handleExportFormChange("recipientPhone", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Ví dụ: 0901234567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    CMND/CCCD
                  </label>
                  <input
                    value={exportForm.recipientId}
                    onChange={(e) =>
                      handleExportFormChange("recipientId", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Số giấy tờ tuỳ thân"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Địa chỉ người nhận
                </label>
                <input
                  value={exportForm.recipientAddress}
                  onChange={(e) =>
                    handleExportFormChange("recipientAddress", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Địa chỉ thường trú"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  value={exportForm.notes}
                  onChange={(e) =>
                    handleExportFormChange("notes", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                  rows={3}
                  placeholder="Thông tin bổ sung trên giấy xuất kho"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={exportSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
                >
                  {exportSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Tạo giấy xuất kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Hủy Giấy xuất kho
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vui lòng xác nhận lý do hủy (tuỳ chọn) trước khi tiếp tục.
                </p>
              </div>
              <button
                onClick={handleCloseCancelDialog}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Lý do hủy (tuỳ chọn)
              </label>
              <textarea
                value={cancelDialog.reason}
                onChange={(e) =>
                  setCancelDialog((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black"
                rows={3}
                placeholder="Nhập lý do hủy (nếu có)"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseCancelDialog}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmitCancelDocument}
                disabled={documentActionLoading === cancelDialog.documentId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60"
              >
                {documentActionLoading === cancelDialog.documentId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {approveDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Duyệt Giấy xuất kho
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Xác nhận duyệt chứng từ này để hoàn tất quy trình bàn giao xe.
                </p>
              </div>
              <button
                onClick={() =>
                  setApproveDialog({ open: false, documentId: "" })
                }
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setApproveDialog({ open: false, documentId: "" })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleConfirmApproveDocument}
                disabled={documentActionLoading === approveDialog.documentId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-60"
              >
                {documentActionLoading === approveDialog.documentId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Xác nhận duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Chọn xe (VIN) cho hợp đồng
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Danh sách xe đang có trạng thái IN_STOCK tại đại lý của hợp
                  đồng.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUnitId("");
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Hợp đồng:{" "}
                <span className="font-medium text-gray-800">
                  {contract.contractCode}
                </span>
              </div>
              <button
                onClick={handleRefreshAvailableUnits}
                disabled={availableUnitsLoading}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                {availableUnitsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
                Làm mới danh sách
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              {availableUnitsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span>Đang tải danh sách xe khả dụng...</span>
                </div>
              ) : availableUnits.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  Không có xe nào đang IN_STOCK tại đại lý này. Hãy kiểm tra lại
                  kho hoặc chuyển xe sang đại lý.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {availableUnits.map((unit) => (
                    <li key={unit.id} className="p-4 flex items-start gap-4">
                      <input
                        type="radio"
                        name="vehicle-unit"
                        value={unit.id}
                        checked={selectedUnitId === unit.id}
                        onChange={() => setSelectedUnitId(unit.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {unit.vin}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {unit.vehicle?.manufacturer?.name}{" "}
                            {unit.vehicle?.model}
                          </span>
                          {unit.color && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Màu: {unit.color}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                          {unit.engineNumber && (
                            <p>
                              <span className="text-gray-500">Số động cơ:</span>{" "}
                              <span className="text-gray-800">
                                {unit.engineNumber}
                              </span>
                            </p>
                          )}
                          {unit.batterySerial && (
                            <p>
                              <span className="text-gray-500">PIN:</span>{" "}
                              <span className="text-gray-800">
                                {unit.batterySerial}
                              </span>
                            </p>
                          )}
                          {unit.location && (
                            <p>
                              <span className="text-gray-500">Vị trí:</span>{" "}
                              <span className="text-gray-800">
                                {unit.location}
                              </span>
                            </p>
                          )}
                          <p>
                            <span className="text-gray-500">Trạng thái:</span>{" "}
                            <span className="text-gray-800">{unit.status}</span>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUnitId("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleAssignVehicleUnit}
                disabled={assignSubmitting || !selectedUnitId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
              >
                {assignSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Gán xe cho hợp đồng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
