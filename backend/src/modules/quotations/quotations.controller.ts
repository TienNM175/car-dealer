import { Request, Response, NextFunction } from 'express';
import { QuotationsService } from './quotations.service';
import { ResponseUtil } from '../../utils/response.util';
import { QuotationStatus, Prisma } from '@prisma/client';

const quotationsService = new QuotationsService();

export class QuotationsController {
  /**
   * Get all quotations
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        customerId: req.query.customerId as string,
        vehicleId: req.query.vehicleId as string,
        staffId: req.query.staffId as string,
        status: req.query.status as QuotationStatus,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        validFrom: req.query.validFrom as string,
        validTo: req.query.validTo as string,
        paymentType: req.query.paymentType as any,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await quotationsService.getAll(
        filters,
        pagination,
        req.user?.userId,
        req.user?.role,
        req.user?.dealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        'Quotations retrieved successfully',
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get quotation by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quotation = await quotationsService.getById(
        id,
        req.user?.userId,
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.success(res, quotation, 'Quotation retrieved successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Access denied')) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get quotation by quote number
   */
  async getByQuoteNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { quoteNumber } = req.params;
      const quotation = await quotationsService.getByQuoteNumber(quoteNumber);
      return ResponseUtil.success(res, quotation, 'Quotation retrieved successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get quotations by customer ID
   */
  async getByCustomerId(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await quotationsService.getByCustomerId(customerId, pagination);
      return ResponseUtil.success(
        res,
        result.data,
        'Customer quotations retrieved successfully',
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Create new quotation
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const staffId = req.user?.userId;
      if (!staffId) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }

      const data: Prisma.QuotationCreateInput = {
        customer: { connect: { id: req.body.customerId } },
        vehicle: { connect: { id: req.body.vehicleId } },
        basePrice: req.body.basePrice,
        discount: req.body.discount || 0,
        paymentType: req.body.paymentType || 'FULL',
        installmentMonths: req.body.installmentMonths,
        ...(req.body.validUntil && { validUntil: new Date(req.body.validUntil) }), // chỉ thêm khi có
        status: req.body.status || 'DRAFT',
        notes: req.body.notes,
      };

      const quotation = await quotationsService.create(data, staffId);
      return ResponseUtil.created(res, quotation, 'Quotation created successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('not available')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes('cannot be negative')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update quotation
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const dealerId = req.user?.dealerId;

      if (!userId || !userRole) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }

      const data: Prisma.QuotationUpdateInput = {
        ...(req.body.basePrice && { basePrice: req.body.basePrice }),
        ...(req.body.discount !== undefined && { discount: req.body.discount }),
        ...(req.body.paymentType && { paymentType: req.body.paymentType }),
        ...(req.body.installmentMonths && { installmentMonths: req.body.installmentMonths }),
        ...(req.body.validUntil && { validUntil: new Date(req.body.validUntil) }),
        ...(req.body.notes !== undefined && { notes: req.body.notes }),
      };

      const quotation = await quotationsService.update(id, data, userId, userRole, dealerId);
      return ResponseUtil.success(res, quotation, 'Quotation updated successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Access denied')) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes('Cannot update')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes('cannot be negative')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update quotation status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const dealerId = req.user?.dealerId;

      if (!userId || !userRole) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }

      if (!status) {
        return ResponseUtil.badRequest(res, 'Status is required');
      }

      const quotation = await quotationsService.updateStatus(
        id,
        status,
        userId,
        userRole,
        dealerId
      );

      return ResponseUtil.success(res, quotation, `Quotation ${status.toLowerCase()} successfully`);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Access denied')) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes('Cannot transition')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Delete quotation
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const dealerId = req.user?.dealerId;

      if (!userId || !userRole) {
        return ResponseUtil.unauthorized(res, 'Authentication required');
      }

      const result = await quotationsService.delete(id, userId, userRole, dealerId);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Access denied')) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes('Can only delete')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Expire old quotations (Cron job or manual trigger)
   */
  async expireOldQuotations(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quotationsService.expireOldQuotations();
      return ResponseUtil.success(
        res,
        result,
        `${result.count} quotations expired successfully`
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get quotation statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const dealerId =
        req.user?.role === 'ADMIN' || req.user?.role === 'EVM_STAFF'
          ? undefined
          : req.user?.dealerId;

      const stats = await quotationsService.getStatistics(dealerId);
      return ResponseUtil.success(res, stats, 'Statistics retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }
}
