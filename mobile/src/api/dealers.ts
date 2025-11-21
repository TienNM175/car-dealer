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
  getDealersWithVehicle: async (vehicleId: string) => {
    const response = await apiClient.get<DealerListResponse>(
      `/public/dealers?vehicleId=${vehicleId}`
    );
    return response.data;
  },

  checkVehicleAtDealer: async (dealerId: string, vehicleId: string) => {
    const response = await apiClient.get<DealerAvailabilityResponse>(
      `/public/dealers/${dealerId}/vehicles/${vehicleId}`
    );
    return response.data;
  },

  getAllDealers: async () => {
    const response = await apiClient.get<DealerListResponse>('/public/dealers');
    return response.data;
  },
};