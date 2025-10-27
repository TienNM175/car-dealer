// src/lib/api/dealerApi.ts
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
  region?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    users: number;
    dealerOrders: number;
    inventories: number;
    dealerTargets?: number;
  };
}

export interface Region {
  id: string;
  name: string;
  code: string;
  _count?: {
    dealers: number;
  };
}

export interface CreateDealerInput {
  name: string;
  code: string;
  regionId: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

export interface UpdateDealerInput {
  name?: string;
  code?: string;
  regionId?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface DealerFilters {
  search?: string;
  regionId?: string;
  city?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export interface DealerResponse {
  success: boolean;
  data: Dealer;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    pagination?: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  };
}

// ===== TARGETS INTERFACES =====
export interface DealerTarget {
  id: string;
  dealerId: string;
  month: number;
  year: number;
  targetAmount: number;
  achievedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTargetInput {
  month: number;
  year: number;
  targetAmount: number;
}

export interface UpdateTargetInput {
  targetAmount?: number;
  achievedAmount?: number;
}

export interface DealerTargetsResponse {
  success: boolean;
  data: DealerTarget[];
  message?: string;
}

export interface DealerTargetResponse {
  success: boolean;
  data: DealerTarget;
  message?: string;
}

class DealerApi {
  // Dealer CRUD
  async getAllDealers(filters: DealerFilters = {}, pagination: PaginationParams = {}): Promise<DealersListResponse> {
    const params: any = {};
    
    // Add filters
    if (filters.search) params.search = filters.search;
    if (filters.regionId) params.regionId = filters.regionId;
    if (filters.city) params.city = filters.city;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    
    // Add pagination
    if (pagination.page) params.page = pagination.page;
    if (pagination.limit) params.limit = pagination.limit;
    if (pagination.sortBy) params.sortBy = pagination.sortBy;
    if (pagination.sortOrder) params.sortOrder = pagination.sortOrder;

    console.log('📡 Fetching dealers with params:', params);
    
    try {
      const response = await api.get('/dealers', { params });
      console.log('✅ Dealers response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch dealers:', error);
      throw error;
    }
  }

  async getDealerById(id: string): Promise<DealerResponse> {
    try {
      const response = await api.get(`/dealers/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dealer:', error);
      throw error;
    }
  }

  async createDealer(data: CreateDealerInput): Promise<DealerResponse> {
    try {
      const response = await api.post('/dealers', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create dealer:', error);
      throw error;
    }
  }

  async updateDealer(id: string, data: UpdateDealerInput): Promise<DealerResponse> {
    try {
      const response = await api.put(`/dealers/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update dealer:', error);
      throw error;
    }
  }

  async deleteDealer(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Deleting dealer: ${id}`);
      const response = await api.delete(`/dealers/${id}`);
      console.log('✅ Delete successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      throw error;
    }
  }

  // Regions
  async getAllRegions(): Promise<{ success: boolean; data: Region[] }> {
    try {
      const response = await api.get('/dealers/regions');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch regions:', error);
      throw error;
    }
  }

  // Staff Management
  async getDealerStaff(dealerId: string): Promise<{
    message: string; 
    success: boolean; 
    data: any[] 
  }> {
    try {
      const response = await api.get(`/dealers/${dealerId}/staff`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dealer staff:', error);
      throw error;
    }
  }

  async addStaff(dealerId: string, staffData: any): Promise<{
    message: string | undefined; 
    success: boolean; 
    data: any 
  }> {
    try {
      const response = await api.post(`/dealers/${dealerId}/staff`, staffData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to add staff:', error);
      throw error;
    }
  }

  async updateStaff(dealerId: string, staffId: string, data: any): Promise<{ success: boolean; data: any }> {
    try {
      const response = await api.put(`/dealers/${dealerId}/staff/${staffId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update staff:', error);
      throw error;
    }
  }

  async removeStaff(dealerId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/dealers/${dealerId}/staff/${staffId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to remove staff:', error);
      throw error;
    }
  }

  // Dealer Operations
  async getDealerInventory(dealerId: string): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await api.get(`/dealers/${dealerId}/inventory`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dealer inventory:', error);
      throw error;
    }
  }

  async getDealerOrders(dealerId: string, status?: string): Promise<{ success: boolean; data: any[] }> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(`/dealers/${dealerId}/orders`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dealer orders:', error);
      throw error;
    }
  }

  async getDealerSalesStats(dealerId: string, fromDate?: Date, toDate?: Date): Promise<{ success: boolean; data: any }> {
    try {
      const params: any = {};
      if (fromDate) params.fromDate = fromDate.toISOString();
      if (toDate) params.toDate = toDate.toISOString();
      
      const response = await api.get(`/dealers/${dealerId}/sales-stats`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sales stats:', error);
      throw error;
    }
  }

  // ===== TARGETS API =====
  async getDealerTargets(dealerId: string): Promise<DealerTargetsResponse> {
    try {
      const response = await api.get(`/dealers/${dealerId}/targets`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch dealer targets:', error);
      throw error;
    }
  }

  async createDealerTarget(dealerId: string, data: CreateTargetInput): Promise<DealerTargetResponse> {
    try {
      const response = await api.post(`/dealers/${dealerId}/targets`, {
        year: data.year,
        month: data.month,
        targetAmount: data.targetAmount,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to create dealer target:', error);
      throw error;
    }
  }

  async updateDealerTarget(targetId: string, data: UpdateTargetInput): Promise<DealerTargetResponse> {
    try {
      const response = await api.put(`/dealers/targets/${targetId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update dealer target:', error);
      throw error;
    }
  }

  async deleteDealerTarget(targetId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Deleting dealer target: ${targetId}`);
      
      // SỬA: Sử dụng endpoint giống website
      const response = await api.delete(`/dealers/targets/${targetId}`);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Failed to delete dealer target:', error);
      throw error;
    }
  }

  // Alternative method names for compatibility
  async setDealerTarget(dealerId: string, year: number, month: number, targetAmount: number): Promise<DealerTargetResponse> {
    return this.createDealerTarget(dealerId, { year, month, targetAmount });
  }
}

export const dealerApi = new DealerApi();