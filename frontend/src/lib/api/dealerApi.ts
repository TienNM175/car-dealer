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

class DealerApi {
  // Dealer CRUD
  async getAllDealers(filters: DealerFilters = {}, pagination: PaginationParams = {}): Promise<DealersListResponse> {
    const params = { ...filters, ...pagination };
    const response = await api.get('/dealers', { params });
    return response.data;
  }

  async getDealerById(id: string): Promise<DealerResponse> {
    const response = await api.get(`/dealers/${id}`);
    return response.data;
  }

  async createDealer(data: CreateDealerInput): Promise<DealerResponse> {
    const response = await api.post('/dealers', data);
    return response.data;
  }

  async updateDealer(id: string, data: UpdateDealerInput): Promise<DealerResponse> {
    const response = await api.put(`/dealers/${id}`, data);
    return response.data;
  }

  async deleteDealer(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/dealers/${id}`);
    return response.data;
  }

  // Regions
  async getAllRegions(): Promise<{ success: boolean; data: Region[] }> {
    const response = await api.get('/dealers/regions');
    return response.data;
  }

  // Staff Management
  async getDealerStaff(dealerId: string): Promise<{
      message: string; success: boolean; data: any[] 
}> {
    const response = await api.get(`/dealers/${dealerId}/staff`);
    return response.data;
  }

  async addStaff(dealerId: string, staffData: any): Promise<{
      message: string | undefined; success: boolean; data: any 
}> {
    const response = await api.post(`/dealers/${dealerId}/staff`, staffData);
    return response.data;
  }

  async updateStaff(dealerId: string, staffId: string, data: any): Promise<{ success: boolean; data: any }> {
    const response = await api.put(`/dealers/${dealerId}/staff/${staffId}`, data);
    return response.data;
  }

  async removeStaff(dealerId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/dealers/${dealerId}/staff/${staffId}`);
    return response.data;
  }

  // Dealer Operations
  async getDealerInventory(dealerId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/dealers/${dealerId}/inventory`);
    return response.data;
  }

  async getDealerOrders(dealerId: string, status?: string): Promise<{ success: boolean; data: any[] }> {
    const params = status ? { status } : {};
    const response = await api.get(`/dealers/${dealerId}/orders`, { params });
    return response.data;
  }

  async getDealerSalesStats(dealerId: string, fromDate?: Date, toDate?: Date): Promise<{ success: boolean; data: any }> {
    const params: any = {};
    if (fromDate) params.fromDate = fromDate.toISOString();
    if (toDate) params.toDate = toDate.toISOString();
    
    const response = await api.get(`/dealers/${dealerId}/sales-stats`, { params });
    return response.data;
  }

  // Targets
  async getDealerTargets(dealerId: string, year?: number): Promise<{
      message: string; success: boolean; data: any[] 
}> {
    const params = year ? { year } : {};
    const response = await api.get(`/dealers/${dealerId}/targets`, { params });
    return response.data;
  }

  async setDealerTarget(dealerId: string, year: number, month: number, targetAmount: number): Promise<{
      message: string | undefined; success: boolean; data: any 
}> {
    const response = await api.post(`/dealers/${dealerId}/targets`, {
      year,
      month,
      targetAmount,
    });
    return response.data;
  }
}

export const dealerApi = new DealerApi();