import { Request, Response, NextFunction } from 'express';
import { DealerOrderService } from './dealer-order.service';
import { ResponseUtil } from '../../utils/response.util';

const dealerOrderService = new DealerOrderService();

export class DealerOrderController {
  /**
   * Get all dealer orders
   */
  async getAllDealerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        dealerId: req.query.dealerId as string,
        vehicleId: req.query.vehicleId as string,
        status: req.query.status as any,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await dealerOrderService.getAllDealerOrders(
        filters,
        pagination,
        req.user?.role,
        req.user?.dealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        'Dealer orders retrieved successfully',
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get dealer order by ID
   */
  async getDealerOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await dealerOrderService.getDealerOrderById(id);
      return ResponseUtil.success(res, order, 'Dealer order retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Dealer order not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Create dealer order
   */
  async createDealerOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await dealerOrderService.createDealerOrder(req.body);
      return ResponseUtil.created(res, order, 'Dealer order created successfully');
    } catch (error: any) {
      if (
        error.message.includes('not found') ||
        error.message.includes('not available') ||
        error.message.includes('Insufficient') ||
        error.message.includes('inactive') ||
        error.message.includes('must be')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update dealer order
   */
  async updateDealerOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await dealerOrderService.updateDealerOrder(id, req.body);
      return ResponseUtil.success(res, order, 'Dealer order updated successfully');
    } catch (error: any) {
      if (error.message === 'Dealer order not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (
        error.message.includes('Can only update') ||
        error.message.includes('Insufficient')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update dealer order status
   */
  async updateDealerOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await dealerOrderService.updateDealerOrderStatus(
        id,
        status,
        req.user?.userId || ''
      );

      return ResponseUtil.success(res, order, 'Dealer order status updated successfully');
    } catch (error: any) {
      if (error.message === 'Dealer order not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot transition')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Cancel dealer order
   */
  async cancelDealerOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await dealerOrderService.cancelDealerOrder(id, reason);
      return ResponseUtil.success(res, order, 'Dealer order cancelled successfully');
    } catch (error: any) {
      if (error.message === 'Dealer order not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (
        error.message.includes('Cannot cancel') ||
        error.message.includes('already cancelled')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get dealer order statistics
   */
  async getDealerOrderStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        dealerId: req.query.dealerId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const stats = await dealerOrderService.getDealerOrderStatistics(filters);
      return ResponseUtil.success(res, stats, 'Dealer order statistics retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const dealerId = req.query.dealerId as string;
      const statusCounts = await dealerOrderService.getOrdersByStatus(dealerId);
      return ResponseUtil.success(
        res,
        statusCounts,
        'Order status summary retrieved successfully'
      );
    } catch (error: any) {
      return next(error);
    }
  }
}
