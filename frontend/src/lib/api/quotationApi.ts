// frontend/src/lib/api/quotationApi.ts
import axiosClient from "../utils/axiosClient";

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  vehicleId: string;
  staffId: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  paymentType: "FULL" | "INSTALLMENT";
  installmentMonths?: number;
  monthlyPayment?: number;
  validUntil: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  notes?: string;
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

export interface QuotationFilters {
  search?: string;
  customerId?: string;
  vehicleId?: string;
  staffId?: string;
  status?: Quotation["status"];
  minPrice?: number;
  maxPrice?: number;
  validFrom?: string;
  validTo?: string;
  paymentType?: Quotation["paymentType"];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateQuotationInput {
  customerId: string;
  vehicleId: string;
  staffId: string;
  basePrice: number;
  discount?: number;
  paymentType: Quotation["paymentType"];
  installmentMonths?: number;
  validUntil: string;
  notes?: string;
}

export interface UpdateQuotationInput extends Partial<CreateQuotationInput> {}

export interface UpdateQuotationStatusInput {
  status: Quotation["status"];
  notes?: string;
}

export interface QuotationStatistics {
  total: number;
  byStatus: {
    [key in Quotation["status"]]: number;
  };
  totalValue: number;
  averageValue: number;
  acceptanceRate: number;
  monthlyStats: {
    month: string;
    count: number;
    value: number;
  }[];
}

export const quotationApi = {
  // Get all quotations with filters and pagination
  getAllQuotations: (
    filters?: QuotationFilters,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.customerId) params.append("customerId", filters.customerId);
    if (filters?.vehicleId) params.append("vehicleId", filters.vehicleId);
    if (filters?.staffId) params.append("staffId", filters.staffId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.paymentType) params.append("paymentType", filters.paymentType);
    if (filters?.minPrice) params.append("minPrice", String(filters.minPrice));
    if (filters?.maxPrice) params.append("maxPrice", String(filters.maxPrice));
    if (filters?.validFrom) params.append("validFrom", filters.validFrom);
    if (filters?.validTo) params.append("validTo", filters.validTo);

    if (pagination?.page) params.append("page", String(pagination.page));
    if (pagination?.limit) params.append("limit", String(pagination.limit));
    if (pagination?.sortBy) params.append("sortBy", pagination.sortBy);
    if (pagination?.sortOrder) params.append("sortOrder", pagination.sortOrder);

    return axiosClient.get(`/quotations?${params.toString()}`);
  },

  // Get quotation by ID
  getQuotationById: (id: string) => axiosClient.get(`/quotations/${id}`),

  // Get quotation by quote number
  getQuotationByQuoteNumber: (quoteNumber: string) =>
    axiosClient.get(`/quotations/quote/${quoteNumber}`),

  // Get quotations by customer
  getQuotationsByCustomer: (customerId: string) =>
    axiosClient.get(`/quotations/customer/${customerId}`),

  // Create new quotation
  createQuotation: (data: CreateQuotationInput) =>
    axiosClient.post("/quotations", data),

  // Update quotation
  updateQuotation: (id: string, data: UpdateQuotationInput) =>
    axiosClient.put(`/quotations/${id}`, data),

  // Update quotation status
  updateQuotationStatus: (id: string, data: UpdateQuotationStatusInput) =>
    axiosClient.patch(`/quotations/${id}/status`, data),

  // Delete quotation (only DRAFT)
  deleteQuotation: (id: string) => axiosClient.delete(`/quotations/${id}`),

  // Get quotation statistics
  getQuotationStatistics: () =>
    axiosClient.get<{ data: QuotationStatistics }>("/quotations/statistics"),

  // Convert quotation to contract
  convertToContract: (quotationId: string) =>
    axiosClient.post(`/quotations/${quotationId}/convert-to-contract`),

  // Expire old quotations (Admin/EVM only)
  expireOldQuotations: () => axiosClient.post("/quotations/expire"),
};

