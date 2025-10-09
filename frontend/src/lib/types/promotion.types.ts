// ============================================
// PROMOTION TYPES
// ============================================

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Promotion {
  id: string;
  dealerId: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number | null;
  startDate: string | Date;
  endDate?: string | Date | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  dealer?: {
    id: string;
    name: string;
    code: string;
    city?: string;
  };
}

export interface CreatePromotionDTO {
  dealerId?: string; // Optional for dealer staff (auto-filled from auth)
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  startDate: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
}

export interface UpdatePromotionDTO {
  name?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minPurchase?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
}

export interface PromotionFilters {
  search?: string;
  dealerId?: string;
  discountType?: DiscountType;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  minDiscount?: number;
  maxDiscount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CalculateDiscountDTO {
  dealerId: string;
  purchaseAmount: number;
  promotionId?: string;
}

export interface CalculateDiscountResponse {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  promotion?: {
    id: string;
    name: string;
    discountType: DiscountType;
    discountValue: number;
  };
}

export interface PromotionStatistics {
  totalPromotions: number;
  activePromotions: number;
  inactivePromotions: number;
  expiredPromotions: number;
  promotionsByType: {
    PERCENTAGE: number;
    FIXED: number;
  };
  totalDiscountValue?: number;
  averageDiscountValue?: number;
}

export interface PaginatedPromotionsResponse {
  data: Promotion[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
