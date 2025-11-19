// frontend/src/lib/api/contractApi.ts
import axiosClient from "../utils/axiosClient";

export interface Contract {
  id: string;
  customerId: string;
  vehicleId: string;
  staffId: string;
  contractType?: "SALES" | "DEPOSIT";
  dealerId?: string;
  quotationId?: string;
  promotionId?: string;
  salesContractId?: string; // Link to SALES contract if this is a DEPOSIT contract that was converted
  contractCode: string; // Backend uses contractCode
  contractNumber: string; // Alias for contractCode (display purpose)
  basePrice: number;
  discount: number;
  tax: number; // Thuế VAT
  finalPrice: number;
  depositAmount?: number;
  paymentType: "FULL" | "INSTALLMENT";
  installmentMonths?: number;
  monthlyPayment?: number;
  interestRate?: number;
  vehicleUnitId?: string;
  status:
    | "DRAFT"
    | "PENDING"
    | "SIGNED"
    | "DELIVERING"
    | "COMPLETED"
    | "CANCELLED";
  deliveryDate?: string;
  deliveredAt?: string;
  notes?: string;
  signedAt?: string;
  customerSignature?: string | null;
  dealerSignature?: string | null;
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
    address?: string;
    identityCard?: string;
  };
  vehicle?: {
    id: string;
    model: string;
    variant?: string;
    year?: number;
    color?: string;
    batteryCapacity?: number;
    range?: number;
    motorPower?: number;
    manufacturer: {
      name: string;
    };
  };
  dealer?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    city?: string;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    dealerId?: string;
    dealer?: {
      id: string;
      name: string;
    };
  };
  promotion?: {
    id: string;
    title: string;
    code: string;
    discountType: string;
    discountValue: number;
  };
  vehicleUnit?: {
    id: string;
    vin: string;
    engineNumber?: string | null;
    batterySerial?: string | null;
    color?: string | null;
    status: string;
    storageType: string;
    dealerId?: string | null;
    reservedAt?: string | null;
    deliveredAt?: string | null;
    location?: string | null;
  } | null;
  exportDocuments?: Array<{
    id: string;
    code: string;
    status: string;
    issuedAt?: string | null;
    approvedAt?: string | null;
    cancelledAt?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    recipientId?: string | null;
    recipientAddress?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
    approvedBy?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }>;
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
  vehicleUnitId?: string;
  staffId: string; // Required by backend
  quotationId?: string;
  promotionId?: string;
  basePrice: number; // Backend expects basePrice
  discount?: number;
  tax?: number; // Thuế VAT (mặc định 10%)
  paymentType: Contract["paymentType"];
  installmentMonths?: number;
  interestRate?: number; // Required for installment calculation
  deliveryDate?: string;
  notes?: string;
  contractType?: "SALES" | "DEPOSIT";
  depositAmount?: number;
  customerSignature?: string | null;
  dealerSignature?: string | null;
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

  assignVehicleUnit: (id: string, vehicleUnitId: string | null) =>
    axiosClient.patch(`/contracts/${id}/assign-vehicle-unit`, {
      vehicleUnitId,
    }),

  // Get contracts by status count
  getContractsByStatus: () => axiosClient.get("/contracts/by-status"),

  // Get contract statistics
  getContractStatistics: () =>
    axiosClient.get<{ data: ContractStatistics }>("/contracts/statistics"),

  // Create SALES contract from DEPOSIT contract
  createSalesFromDeposit: (
    depositContractId: string,
    data: Partial<CreateContractInput>
  ) => axiosClient.post(`/contracts/${depositContractId}/create-sales`, data),
};
