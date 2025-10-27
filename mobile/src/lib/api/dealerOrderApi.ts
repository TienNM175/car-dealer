// src/lib/api/dealerOrderApi.ts
import axiosClient from '../utils/axiosClient';

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
    variant: string;
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

export const dealerOrderApi = {
  // Lấy danh sách orders - SỬA ENDPOINT TỪ '/dealer-orders' THÀNH '/orders'
  getAllDealerOrders: (filters?: any, pagination?: any) => 
    axiosClient.get('/orders', { params: { ...filters, ...pagination } }),
  
  // Lấy order by ID
  getDealerOrderById: (id: string) => 
    axiosClient.get(`/orders/${id}`),
  
  // Tạo order mới
  createDealerOrder: (data: CreateDealerOrderInput) => 
    axiosClient.post('/orders', data),
  
  // Cập nhật order
  updateDealerOrder: (id: string, data: UpdateDealerOrderInput) => 
    axiosClient.put(`/orders/${id}`, data),
  
  // Cập nhật status
  updateDealerOrderStatus: (id: string, status: string) => 
    axiosClient.patch(`/orders/${id}/status`, { status }),
  
  // Hủy order
  cancelDealerOrder: (id: string, reason?: string) => 
    axiosClient.post(`/orders/${id}/cancel`, { reason }),
  
  // Thống kê theo status
  getOrdersByStatus: (dealerId?: string) => 
    axiosClient.get('/orders/by-status', { params: { dealerId } }),
};