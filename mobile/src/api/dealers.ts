// ============================================
// 7. src/api/dealers.ts
// ============================================
import { apiClient } from './client';
import { Dealer, DealerAvailability } from '../types/dealer';

export interface DealerListResponse {
  success: boolean;
  message: string;
  data: Dealer[];
}

export interface DealerAvailabilityResponse {
  success: boolean;
  message: string;
  data: DealerAvailability;
}

export const dealerApi = {
  // Lấy danh sách đại lý có xe cụ thể
  getDealersWithVehicle: async (vehicleId: string) => {
    const response = await apiClient.get<DealerListResponse>(
      `/public/dealers?vehicleId=${vehicleId}`
    );
    return response.data;
  },

  // Kiểm tra xe có sẵn tại đại lý
  checkVehicleAtDealer: async (dealerId: string, vehicleId: string) => {
    const response = await apiClient.get<DealerAvailabilityResponse>(
      `/public/dealers/${dealerId}/vehicles/${vehicleId}`
    );
    return response.data;
  },

  // Lấy tất cả đại lý
  getAllDealers: async () => {
    const response = await apiClient.get<DealerListResponse>('/public/dealers');
    return response.data;
  },
};