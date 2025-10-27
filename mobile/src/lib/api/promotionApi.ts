import axios from "axios";
import * as SecureStore from 'expo-secure-store'; // ✅ Import SecureStore (cài expo-secure-store nếu chưa)
import {
  Promotion,
  CreatePromotionDTO,
  UpdatePromotionDTO,
  PromotionFilters,
  CalculateDiscountDTO,
  CalculateDiscountResponse,
  PromotionStatistics,
  PaginatedPromotionsResponse,
} from "../types/promotion.types";

// ✅ Load URL từ ENV expo
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.3:5000/api/v1"; // ✅ Gợi ý: Dùng IP local cho RN dev (thay 192.168.1.3 bằng IP máy bạn)

// ✅ Tạo instance Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ Thêm token vào request (dùng SecureStore, đồng bộ với AuthContext)
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No auth token found in SecureStore"); // Debug
    }
  } catch (error) {
    console.error("Error getting token from SecureStore:", error);
  }
  return config;
});

// ✅ Optional: Response interceptor để handle 401 (auto-logout nếu không refresh được)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token và redirect login (gọi từ AuthContext nếu expose)
      try {
        await SecureStore.deleteItemAsync("auth_token");
        await SecureStore.deleteItemAsync("refresh_token");
        // Nếu có router: router.replace('/(auth)/login'); // Hoặc emit event để AuthContext handle
        console.log("Token expired, cleared and redirecting to login");
      } catch (clearErr) {
        console.error("Error clearing tokens:", clearErr);
      }
    }
    return Promise.reject(error);
  }
);

export const promotionApi = {
  getAll: async (
    filters?: PromotionFilters
  ): Promise<PaginatedPromotionsResponse> => {
    const response = await apiClient.get("/promotions", { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const response = await apiClient.get(`/promotions/${id}`);
    return response.data.data;
  },

  getByDealerId: async (
    dealerId: string,
    includeInactive = false
  ): Promise<Promotion[]> => {
    const response = await apiClient.get(`/promotions/dealer/${dealerId}`, {
      params: { includeInactive },
    });
    return response.data.data;
  },

  getActivePromotions: async (dealerId: string): Promise<Promotion[]> => {
    const response = await apiClient.get(
      `/promotions/dealer/${dealerId}/active`
    );
    return response.data.data;
  },

  create: async (data: CreatePromotionDTO): Promise<Promotion> => {
    const response = await apiClient.post("/promotions", data);
    return response.data.data;
  },

  update: async (id: string, data: UpdatePromotionDTO): Promise<Promotion> => {
    const response = await apiClient.put(`/promotions/${id}`, data);
    return response.data.data;
  },

  toggleStatus: async (id: string): Promise<Promotion> => {
    const response = await apiClient.patch(`/promotions/${id}/toggle`);
    return response.data.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/promotions/${id}`);
    return response.data;
  },

  calculateDiscount: async (
    data: CalculateDiscountDTO
  ): Promise<CalculateDiscountResponse> => {
    const response = await apiClient.post("/promotions/calculate", data);
    return response.data.data;
  },

  getStatistics: async (dealerId?: string): Promise<PromotionStatistics> => {
    const response = await apiClient.get("/promotions/statistics", {
      params: dealerId ? { dealerId } : undefined,
    });
    return response.data.data;
  },

  autoExpire: async (): Promise<{ count: number; message: string }> => {
    const response = await apiClient.post("/promotions/auto-expire");
    return response.data.data;
  },
};