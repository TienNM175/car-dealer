// ============================================
// 6. src/api/vehicles.ts
// ============================================
import { apiClient } from './client';
import { Vehicle } from '../types/vehicle';

export interface VehicleFilters {
  search?: string;
  manufacturerId?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  bodyType?: string;
  page?: number;
  limit?: number;
}

export interface VehicleListResponse {
  success: boolean;
  message: string;
  data: Vehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VehicleDetailResponse {
  success: boolean;
  message: string;
  data: Vehicle;
}

export const vehicleApi = {
  // Lấy danh sách xe
  getVehicles: async (filters: VehicleFilters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.manufacturerId) params.append('manufacturerId', filters.manufacturerId);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.bodyType) params.append('bodyType', filters.bodyType);
    params.append('page', (filters.page || 1).toString());
    params.append('limit', (filters.limit || 10).toString());

    const response = await apiClient.get<VehicleListResponse>(
      `/public/vehicles?${params.toString()}`
    );
    return response.data;
  },

  // Lấy chi tiết xe
  getVehicleById: async (id: string) => {
    const response = await apiClient.get<VehicleDetailResponse>(
      `/public/vehicles/${id}`
    );
    return response.data;
  },

  // So sánh xe
  compareVehicles: async (vehicleIds: string[]) => {
    const response = await apiClient.post('/public/vehicles/compare', {
      vehicleIds,
    });
    return response.data;
  },
};