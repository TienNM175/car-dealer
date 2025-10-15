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

export default function ContractsPage() {
  const { user } = useAuth();
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

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await contractApi.getAllContracts(
        {
          search: searchTerm,
          status: filterStatus as any,
          dealerId: (user as any)?.dealerId, // Dealer chỉ xem contracts của mình
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
      const res = await contractApi.getContractsByStatus();
      setStatistics(res.data.data);
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterStatus]);

  const handleView = (contract: Contract) => {
    setViewingContract(contract);
    setShowDetailModal(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setShowForm(true);
  };

  const handleDelete = async (contract: Contract) => {
    if (!confirm(`Bạn có chắc muốn xóa hợp đồng ${contract.contractCode}?`)) {
      return;
    }

    try {
      await contractApi.deleteContract(contract.id);
      if (contracts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchContracts();
      }
    } catch (err) {
      console.error("Error deleting contract:", err);
      alert("Có lỗi xảy ra khi xóa hợp đồng");
    }
  };

  const handleCreate = () => {
    setEditingContract(null);
    setShowForm(true);
  };

  const handleSave = async (
    data: CreateContractInput | UpdateContractInput
  ) => {
    try {
      if (editingContract) {
        await contractApi.updateContract(editingContract.id, data);
      } else {
        await contractApi.createContract(data as CreateContractInput);
      }
      setShowForm(false);
      setEditingContract(null);
      fetchContracts();
      fetchStatistics();
    } catch (err) {
      console.error("Error saving contract:", err);
    }
  };

  const handleStatusChange = async (
    contractId: string,
    newStatus: Contract["status"]
  ) => {
    try {
      await contractApi.updateContractStatus(contractId, { status: newStatus });
      fetchContracts();
      fetchStatistics();
    } catch (err) {
      console.error("Error updating contract status:", err);
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

  // Determine user role for permissions
  const userRole = user?.role?.toUpperCase() as
    | "DEALER_STAFF"
    | "DEALER_MANAGER"
    | undefined;

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
        onDeleteClick={handleDelete}
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
          userId={(user as any)?.userId} // Pass userId as staffId
        />
      )}

      {/* Contract Detail Modal */}
      {showDetailModal && (
        <ContractDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setViewingContract(null);
          }}
          contract={viewingContract}
          onStatusChange={handleStatusChange}
          onEditClick={handleEdit}
          userRole={userRole || "DEALER_STAFF"}
        />
      )}
    </div>
  );
}
