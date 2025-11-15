import prisma from "../../config/database";
import { Prisma, DiscountType, PromotionSource } from "@prisma/client";

interface PromotionFilters {
  search?: string;
  dealerId?: string;
  discountType?: DiscountType;
  isActive?: boolean;
  source?: PromotionSource; // Thêm filter theo source
  startDate?: string;
  endDate?: string;
  minDiscount?: number;
  maxDiscount?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface CreatePromotionInput extends Prisma.DealerDiscountCreateInput {
  vehicleUnitIds?: string[]; // Thêm: Mảng ID Vehicle Units (optional)
}

interface UpdatePromotionInput extends Prisma.DealerDiscountUpdateInput {
  vehicleUnitIds?: string[]; // Thêm: Update mảng ID
}

export class PromotionsService {
  // Include cho vehicleUnits (select fields cần cho UI)
 // FIXED: Chỉ dùng include nest, không select top-level trên vehicleUnits
private promotionInclude = {
  dealer: {
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
    },
  },
  vehicleUnits: {
    select: {
      id: true,  // Fields từ PromotionVehicle
      createdAt: true,
      vehicleUnit: {  // Nested select từ PromotionVehicle -> VehicleUnit
        select: {
          id: true,
          vin: true,
          color: true,
          status: true,
          vehicle: {  // Nested từ VehicleUnit -> Vehicle
            select: {
              id: true,
              model: true,
              variant: true,
              manufacturer: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  },
};

  /**
   * Get all promotions with filters and pagination
   */
  async getAll(
    filters: PromotionFilters,
    pagination: PaginationParams,
    userRole?: string,
    dealerId?: string
  ) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    const where: Prisma.DealerDiscountWhereInput = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
      ...(filters.dealerId && { dealerId: filters.dealerId }),
      ...(filters.discountType && { discountType: filters.discountType }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.source && { source: filters.source }), // Hỗ trợ filter theo source
      ...(filters.minDiscount && {
        discountValue: { gte: filters.minDiscount },
      }),
      ...(filters.maxDiscount && {
        discountValue: { lte: filters.maxDiscount },
      }),
      ...(filters.startDate &&
        filters.endDate && {
          AND: [
            { startDate: { lte: new Date(filters.endDate) } },
            {
              OR: [
                { endDate: { gte: new Date(filters.startDate) } },
                { endDate: null },
              ],
            },
          ],
        }),
    };

    // Dealer staff can only see their dealer's promotions
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      where.dealerId = dealerId || "";
    }

    const total = await prisma.dealerDiscount.count({ where });

    const promotions = await prisma.dealerDiscount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: this.promotionInclude, // Thêm include vehicleUnits
    });

    return {
      data: promotions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single promotion by ID
   */
  async getById(id: string, userRole?: string, dealerId?: string) {
    const promotion = await prisma.dealerDiscount.findUnique({
      where: { id },
      include: this.promotionInclude, // Thêm include vehicleUnits
    });

    if (!promotion) {
      throw new Error("Promotion not found");
    }

    // Check authorization
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (promotion.dealerId !== dealerId) {
        throw new Error("Access denied");
      }
    }

    return promotion;
  }

  /**
   * Get promotions by dealer ID
   */
  async getByDealerId(dealerId: string, includeInactive = false, source?: PromotionSource) {
    const where: Prisma.DealerDiscountWhereInput = {
      dealerId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(source && { source }), // Hỗ trợ filter theo source
    };

    const promotions = await prisma.dealerDiscount.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: this.promotionInclude, // Thêm include vehicleUnits
    });

    return promotions;
  }

  /**
   * Get active promotions for a dealer
   */
  async getActivePromotions(dealerId: string) {
    const now = new Date();

    const promotions = await prisma.dealerDiscount.findMany({
      where: {
        dealerId,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: { gte: now } }, { endDate: null }],
      },
      orderBy: [
        { source: "desc" }, // MANUFACTURER first
        { discountValue: "desc" }, // Then by discount value
      ],
      include: this.promotionInclude, // Thêm include vehicleUnits
    });

    return promotions;
  }

  /**
   * Get all available promotions for a dealer (from dealer + manufacturer)
   */
  async getAvailablePromotionsForDealer(dealerId: string, includeInactive: boolean = false, vehicleUnitId?: string) {  // FIXED: Thêm param vehicleUnitId?: string
  const now = new Date();

  // FIXED: Sử dụng getByDealerId để hỗ trợ includeInactive, fetch all (active + inactive nếu true)
  const allPromotions = await this.getByDealerId(dealerId, includeInactive);

  // FIXED: Nếu includeInactive=true, return all (không filter date, để frontend handle status)
  // Nếu false, filter valid active (start <= now <= end)
  let validPromotions = allPromotions;
  if (!includeInactive) {
    validPromotions = allPromotions.filter(p => 
      p.isActive && p.startDate <= now && (!p.endDate || p.endDate >= now)
    );
  }

  // FIXED: Nếu có vehicleUnitId, filter chỉ promotions có relation với unit đó (qua promotionVehicle)
 if (vehicleUnitId) {
  validPromotions = validPromotions.filter(p => {
    // Nếu promotion không gắn xe nào → áp dụng cho tất cả → cho hiện
    if (!p.vehicleUnits || p.vehicleUnits.length === 0) return true;
    
    // Nếu có gắn xe → chỉ cho hiện nếu có match với vehicleUnitId đang chọn
    return p.vehicleUnits.some(unit => unit.vehicleUnit.id === vehicleUnitId);
  });
}

  // Separate by source for easier filtering in frontend
  const dealerPromotions = validPromotions.filter((p) => p.source === "DEALER");
  const manufacturerPromotions = validPromotions.filter(
    (p) => p.source === "MANUFACTURER"
  );

  // FIXED: Nếu includeInactive=true, thêm allPromotions để frontend filter client-side
  return {
    dealerPromotions,
    manufacturerPromotions,
    allPromotions: includeInactive ? allPromotions : validPromotions,
  };
}

  /**
   * Create new promotion
   */
  async create(
    data: CreatePromotionInput, // FIXED: Extend để có vehicleUnitIds
    userRole: string,
    _userId?: string
  ) {
    const { vehicleUnitIds, ...promotionData } = data; // FIXED: Extract vehicleUnitIds

    // Xác định source: Dealer chỉ tạo DEALER, EVM/ADMIN có thể tạo MANUFACTURER
    const source = promotionData.source || "DEALER";
    if (source === "MANUFACTURER" && userRole !== "ADMIN" && userRole !== "EVM_STAFF") {
      throw new Error("Only EVM staff or admin can create manufacturer promotions");
    }

    // Validate dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: promotionData.dealer.connect?.id },
    });
    if (!dealer) {
      throw new Error("Dealer not found");
    }

    // Validate dates
    const startDate = new Date(promotionData.startDate);
    const endDate = promotionData.endDate ? new Date(promotionData.endDate) : null;

    if (endDate && endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    // Validate discount value
    if (promotionData.discountType === "PERCENTAGE") {
      if (Number(promotionData.discountValue) < 0 || Number(promotionData.discountValue) > 100) {
        throw new Error("Percentage discount must be between 0 and 100");
      }
    } else {
      if (Number(promotionData.discountValue) < 0) {
        throw new Error("Discount value cannot be negative");
      }
    }

    // Validate min purchase
    if (promotionData.minPurchase && Number(promotionData.minPurchase) < 0) {
      throw new Error("Minimum purchase cannot be negative");
    }

    // FIXED: Validate vehicleUnitIds nếu có (phải tồn tại và thuộc dealer)
    if (vehicleUnitIds && vehicleUnitIds.length > 0) {
      const existingUnits = await prisma.vehicleUnit.findMany({
        where: {
          id: { in: vehicleUnitIds },
          dealerId: dealer.id, // Phải thuộc dealer này
        },
        select: { id: true },
      });
      if (existingUnits.length !== vehicleUnitIds.length) {
        throw new Error("Some vehicle unit IDs do not exist or do not belong to this dealer");
      }
    }

    // Check for overlapping promotions
    const overlapping = await prisma.dealerDiscount.findFirst({
      where: {
        dealerId: dealer.id,
        isActive: true,
        name: promotionData.name,
        startDate: { lte: endDate || new Date("2099-12-31") },
        OR: [{ endDate: { gte: startDate } }, { endDate: null }],
      },
    });

    if (overlapping) {
      throw new Error(
        "A promotion with this name already exists in the same period"
      );
    }

    // FIXED: Tạo Promotion trước
    const promotion = await prisma.dealerDiscount.create({
      data: {
        ...promotionData,
        source, // Đảm bảo source được set
        isActive: promotionData.isActive ?? true,
      },
      include: this.promotionInclude, // Include vehicleUnits (sẽ rỗng lúc này)
    });

    // FIXED: Tạo relations PromotionVehicle nếu có vehicleUnitIds
    if (vehicleUnitIds && vehicleUnitIds.length > 0) {
      await prisma.promotionVehicle.createMany({
        data: vehicleUnitIds.map(unitId => ({
          promotionId: promotion.id,
          vehicleUnitId: unitId,
        })),
        skipDuplicates: true, // Tránh duplicate
      });
      // Refetch để có vehicleUnits populated
      return this.getById(promotion.id, userRole, dealer.id);
    }

    return promotion;
  }

  /**
   * Update promotion
   */
  async update(
    id: string,
    data: UpdatePromotionInput, // FIXED: Extend để có vehicleUnitIds
    userRole: string,
    dealerId?: string
  ) {
    const { vehicleUnitIds, ...promotionData } = data; // FIXED: Extract vehicleUnitIds

    const existing = await prisma.dealerDiscount.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Promotion not found");
    }

    // Check authorization: Dealer chỉ update của dealer mình
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (existing.dealerId !== dealerId) {
        throw new Error("Access denied");
      }
    }

    // Enforce: Không cho dealer update MANUFACTURER (chỉ EVM/ADMIN)
    if (existing.source === "MANUFACTURER" && 
        (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER")) {
      throw new Error("Cannot update manufacturer promotions. Only EVM staff or admin can edit.");
    }

    // Validate dates if provided
    if (promotionData.startDate || promotionData.endDate) {
      const startDate = promotionData.startDate
        ? new Date(promotionData.startDate as Date)
        : existing.startDate;
      const endDate = promotionData.endDate
        ? new Date(promotionData.endDate as Date)
        : existing.endDate;

      if (endDate && endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
    }

    // Validate discount value if provided
    if (promotionData.discountValue || promotionData.discountType) {
      const discountType =
        (promotionData.discountType as DiscountType) || existing.discountType;
      const discountValue = promotionData.discountValue || existing.discountValue;

      if (discountType === "PERCENTAGE") {
        if (Number(discountValue) < 0 || Number(discountValue) > 100) {
          throw new Error("Percentage discount must be between 0 and 100");
        }
      } else {
        if (Number(discountValue) < 0) {
          throw new Error("Discount value cannot be negative");
        }
      }
    }

    // Validate min purchase if provided
    if (promotionData.minPurchase && Number(promotionData.minPurchase) < 0) {
      throw new Error("Minimum purchase cannot be negative");
    }

    // FIXED: Validate vehicleUnitIds nếu có (phải tồn tại và thuộc dealer)
    if (vehicleUnitIds && vehicleUnitIds.length > 0) {
      const existingUnits = await prisma.vehicleUnit.findMany({
        where: {
          id: { in: vehicleUnitIds },
          dealerId: existing.dealerId, // Phải thuộc dealer của promotion
        },
        select: { id: true },
      });
      if (existingUnits.length !== vehicleUnitIds.length) {
        throw new Error("Some vehicle unit IDs do not exist or do not belong to this dealer");
      }
    }

    // FIXED: Update Promotion cơ bản trước
    await prisma.dealerDiscount.update({
      where: { id },
      data: promotionData,
    });

    // FIXED: Xóa relations cũ trong PromotionVehicle
    await prisma.promotionVehicle.deleteMany({
      where: { promotionId: id },
    });

    // FIXED: Tạo relations mới nếu có vehicleUnitIds
    if (vehicleUnitIds && vehicleUnitIds.length > 0) {
      await prisma.promotionVehicle.createMany({
        data: vehicleUnitIds.map(unitId => ({
          promotionId: id,
          vehicleUnitId: unitId,
        })),
        skipDuplicates: true,
      });
    }

    // Refetch với include để return full data
    return this.getById(id, userRole, existing.dealerId);
  }

  /**
   * Toggle promotion active status
   */
  async toggleStatus(id: string, userRole: string, dealerId?: string) {
    const existing = await prisma.dealerDiscount.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Promotion not found");
    }

    // Check authorization: Dealer chỉ toggle của dealer mình
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (existing.dealerId !== dealerId) {
        throw new Error("Access denied");
      }
    }

    // Enforce: Không cho dealer toggle MANUFACTURER (chỉ EVM/ADMIN)
    if (existing.source === "MANUFACTURER" && 
        (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER")) {
      throw new Error("Cannot toggle manufacturer promotions. Only EVM staff or admin can edit.");
    }

    const promotion = await prisma.dealerDiscount.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: this.promotionInclude, // Thêm include vehicleUnits
    });

    return promotion;
  }

  /**
   * Delete promotion
   */
  async delete(id: string, userRole: string, dealerId?: string) {
    const promotion = await prisma.dealerDiscount.findUnique({
      where: { id },
    });

    if (!promotion) {
      throw new Error("Promotion not found");
    }

    // Check authorization: Dealer chỉ delete của dealer mình
    if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
      if (promotion.dealerId !== dealerId) {
        throw new Error("Access denied");
      }
    }

    // Enforce: Không cho dealer delete MANUFACTURER (chỉ EVM/ADMIN)
    if (promotion.source === "MANUFACTURER" && 
        (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER")) {
      throw new Error("Cannot delete manufacturer promotions. Only EVM staff or admin can delete.");
    }

    // Can only delete inactive promotions or future promotions
    if (promotion.isActive && new Date(promotion.startDate) <= new Date()) {
      throw new Error(
        "Cannot delete active promotion that has already started"
      );
    }

    // FIXED: Xóa relations PromotionVehicle trước khi delete Promotion
    await prisma.promotionVehicle.deleteMany({
      where: { promotionId: id },
    });

    await prisma.dealerDiscount.delete({
      where: { id },
    });

    return { message: "Promotion deleted successfully" };
  }

  /**
   * Calculate discount amount for a purchase
   */
 async calculateDiscount(
  dealerId: string,
  purchaseAmount: number,
  promotionId?: string,
  vehicleUnitId?: string // Thêm: Để filter theo xe cụ thể
) {
  let promotion;

  if (promotionId) {
    // Use specific promotion
    promotion = await prisma.dealerDiscount.findUnique({
      where: { id: promotionId },
      include: this.promotionInclude, // Include để check vehicleUnits
    });

    if (
      !promotion ||
      !promotion.isActive ||
      promotion.dealerId !== dealerId
    ) {
      throw new Error("Invalid promotion");
    }

    // FIXED: Nếu có vehicleUnitId, check relation PromotionVehicle
    if (vehicleUnitId) {
      const hasRelation = await prisma.promotionVehicle.findFirst({
        where: {
          promotionId: promotion.id,
          vehicleUnitId: vehicleUnitId,
        },
      });
      if (!hasRelation) {
        throw new Error("This promotion does not apply to the selected vehicle unit");
      }
    }
  } else {
    // Find best applicable promotion
    const now = new Date();
    let applicablePromotions = await prisma.dealerDiscount.findMany({
      where: {
        dealerId,
        isActive: true,
        startDate: { lte: now },
        AND: [
          {
            OR: [{ endDate: { gte: now } }, { endDate: null }],
          },
          {
            OR: [
              { minPurchase: { lte: purchaseAmount } },
              { minPurchase: null },
            ],
          },
        ],
      },
      include: this.promotionInclude, // Include để check vehicleUnits sau
      orderBy: { discountValue: "desc" },
    });

    // FIXED: Nếu có vehicleUnitId, filter chỉ promotions có relation với unit đó
    if (vehicleUnitId) {
      const relatedPromotionIds = await prisma.promotionVehicle.findMany({
        where: { vehicleUnitId },
        select: { promotionId: true },
      });
      const ids = relatedPromotionIds.map(r => r.promotionId);
      applicablePromotions = applicablePromotions.filter(p => ids.includes(p.id));
    }

    if (applicablePromotions.length === 0) {
      return {
        originalAmount: purchaseAmount,
        discountAmount: 0,
        finalAmount: purchaseAmount,
        promotion: null,
      };
    }

    // Calculate best discount
    let maxDiscount = 0;
    for (const promo of applicablePromotions) {
      let discount = 0;
      if (promo.discountType === "PERCENTAGE") {
        discount = purchaseAmount * (Number(promo.discountValue) / 100);
      } else {
        discount = Number(promo.discountValue);
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        promotion = promo;
      }
    }
  }

  // Calculate final discount
  let discountAmount = 0;
  if (promotion) {
    // Check min purchase requirement
    if (
      promotion.minPurchase &&
      purchaseAmount < Number(promotion.minPurchase)
    ) {
      throw new Error(`Minimum purchase amount is ${promotion.minPurchase}`);
    }

    if (promotion.discountType === "PERCENTAGE") {
      discountAmount =
        purchaseAmount * (Number(promotion.discountValue) / 100);
    } else {
      discountAmount = Number(promotion.discountValue);
    }
  }

  const finalAmount = Math.max(0, purchaseAmount - discountAmount);

  return {
    originalAmount: purchaseAmount,
    discountAmount,
    finalAmount,
    promotion: promotion
      ? {
          id: promotion.id,
          name: promotion.name,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
        }
      : null,
  };
}

  /**
   * Get promotion statistics
   */
  async getStatistics(dealerId?: string, source?: PromotionSource) {
    const where: Prisma.DealerDiscountWhereInput = { 
      ...(dealerId ? { dealerId } : {}),
      ...(source ? { source } : {}),
    };

    const [total, active, inactive, byType, avgDiscount] = await Promise.all([
      prisma.dealerDiscount.count({ where }),
      prisma.dealerDiscount.count({ where: { ...where, isActive: true } }),
      prisma.dealerDiscount.count({ where: { ...where, isActive: false } }),
      prisma.dealerDiscount.groupBy({
        by: ["discountType"],
        where,
        _count: true,
        _avg: { discountValue: true },
      }),
      prisma.dealerDiscount.aggregate({
        where,
        _avg: { discountValue: true },
      }),
    ]);

    // Get expiring soon (within 7 days)
    const expiringSoon = await prisma.dealerDiscount.findMany({
      where: {
        ...where,
        isActive: true,
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        dealer: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      total,
      active,
      inactive,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.discountType] = {
            count: item._count,
            avgValue: item._avg.discountValue,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
      avgDiscount: avgDiscount._avg.discountValue,
      expiringSoon,
    };
  }

  /**
   * Auto-expire promotions
   */
  async autoExpirePromotions() {
    const now = new Date();

    const expired = await prisma.dealerDiscount.updateMany({
      where: {
        isActive: true,
        endDate: { lt: now },
      },
      data: {
        isActive: false,
      },
    });

    return { count: expired.count };
  }
}