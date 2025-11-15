// ============================================
// PROMOTION TYPES
// ============================================
export type DiscountType = "PERCENTAGE" | "FIXED";
export type PromotionSource = "DEALER" | "MANUFACTURER"; // DEALER: tự tạo (editable), MANUFACTURER: từ EVM/hãng (không editable)

export interface Promotion {
  id: string;
  code?: string; // Mã khuyến mãi unique (nếu schema có, auto-gen ở backend)
  dealerId: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number | null;
  source: PromotionSource; // Required: Nguồn gốc mã (không thể sửa)
  isEditable: boolean; // Thêm: true cho DEALER (tự tạo), false cho MANUFACTURER (từ EVM, dealer không sửa)
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
  dealerId?: string; // Optional cho dealer staff (auto-filled từ auth)
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  source?: PromotionSource; // Optional: auto-filled (DEALER cho dealer user; EVM/Admin set MANUFACTURER)
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
  // Không có source ở đây: Không cho update nguồn gốc (immutable)
  // Không có isEditable: Auto-managed ở backend dựa trên source
}

export interface PromotionFilters {
  search?: string;
  dealerId?: string;
  discountType?: DiscountType;
  source?: PromotionSource; // Filter theo nguồn (e.g., dealer chỉ xem "DEALER" nếu cần)
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
    source?: PromotionSource; // Thêm source để UI hiển thị loại
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
  promotionsBySource?: { // Thêm: Thống kê theo nguồn (nếu backend hỗ trợ)
    DEALER: number;
    MANUFACTURER: number;
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

// Thêm: Response cho available promotions (dealer + manufacturer separate)
export interface AvailablePromotionsResponse {
  dealerPromotions: Promotion[]; // Chỉ editable
  manufacturerPromotions: Promotion[]; // Không editable
  allPromotions: Promotion[];
}