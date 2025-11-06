"use client";
import React, { useEffect, useState } from "react";
import ContractList from "@/components/contracts/ContractList";
import ContractForm from "@/components/contracts/ContractForm";
import ContractDetailModal from "@/components/contracts/ContractDetailModal";
import {
  Contract,
  contractApi,
  CreateContractInput,
  UpdateContractInput,
} from "@/lib/api/contractApi";
import { useAuth } from "@/contexts/AuthContext";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function ContractsPage() {
  const { user } = useAuth();

  // Determine user role for permissions
  const userRole = user?.role?.toUpperCase() as
    | "DEALER_STAFF"
    | "DEALER_MANAGER"
    | "ADMIN"
    | undefined;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [viewingContractLoading, setViewingContractLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    contract: Contract | null;
    loading: boolean;
  }>({ open: false, contract: null, loading: false });

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await contractApi.getAllContracts(
        {
          search: searchTerm,
          status: filterStatus as any,
          // ADMIN xem tất cả, DEALER chỉ xem của mình
          dealerId: userRole === "ADMIN" ? undefined : (user as any)?.dealerId,
        },
        { page, limit }
      );

      const responseData = res.data.data || res.data;
      const contracts = responseData.data || responseData;
      const meta = responseData.meta || res.data.meta;

      setContracts(Array.isArray(contracts) ? contracts : []);
      setTotal(meta?.total || contracts?.length || 0);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setContracts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Only fetch statistics for DEALER_MANAGER and above
      if (userRole === "DEALER_STAFF") {
        setStatistics({ total: 0, byStatus: {} });
        return;
      }

      const res = await contractApi.getContractsByStatus();
      const data = res.data.data;

      // Transform array to object format expected by UI
      if (Array.isArray(data)) {
        const byStatus = data.reduce((acc: any, item: any) => {
          acc[item.status] = item.count;
          return acc;
        }, {});

        setStatistics({
          total: data.reduce((sum: number, item: any) => sum + item.count, 0),
          byStatus,
        });
      } else {
        setStatistics(data);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterStatus]);

  const fetchContractDetail = async (contractId: string) => {
    try {
      setViewingContractLoading(true);
      const res = await contractApi.getContractById(contractId);
      const data = res.data.data || res.data;
      setViewingContract(data);
      return data;
    } catch (err) {
      console.error("Error fetching contract detail:", err);
      throw err;
    } finally {
      setViewingContractLoading(false);
    }
  };

  const handleView = async (contract: Contract) => {
    setShowDetailModal(true);
    setViewingContract(contract);
    try {
      await fetchContractDetail(contract.id);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể tải chi tiết hợp đồng."
      );
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setShowForm(true);
  };

  const openDeleteDialog = (contract: Contract) => {
    setDeleteDialog({ open: true, contract, loading: false });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, contract: null, loading: false });
  };

  const confirmDeleteContract = async () => {
    const target = deleteDialog.contract;
    if (!target) return;

    try {
      setDeleteDialog((prev) => ({ ...prev, loading: true }));
      await contractApi.deleteContract(target.id);
      if (contracts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchContracts();
      }
      toast.success(`Đã xóa hợp đồng ${target.contractCode}.`);
    } catch (err: any) {
      console.error("Error deleting contract:", err);
      const errorMessage =
        err?.response?.data?.message || "Có lỗi xảy ra khi xóa hợp đồng";
      toast.error(errorMessage);
    } finally {
      closeDeleteDialog();
    }
  };

  const handleCreate = () => {
    setEditingContract(null);
    setShowForm(true);
  };

  const handleSave = async (contract: any) => {
    // Contract already created/updated in ContractForm
    // Just refresh the list
    console.log("✅ Contract saved, refreshing list...", contract);
    fetchContracts();
    fetchStatistics();
  };

  const handleStatusChange = async (
    contractId: string,
    newStatus: Contract["status"]
  ) => {
    try {
      await contractApi.updateContractStatus(contractId, { status: newStatus });
      fetchContracts();
      fetchStatistics();
      if (viewingContract?.id === contractId) {
        await fetchContractDetail(contractId);
      }
    } catch (err: any) {
      console.error("Error updating contract status:", err);
      const errorMessage =
        err?.response?.data?.message || "Có lỗi xảy ra khi cập nhật trạng thái";
      toast.error(errorMessage);
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      contracts.map((c) => ({
        "Số HĐ": c.contractCode, // Updated field name
        "Khách hàng": `${c.customer?.firstName} ${c.customer?.lastName}`,
        Xe: `${c.vehicle?.manufacturer?.name} ${c.vehicle?.model}`,
        "Giá gốc": c.basePrice, // Updated field name
        "Chiết khấu": c.discount || 0,
        "Thành tiền": c.finalPrice, // Updated field name
        "Thanh toán":
          c.paymentType === "FULL"
            ? "Trả thẳng"
            : `Trả góp ${c.installmentMonths} tháng (${c.interestRate}%/năm)`,
        "Trạng thái": c.status,
        "Ngày ký": c.signedAt ? new Date(c.signedAt).toLocaleDateString() : "",
        "Ngày tạo": new Date(c.createdAt).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hợp đồng");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `contracts_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6">
      <ContractList
        contracts={contracts}
        loading={loading}
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onFilterChange={(value) => {
          setFilterStatus(value);
          setPage(1);
        }}
        onCreateClick={handleCreate}
        onViewClick={handleView}
        onEditClick={handleEdit}
        onDeleteClick={openDeleteDialog}
        onExportClick={handleExport}
        userRole={userRole || "DEALER_STAFF"}
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }}
        onPageChange={handlePageChange}
        statistics={statistics}
      />

      {/* Contract Form Modal */}
      {showForm && (
        <ContractForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingContract(null);
          }}
          onSuccess={handleSave}
          contract={editingContract}
          dealerId={(user as any)?.dealerId}
          userId={(user as any)?.id} // Pass user.id as staffId
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

      <ConfirmDialog
        open={deleteDialog.open}
        title="Xóa hợp đồng"
        message={
          deleteDialog.contract
            ? `Bạn có chắc muốn xóa hợp đồng ${deleteDialog.contract.contractCode}? Hành động này không thể hoàn tác.`
            : "Bạn có chắc muốn xóa hợp đồng này?"
        }
        confirmLabel="Xóa hợp đồng"
        confirmButtonClassName="bg-red-600 hover:bg-red-700"
        isProcessing={deleteDialog.loading}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteContract}
      />

      {/* Contract Detail Modal */}
      {showDetailModal && (
        <ContractDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setViewingContract(null);
          }}
          contract={viewingContract}
          isLoading={viewingContractLoading}
          onStatusChange={handleStatusChange}
          onEditClick={handleEdit}
          userRole={userRole || "DEALER_STAFF"}
          onRefreshContract={async (id) => {
            const updated = await fetchContractDetail(id);
            fetchContracts();
            fetchStatistics();
            return updated;
          }}
        />
      )}
    </div>
  );
}
