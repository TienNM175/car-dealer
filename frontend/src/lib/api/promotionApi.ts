import axios from "axios";
import {
  Promotion,
  CreatePromotionDTO,
  UpdatePromotionDTO,
  PromotionFilters,
  CalculateDiscountDTO,
  CalculateDiscountResponse,
  PromotionStatistics,
  PaginatedPromotionsResponse,
  AvailablePromotionsResponse, // Thêm import cho available response
  PromotionSource, // Thêm cho source param
} from "../types/promotion.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Axios instance with auth token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const promotionApi = {
  /**
   * GET /promotions
   * Get all promotions with filters and pagination
   */
  getAll: async (
    filters?: PromotionFilters
  ): Promise<PaginatedPromotionsResponse> => {
    const response = await apiClient.get("/promotions", { params: filters });
    return response.data;
  },

  /**
   * GET /promotions/:id
   * Get single promotion by ID
   */
  getById: async (id: string): Promise<Promotion> => {
    const response = await apiClient.get(`/promotions/${id}`);
    return response.data.data;
  },

  /**
   * GET /promotions/dealer/:dealerId
   * Get promotions for a specific dealer
   * @param dealerId - Dealer ID
   * @param includeInactive - Include inactive promotions (default: false)
   * @param source - Filter by source (DEALER | MANUFACTURER, optional)
   */
  getByDealerId: async (
    dealerId: string,
    includeInactive = false,
    source?: PromotionSource // Thêm param source
  ): Promise<Promotion[]> => {
    const params: Record<string, any> = { includeInactive }; // FIXED: Type as Record to allow dynamic keys
    if (source) {
      params.source = source;
    }
    const response = await apiClient.get(`/promotions/dealer/${dealerId}`, {
      params,
    });
    return response.data.data;
  },

  /**
   * GET /promotions/dealer/:dealerId/active
   * Get only active promotions for a dealer
   */
  getActivePromotions: async (dealerId: string): Promise<Promotion[]> => {
    const response = await apiClient.get(
      `/promotions/dealer/${dealerId}/active`
    );
    return response.data.data;
  },

  /**
   * GET /promotions/dealer/:dealerId/available
   * Get available promotions for dealer (separate DEALER & MANUFACTURER)
   * FIXED: Thêm param includeInactive (default true để fetch all, tránh mất inactive sau toggle)
   */
  getAvailablePromotions: async (
    dealerId: string,
    includeInactive: boolean = true // FIXED: Default true để fetch cả active + inactive
  ): Promise<AvailablePromotionsResponse> => {
    const params: Record<string, any> = { includeInactive }; // FIXED: Pass query param
    const response = await apiClient.get(`/promotions/dealer/${dealerId}/available`, { params });
    return response.data.data; // Backend return { dealerPromotions, manufacturerPromotions, allPromotions? }
  },

  /**
   * POST /promotions
   * Create new promotion
   */
  create: async (data: CreatePromotionDTO): Promise<Promotion> => {
    const response = await apiClient.post("/promotions", data);
    return response.data.data;
  },

  /**
   * PUT /promotions/:id
   * Update promotion
   */
  update: async (id: string, data: UpdatePromotionDTO): Promise<Promotion> => {
    const response = await apiClient.put(`/promotions/${id}`, data);
    return response.data.data;
  },

  /**
   * PATCH /promotions/:id/toggle
   * Toggle promotion active status (activate/deactivate)
   */
  toggleStatus: async (id: string): Promise<Promotion> => {
    const response = await apiClient.patch(`/promotions/${id}/toggle`);
    return response.data.data;
  },

  /**
   * DELETE /promotions/:id
   * Delete promotion
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/promotions/${id}`);
    return response.data;
  },

  /**
   * POST /promotions/calculate
   * Calculate discount for a purchase
   */
  calculateDiscount: async (
    data: CalculateDiscountDTO
  ): Promise<CalculateDiscountResponse> => {
    const response = await apiClient.post("/promotions/calculate", data);
    return response.data.data;
  },

  /**
   * GET /promotions/statistics
   * Get promotion statistics
   * @param dealerId - Optional dealer ID
   * @param source - Optional filter by source
   */
  getStatistics: async (
    dealerId?: string,
    source?: PromotionSource // Thêm param source
  ): Promise<PromotionStatistics> => {
    const params: Record<string, any> = {}; // FIXED: Type as Record for dynamic params
    if (dealerId) params.dealerId = dealerId;
    if (source) params.source = source;
    const response = await apiClient.get("/promotions/statistics", { params });
    return response.data.data;
  },

  /**
   * POST /promotions/auto-expire
   * Manually trigger auto-expire for promotions
   */
  autoExpire: async (): Promise<{ count: number; message: string }> => {
    const response = await apiClient.post("/promotions/auto-expire");
    return response.data.data;
  },
};