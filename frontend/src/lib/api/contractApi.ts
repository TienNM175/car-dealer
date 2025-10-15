// frontend/src/lib/api/contractApi.ts
import axiosClient from "../utils/axiosClient";

export interface Contract {
  id: string;
  customerId: string;
  vehicleId: string;
  dealerId: string;
  staffId: string;
  contractNumber: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  currency: string;
  paymentType: "FULL" | "INSTALLMENT";
  installmentMonths?: number;
  downPayment?: number;
  monthlyPayment?: number;
  status:
    | "DRAFT"
    | "PENDING"
    | "APPROVED"
    | "SIGNED"
    | "COMPLETED"
    | "CANCELLED";
  notes?: string;
  signedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  vehicle?: {
    id: string;
    model: string;
    manufacturer: {
      name: string;
    };
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ContractFilters {
  search?: string;
  customerId?: string;
  vehicleId?: string;
  dealerId?: string;
  staffId?: string;
  status?: Contract["status"];
  paymentType?: Contract["paymentType"];
  minAmount?: number;
  maxAmount?: number;
  signedFrom?: string;
  signedTo?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateContractInput {
  customerId: string;
  vehicleId: string;
  totalAmount: number;
  discount?: number;
  paymentType: Contract["paymentType"];
  installmentMonths?: number;
  downPayment?: number;
  notes?: string;
}

export interface UpdateContractInput extends Partial<CreateContractInput> {}

export interface UpdateContractStatusInput {
  status: Contract["status"];
  notes?: string;
}

export interface ContractStatistics {
  total: number;
  byStatus: {
    [key in Contract["status"]]: number;
  };
  totalValue: number;
  averageValue: number;
  byPaymentType: {
    FULL: number;
    INSTALLMENT: number;
  };
  monthlyStats: {
    month: string;
    count: number;
    value: number;
  }[];
}

export const contractApi = {
  // Get all contracts with filters and pagination
  getAllContracts: (
    filters?: ContractFilters,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.customerId) params.append("customerId", filters.customerId);
    if (filters?.vehicleId) params.append("vehicleId", filters.vehicleId);
    if (filters?.dealerId) params.append("dealerId", filters.dealerId);
    if (filters?.staffId) params.append("staffId", filters.staffId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.paymentType) params.append("paymentType", filters.paymentType);
    if (filters?.minAmount)
      params.append("minAmount", String(filters.minAmount));
    if (filters?.maxAmount)
      params.append("maxAmount", String(filters.maxAmount));
    if (filters?.signedFrom) params.append("signedFrom", filters.signedFrom);
    if (filters?.signedTo) params.append("signedTo", filters.signedTo);

    if (pagination?.page) params.append("page", String(pagination.page));
    if (pagination?.limit) params.append("limit", String(pagination.limit));
    if (pagination?.sortBy) params.append("sortBy", pagination.sortBy);
    if (pagination?.sortOrder) params.append("sortOrder", pagination.sortOrder);

    return axiosClient.get(`/contracts?${params.toString()}`);
  },

  // Get contract by ID
  getContractById: (id: string) => axiosClient.get(`/contracts/${id}`),

  // Create new contract
  createContract: (data: CreateContractInput) =>
    axiosClient.post("/contracts", data),

  // Update contract (only DRAFT/PENDING)
  updateContract: (id: string, data: UpdateContractInput) =>
    axiosClient.put(`/contracts/${id}`, data),

  // Update contract status
  updateContractStatus: (id: string, data: UpdateContractStatusInput) =>
    axiosClient.patch(`/contracts/${id}/status`, data),

  // Delete contract (only DRAFT)
  deleteContract: (id: string) => axiosClient.delete(`/contracts/${id}`),

  // Get contracts by status count
  getContractsByStatus: () => axiosClient.get("/contracts/by-status"),

  // Get contract statistics
  getContractStatistics: () =>
    axiosClient.get<{ data: ContractStatistics }>("/contracts/statistics"),
};
