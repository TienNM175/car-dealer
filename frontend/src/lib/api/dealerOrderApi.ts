import axiosClient from "@/lib/utils/axiosClient";

export interface DealerOrder {
  id: string;
  orderNumber: string;
  dealerId: string;
  staffId: string;
  vehicleId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  orderedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  dealer?: {
    id: string;
    name: string;
    code: string;
    city: string;
    region?: {
      name: string;
    };
  };
  vehicle?: {
    id: string;
    model: string;
    variant?: string;
    manufacturer?: {
      name: string;
    };
    images?: Array<{
      id: string;
      url: string;
      isMain: boolean;
    }>;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateDealerOrderInput {
  dealerId: string;
  staffId: string;
  vehicleId: string;
  quantity: number;
  notes?: string;
}

export interface UpdateDealerOrderInput {
  quantity?: number;
  notes?: string;
}

export interface DealerOrderFilters {
  search?: string;
  dealerId?: string;
  vehicleId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const dealerOrderApi = {
  getAllDealerOrders: async (
    filters?: DealerOrderFilters,
    pagination?: PaginationParams
  ) => {
    const params = new URLSearchParams();

    if (pagination?.page) params.append("page", pagination.page.toString());
    if (pagination?.limit) params.append("limit", pagination.limit.toString());
    if (pagination?.sortBy) params.append("sortBy", pagination.sortBy);
    if (pagination?.sortOrder) params.append("sortOrder", pagination.sortOrder);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.dealerId) params.append("dealerId", filters.dealerId);
    if (filters?.vehicleId) params.append("vehicleId", filters.vehicleId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.fromDate) params.append("fromDate", filters.fromDate);
    if (filters?.toDate) params.append("toDate", filters.toDate);

    return axiosClient.get(`/orders?${params.toString()}`);
  },

  getDealerOrderById: async (id: string) => {
    return axiosClient.get(`/orders/${id}`);
  },

  createDealerOrder: async (data: CreateDealerOrderInput) => {
    return axiosClient.post("/orders", data);
  },

  updateDealerOrder: async (id: string, data: UpdateDealerOrderInput) => {
    return axiosClient.put(`/orders/${id}`, data);
  },

  updateDealerOrderStatus: async (id: string, status: string) => {
    return axiosClient.patch(`/orders/${id}/status`, { status });
  },

  cancelDealerOrder: async (id: string, reason?: string) => {
    return axiosClient.post(`/orders/${id}/cancel`, { reason });
  },

  getDealerOrderStatistics: async (filters?: { 
    dealerId?: string; 
    fromDate?: string; 
    toDate?: string; 
  }) => {
    const params = new URLSearchParams();
    
    if (filters?.dealerId) params.append("dealerId", filters.dealerId);
    if (filters?.fromDate) params.append("fromDate", filters.fromDate);
    if (filters?.toDate) params.append("toDate", filters.toDate);

    return axiosClient.get(`/orders/statistics?${params.toString()}`);
  },

  getOrdersByStatus: async (dealerId?: string) => {
    const params = new URLSearchParams();
    
    if (dealerId) params.append("dealerId", dealerId);

    return axiosClient.get(`/orders/by-status?${params.toString()}`);
  },
};

export default dealerOrderApi;