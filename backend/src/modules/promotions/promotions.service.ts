import prisma from '../../config/database';
import { Prisma, DiscountType } from '@prisma/client';

interface PromotionFilters {
  search?: string;
  dealerId?: string;
  discountType?: DiscountType;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  minDiscount?: number;
  maxDiscount?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PromotionsService {
  /**
   * Get all promotions with filters and pagination
   */
  async getAll(filters: PromotionFilters, pagination: PaginationParams, userRole?: string, dealerId?: string) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    const where: Prisma.DealerDiscountWhereInput = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.dealerId && { dealerId: filters.dealerId }),
      ...(filters.discountType && { discountType: filters.discountType }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.minDiscount && { discountValue: { gte: filters.minDiscount } }),
      ...(filters.maxDiscount && { discountValue: { lte: filters.maxDiscount } }),
      ...(filters.startDate && filters.endDate && {
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
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      where.dealerId = dealerId || '';
    }

    const total = await prisma.dealerDiscount.count({ where });

    const promotions = await prisma.dealerDiscount.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
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
      include: {
        dealer: true,
      },
    });

    if (!promotion) {
      throw new Error('Promotion not found');
    }

    // Check authorization
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      if (promotion.dealerId !== dealerId) {
        throw new Error('Access denied');
      }
    }

    return promotion;
  }

  /**
   * Get promotions by dealer ID
   */
  async getByDealerId(dealerId: string, includeInactive = false) {
    const where: Prisma.DealerDiscountWhereInput = {
      dealerId,
      ...(includeInactive ? {} : { isActive: true }),
    };

    const promotions = await prisma.dealerDiscount.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
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
        OR: [
          { endDate: { gte: now } },
          { endDate: null },
        ],
      },
      orderBy: { discountValue: 'desc' },
    });

    return promotions;
  }

  /**
   * Create new promotion
   */
  async create(data: Prisma.DealerDiscountCreateInput, _userRole: string, _userId?: string) {
    // Validate dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: data.dealer.connect?.id },
    });
    if (!dealer) {
      throw new Error('Dealer not found');
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate discount value
    if (data.discountType === 'PERCENTAGE') {
      if (Number(data.discountValue) < 0 || Number(data.discountValue) > 100) {
        throw new Error('Percentage discount must be between 0 and 100');
      }
    } else {
      if (Number(data.discountValue) < 0) {
        throw new Error('Discount value cannot be negative');
      }
    }

    // Validate min purchase
    if (data.minPurchase && Number(data.minPurchase) < 0) {
      throw new Error('Minimum purchase cannot be negative');
    }

    // Check for overlapping promotions
    const overlapping = await prisma.dealerDiscount.findFirst({
      where: {
        dealerId: dealer.id,
        isActive: true,
        name: data.name,
        startDate: { lte: endDate || new Date('2099-12-31') },
        OR: [
          { endDate: { gte: startDate } },
          { endDate: null },
        ],
      },
    });

    if (overlapping) {
      throw new Error('A promotion with this name already exists in the same period');
    }

    const promotion = await prisma.dealerDiscount.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
      },
      include: {
        dealer: true,
      },
    });

    return promotion;
  }

  /**
   * Update promotion
   */
  async update(id: string, data: Prisma.DealerDiscountUpdateInput, userRole: string, dealerId?: string) {
    const existing = await prisma.dealerDiscount.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Promotion not found');
    }

    // Check authorization
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      if (existing.dealerId !== dealerId) {
        throw new Error('Access denied');
      }
    }

    // Validate dates if provided
    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate as Date) : existing.startDate;
      const endDate = data.endDate ? new Date(data.endDate as Date) : existing.endDate;

      if (endDate && endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Validate discount value if provided
    if (data.discountValue || data.discountType) {
      const discountType = (data.discountType as DiscountType) || existing.discountType;
      const discountValue = data.discountValue || existing.discountValue;

      if (discountType === 'PERCENTAGE') {
        if (Number(discountValue) < 0 || Number(discountValue) > 100) {
          throw new Error('Percentage discount must be between 0 and 100');
        }
      } else {
        if (Number(discountValue) < 0) {
          throw new Error('Discount value cannot be negative');
        }
      }
    }

    // Validate min purchase if provided
    if (data.minPurchase && Number(data.minPurchase) < 0) {
      throw new Error('Minimum purchase cannot be negative');
    }

    const promotion = await prisma.dealerDiscount.update({
      where: { id },
      data,
      include: {
        dealer: true,
      },
    });

    return promotion;
  }

  /**
   * Toggle promotion active status
   */
  async toggleStatus(id: string, userRole: string, dealerId?: string) {
    const existing = await prisma.dealerDiscount.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Promotion not found');
    }

    // Check authorization
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      if (existing.dealerId !== dealerId) {
        throw new Error('Access denied');
      }
    }

    const promotion = await prisma.dealerDiscount.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: {
        dealer: true,
      },
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
      throw new Error('Promotion not found');
    }

    // Check authorization
    if (userRole !== 'ADMIN') {
      if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
        if (promotion.dealerId !== dealerId) {
          throw new Error('Access denied');
        }
      }
    }

    // Can only delete inactive promotions or future promotions
    if (promotion.isActive && new Date(promotion.startDate) <= new Date()) {
      throw new Error('Cannot delete active promotion that has already started');
    }

    await prisma.dealerDiscount.delete({
      where: { id },
    });

    return { message: 'Promotion deleted successfully' };
  }

  /**
   * Calculate discount amount for a purchase
   */
  async calculateDiscount(dealerId: string, purchaseAmount: number, promotionId?: string) {
    let promotion;

    if (promotionId) {
      // Use specific promotion
      promotion = await prisma.dealerDiscount.findUnique({
        where: { id: promotionId },
      });

      if (!promotion || !promotion.isActive || promotion.dealerId !== dealerId) {
        throw new Error('Invalid promotion');
      }
    } else {
      // Find best applicable promotion
      const now = new Date();
      const applicablePromotions = await prisma.dealerDiscount.findMany({
        where: {
            dealerId,
            isActive: true,
            startDate: { lte: now },
            AND: [
            {
                OR: [
                { endDate: { gte: now } },
                { endDate: null },
                ],
            },
            {
                OR: [
                { minPurchase: { lte: purchaseAmount } },
                { minPurchase: null },
                ],
            },
            ],
        },
        orderBy: { discountValue: 'desc' },
        });
        
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
        if (promo.discountType === 'PERCENTAGE') {
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
      if (promotion.minPurchase && purchaseAmount < Number(promotion.minPurchase)) {
        throw new Error(`Minimum purchase amount is ${promotion.minPurchase}`);
      }

      if (promotion.discountType === 'PERCENTAGE') {
        discountAmount = purchaseAmount * (Number(promotion.discountValue) / 100);
      } else {
        discountAmount = Number(promotion.discountValue);
      }
    }

    const finalAmount = Math.max(0, purchaseAmount - discountAmount);

    return {
      originalAmount: purchaseAmount,
      discountAmount,
      finalAmount,
      promotion: promotion ? {
        id: promotion.id,
        name: promotion.name,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
      } : null,
    };
  }

  /**
   * Get promotion statistics
   */
  async getStatistics(dealerId?: string) {
    const where: Prisma.DealerDiscountWhereInput = dealerId
      ? { dealerId }
      : {};

    const [total, active, inactive, byType, avgDiscount] = await Promise.all([
      prisma.dealerDiscount.count({ where }),
      prisma.dealerDiscount.count({ where: { ...where, isActive: true } }),
      prisma.dealerDiscount.count({ where: { ...where, isActive: false } }),
      prisma.dealerDiscount.groupBy({
        by: ['discountType'],
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
      byType: byType.reduce((acc, item) => {
        acc[item.discountType] = {
          count: item._count,
          avgValue: item._avg.discountValue,
        };
        return acc;
      }, {} as Record<string, any>),
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