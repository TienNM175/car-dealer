import { Request, Response, NextFunction } from "express";
import { PromotionsService } from "./promotions.service";
import { ResponseUtil } from "../../utils/response.util";
import { DiscountType } from "@prisma/client";

const promotionsService = new PromotionsService();

export class PromotionsController {
  /**
   * Get all promotions
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        dealerId: req.query.dealerId as string,
        discountType: req.query.discountType as DiscountType,
        isActive: req.query.isActive
          ? req.query.isActive === "true"
          : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minDiscount: req.query.minDiscount
          ? Number(req.query.minDiscount)
          : undefined,
        maxDiscount: req.query.maxDiscount
          ? Number(req.query.maxDiscount)
          : undefined,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const result = await promotionsService.getAll(
        filters,
        pagination,
        req.user?.role,
        req.user?.dealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        "Promotions retrieved successfully",
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get promotion by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const promotion = await promotionsService.getById(
        id,
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.success(
        res,
        promotion,
        "Promotion retrieved successfully"
      );
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Access denied")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get promotions by dealer ID
   */
  async getByDealerId(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId } = req.params;
      const includeInactive = req.query.includeInactive === "true";
      const promotions = await promotionsService.getByDealerId(
        dealerId,
        includeInactive
      );
      return ResponseUtil.success(
        res,
        promotions,
        "Dealer promotions retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get active promotions for a dealer
   */
  async getActivePromotions(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId } = req.params;
      const promotions = await promotionsService.getActivePromotions(dealerId);
      return ResponseUtil.success(
        res,
        promotions,
        "Active promotions retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get all available promotions for a dealer (dealer + manufacturer)
   */
  async getAvailablePromotions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { dealerId } = req.params;
      const result =
        await promotionsService.getAvailablePromotionsForDealer(dealerId);
      return ResponseUtil.success(
        res,
        result.allPromotions,
        "Available promotions retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Create new promotion
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      if (!userRole) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      let dealerId = req.body.dealerId;
      if (userRole === "DEALER_STAFF" || userRole === "DEALER_MANAGER") {
        dealerId = req.user?.dealerId;
      }

      if (!dealerId) {
        return ResponseUtil.badRequest(res, "Dealer ID is required");
      }

      const data = {
        dealer: { connect: { id: dealerId } },
        name: req.body.name,
        description: req.body.description,
        discountType: req.body.discountType || "PERCENTAGE",
        discountValue: req.body.discountValue,
        minPurchase: req.body.minPurchase,
        // EVM/Admin can create MANUFACTURER promotions, Dealer creates DEALER promotions
        source:
          userRole === "ADMIN" || userRole === "EVM_STAFF"
            ? req.body.source || "MANUFACTURER"
            : "DEALER",
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        isActive: req.body.isActive ?? true,
      };

      const promotion = await promotionsService.create(data, userRole);
      return ResponseUtil.created(
        res,
        promotion,
        "Promotion created successfully"
      );
    } catch (error: any) {
      if (
        error.message.includes("not found") ||
        error.message.includes("must be after") ||
        error.message.includes("must be between") ||
        error.message.includes("cannot be negative") ||
        error.message.includes("already exists")
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update promotion
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;
      const dealerId = req.user?.dealerId;

      if (!userRole) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const data = {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.description !== undefined && {
          description: req.body.description,
        }),
        ...(req.body.discountType && { discountType: req.body.discountType }),
        ...(req.body.discountValue && {
          discountValue: req.body.discountValue,
        }),
        ...(req.body.minPurchase !== undefined && {
          minPurchase: req.body.minPurchase,
        }),
        ...(req.body.startDate && { startDate: new Date(req.body.startDate) }),
        ...(req.body.endDate !== undefined && {
          endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        }),
        ...(req.body.isActive !== undefined && { isActive: req.body.isActive }),
      };

      const promotion = await promotionsService.update(
        id,
        data,
        userRole,
        dealerId
      );
      return ResponseUtil.success(
        res,
        promotion,
        "Promotion updated successfully"
      );
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Access denied")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (
        error.message.includes("must be after") ||
        error.message.includes("must be between") ||
        error.message.includes("cannot be negative")
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Toggle promotion active status
   */
  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;
      const dealerId = req.user?.dealerId;

      if (!userRole) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const promotion = await promotionsService.toggleStatus(
        id,
        userRole,
        dealerId
      );
      return ResponseUtil.success(
        res,
        promotion,
        `Promotion ${promotion.isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Access denied")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Delete promotion
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;
      const dealerId = req.user?.dealerId;

      if (!userRole) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const result = await promotionsService.delete(id, userRole, dealerId);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Access denied")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes("Cannot delete")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Calculate discount for a purchase
   */
  async calculateDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, purchaseAmount, promotionId } = req.body;

      if (!dealerId || !purchaseAmount) {
        return ResponseUtil.badRequest(
          res,
          "Dealer ID and purchase amount are required"
        );
      }

      if (purchaseAmount <= 0) {
        return ResponseUtil.badRequest(res, "Purchase amount must be positive");
      }

      const result = await promotionsService.calculateDiscount(
        dealerId,
        Number(purchaseAmount),
        promotionId
      );

      return ResponseUtil.success(
        res,
        result,
        "Discount calculated successfully"
      );
    } catch (error: any) {
      if (
        error.message.includes("Invalid promotion") ||
        error.message.includes("Minimum purchase")
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get promotion statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const dealerId =
        req.user?.role === "ADMIN" || req.user?.role === "EVM_STAFF"
          ? undefined
          : req.user?.dealerId;

      const stats = await promotionsService.getStatistics(dealerId);
      return ResponseUtil.success(
        res,
        stats,
        "Statistics retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Auto-expire promotions (Cron job or manual trigger)
   */
  async autoExpire(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await promotionsService.autoExpirePromotions();
      return ResponseUtil.success(
        res,
        result,
        `${result.count} promotions expired successfully`
      );
    } catch (error: any) {
      return next(error);
    }
  }
}
