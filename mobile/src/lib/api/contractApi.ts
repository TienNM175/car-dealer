import axiosClient from "../utils/axiosClient";

export interface Contract {
  id: string;
  contractCode: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  vehicle: {
    id: string;
    model: string;
    manufacturer: {
      id: string;
      name: string;
    };
  };
  basePrice: number;
  discount: number;
  finalPrice: number;
  paymentType: "FULL" | "INSTALLMENT";
  installmentMonths?: number;
  interestRate?: number;
  status: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractFilters {
  search?: string;
  status?: string;
  customerId?: string;
  paymentType?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CreateContractInput {
  customerId: string;
  vehicleId: string;
  staffId?: string;
  basePrice: number;
  discount?: number;
  paymentType: "FULL" | "INSTALLMENT";
  installmentMonths?: number;
  interestRate?: number;
  notes?: string;
}

export interface UpdateContractInput extends Partial<CreateContractInput> {}

export const contractApi = {
  // Get all contracts
  getAllContracts: (
    filters?: ContractFilters,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.customerId) params.append("customerId", filters.customerId);
    if (filters?.paymentType) params.append("paymentType", filters.paymentType);

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.limit) params.append("limit", pagination.limit.toString());

    return axiosClient.get<{ data: { data: Contract[]; meta: any } }>(
      `/contracts?${params.toString()}`
    );
  },

  // Get contract by ID
  getContractById: (id: string) => {
    return axiosClient.get<{ data: Contract }>(`/contracts/${id}`);
  },

  // Create contract
  createContract: (data: CreateContractInput) => {
    return axiosClient.post<{ data: Contract }>("/contracts", data);
  },

  // Update contract
  updateContract: (id: string, data: UpdateContractInput) => {
    return axiosClient.put<{ data: Contract }>(`/contracts/${id}`, data);
  },

  // Update contract status
  updateContractStatus: (id: string, status: string) => {
    return axiosClient.patch<{ data: Contract }>(`/contracts/${id}/status`, {
      status,
    });
  },

  // Delete contract
  deleteContract: (id: string) => {
    return axiosClient.delete(`/contracts/${id}`);
  },
};
