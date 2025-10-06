// frontend/src/lib/api/customerApi.ts
import axiosClient from "../utils/axiosClient";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  identityCard?: string;
  status: 'INTERESTED' | 'CONTACTED' | 'TEST_DRIVE' | 'QUOTED' | 'PURCHASED' | 'COLD';
  createdAt: string;
  updatedAt: string;
  _count?: {
    contracts: number;
    quotations: number;
    testDrives: number;
    feedbacks: number;
    complaints: number;
  };
}

export interface CustomerFilters {
  search?: string;
  status?: string;
  city?: string;
  dealerId?: string;
  hasContract?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  identityCard?: string;
  status?: Customer['status'];
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface LifecycleEvent {
  id: string;
  customerId: string;
  status: Customer['status'];
  notes?: string;
  changedBy?: string;
  createdAt: string;
}

export interface AddLifecycleInput {
  status: Customer['status'];
  notes?: string;
}

export interface CustomerStatistics {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
  };
  counts: {
    contracts: number;
    quotations: number;
    testDrives: number;
    feedbacks: number;
    complaints: number;
  };
  financial: {
    totalPurchases: number;
    numberOfPurchases: number;
    totalDebt: number;
    paidAmount: number;
    remainingDebt: number;
  };
  satisfaction: {
    averageRating: number;
    totalFeedbacks: number;
  };
}

export const customerApi = {
  // Get all customers with filters and pagination
  getAllCustomers: (filters?: CustomerFilters, pagination?: PaginationParams) => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.dealerId) params.append('dealerId', filters.dealerId);
    if (filters?.hasContract !== undefined) params.append('hasContract', String(filters.hasContract));
    
    if (pagination?.page) params.append('page', String(pagination.page));
    if (pagination?.limit) params.append('limit', String(pagination.limit));
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    return axiosClient.get(`/customers?${params.toString()}`);
  },

  // Get customer by ID
  getCustomerById: (id: string) => 
    axiosClient.get(`/customers/${id}`),

  // Create new customer
  createCustomer: (data: CreateCustomerInput) => 
    axiosClient.post('/customers', data),

  // Update customer
  updateCustomer: (id: string, data: UpdateCustomerInput) => 
    axiosClient.put(`/customers/${id}`, data),

  // Delete customer
  deleteCustomer: (id: string) => 
    axiosClient.delete(`/customers/${id}`),

  // Get customer lifecycle
  getCustomerLifecycle: (id: string) => 
    axiosClient.get(`/customers/${id}/lifecycle`),

  // Add lifecycle event
  addLifecycleEvent: (id: string, data: AddLifecycleInput) => 
    axiosClient.post(`/customers/${id}/lifecycle`, data),

  // Get customer contracts
  getCustomerContracts: (id: string) => 
    axiosClient.get(`/customers/${id}/contracts`),

  // Get customer test drives
  getCustomerTestDrives: (id: string) => 
    axiosClient.get(`/customers/${id}/test-drives`),

  // Get customer quotations
  getCustomerQuotations: (id: string) => 
    axiosClient.get(`/customers/${id}/quotations`),

  // Get customer feedbacks
  getCustomerFeedbacks: (id: string) => 
    axiosClient.get(`/customers/${id}/feedbacks`),

  // Get customer complaints
  getCustomerComplaints: (id: string) => 
    axiosClient.get(`/customers/${id}/complaints`),

  // Get customer statistics
  getCustomerStatistics: (id: string) => 
    axiosClient.get<{ data: CustomerStatistics }>(`/customers/${id}/statistics`),

  // Search customers
  searchCustomers: (query: string) => 
    axiosClient.get(`/customers/search?query=${encodeURIComponent(query)}`),

  // Get customers by status
  getCustomersByStatus: () => 
    axiosClient.get('/customers/by-status'),
};