// ============================================
// 9. src/api/manufacturers.ts
// ============================================
import { apiClient } from './client';
import { Manufacturer } from '../types/vehicle';

export interface ManufacturerListResponse {
  success: boolean;
  message: string;
  data: Manufacturer[];
}

export const manufacturerApi = {
  getAll: async () => {
    const response = await apiClient.get<ManufacturerListResponse>(
      '/public/manufacturers'
    );
    return response.data;
  },
};