import { Request, Response, NextFunction } from 'express';
import { DealerService } from './dealer.service';
import { ResponseUtil } from '../../utils/response.util';

const dealerService = new DealerService();

export class DealerController {
  /**
   * Get all dealers
   */
  async getAllDealers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        regionId: req.query.regionId as string,
        city: req.query.city as string,
        isActive:
          req.query.isActive === 'true'
            ? true
            : req.query.isActive === 'false'
            ? false
            : undefined,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await dealerService.getAllDealers(filters, pagination);
      return ResponseUtil.success(
        res,
        result.data,
        'Dealers retrieved successfully',
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get dealer by ID
   */
  async getDealerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dealer = await dealerService.getDealerById(id);
      return ResponseUtil.success(res, dealer, 'Dealer retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Create dealer
   */
  async createDealer(req: Request, res: Response, next: NextFunction) {
    try {
      const dealer = await dealerService.createDealer(req.body);
      return ResponseUtil.created(res, dealer, 'Dealer created successfully');
    } catch (error: any) {
      if (
        error.message.includes('already exists') ||
        error.message === 'Region not found'
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update dealer
   */
  async updateDealer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dealer = await dealerService.updateDealer(id, req.body);
      return ResponseUtil.success(res, dealer, 'Dealer updated successfully');
    } catch (error: any) {
      if (
        error.message === 'Dealer not found' ||
        error.message === 'Region not found'
      ) {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Delete dealer
   */
  async deleteDealer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await dealerService.deleteDealer(id);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot delete')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get dealer staff
   */
  async getDealerStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const staff = await dealerService.getDealerStaff(id);
      return ResponseUtil.success(res, staff, 'Dealer staff retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Add staff to dealer
   */
  async addStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const staffData = {
        ...req.body,
        dealerId: id,
      };
      const staff = await dealerService.addStaff(staffData);
      return ResponseUtil.created(res, staff, 'Staff added successfully');
    } catch (error: any) {
      if (
        error.message === 'Dealer not found' ||
        error.message.includes('Email already exists') ||
        error.message.includes('Invalid role') ||
        error.message.includes('inactive dealer')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update staff
   */
  async updateStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, staffId } = req.params;
      const staff = await dealerService.updateStaff(staffId, id, req.body);
      return ResponseUtil.success(res, staff, 'Staff updated successfully');
    } catch (error: any) {
      if (
        error.message.includes('not found') ||
        error.message.includes('Invalid role')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Remove staff from dealer
   */
  async removeStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, staffId } = req.params;
      const result = await dealerService.removeStaff(staffId, id);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot remove')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get dealer inventory
   */
  async getDealerInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const inventory = await dealerService.getDealerInventory(id);
      return ResponseUtil.success(res, inventory, 'Dealer inventory retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get dealer orders
   */
  async getDealerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const status = req.query.status as string;
      const orders = await dealerService.getDealerOrders(id, status);
      return ResponseUtil.success(res, orders, 'Dealer orders retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get dealer sales statistics
   */
  async getDealerSalesStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const fromDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : undefined;
      const toDate = req.query.toDate
        ? new Date(req.query.toDate as string)
        : undefined;

      const stats = await dealerService.getDealerSalesStats(id, fromDate, toDate);
      return ResponseUtil.success(res, stats, 'Dealer sales statistics retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get dealer targets
   */
  async getDealerTargets(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const targets = await dealerService.getDealerTargets(id, year);
      return ResponseUtil.success(res, targets, 'Dealer targets retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Set dealer target
   */
  async setDealerTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { year, month, targetAmount } = req.body;
      const target = await dealerService.setDealerTarget(id, year, month, targetAmount);
      return ResponseUtil.success(res, target, 'Dealer target set successfully');
    } catch (error: any) {
      if (error.message === 'Dealer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('must be')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get all regions
   */
  async getAllRegions(_req: Request, res: Response, next: NextFunction) {
    try {
      const regions = await dealerService.getAllRegions();
      return ResponseUtil.success(res, regions, 'Regions retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }
}
