// frontend/src/lib/api/dealers.ts

import api from '../utils/axiosClient';

export interface Dealer {
  id: string;
  name: string;
  code: string;
  regionId: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealersListResponse {
  success: boolean;
  message: string;
  data: Dealer[];
  meta?: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const dealersApi = {
  /**
   * List dealers
   */
  list: async (params?: { page?: number; limit?: number }): Promise<DealersListResponse> => {
    const response = await api.get('/dealers', { params });
    return response.data;
  },

  /**
   * Get dealer by ID
   */
  getById: async (dealerId: string): Promise<{ success: boolean; data: Dealer }> => {
    const response = await api.get(`/dealers/${dealerId}`);
    return response.data;
  },
};