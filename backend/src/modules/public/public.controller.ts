// backend/src/modules/public/public.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PublicService } from './public.service';
import { ResponseUtil } from '../../utils/response.util';

const publicService = new PublicService();

export class PublicController {
  async getVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        manufacturerId: req.query.manufacturerId as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        bodyType: req.query.bodyType as string,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await publicService.getVehicles(filters, pagination);
      return ResponseUtil.success(res, result.data, 'Vehicles retrieved', 200, result.meta);
    } catch (error: any) {
      return next(error);
    }
  }

  async getVehicleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicle = await publicService.getVehicleById(id);
      return ResponseUtil.success(res, vehicle);
    } catch (error: any) {
      if (error.message === 'Vehicle not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  async compareVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleIds } = req.body;
      const vehicles = await publicService.compareVehicles(vehicleIds);
      return ResponseUtil.success(res, vehicles);
    } catch (error: any) {
      return next(error);
    }
  }

  async getManufacturers(_req: Request, res: Response, next: NextFunction) {
    try {
      const manufacturers = await publicService.getManufacturers();
      return ResponseUtil.success(res, manufacturers);
    } catch (error: any) {
      return next(error);
    }
  }

  async getDealers(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleId = req.query.vehicleId as string;
      const dealers = await publicService.getDealers(vehicleId);
      return ResponseUtil.success(res, dealers);
    } catch (error: any) {
      return next(error);
    }
  }

  async checkVehicleAtDealer(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, vehicleId } = req.params;
      const result = await publicService.checkVehicleAtDealer(dealerId, vehicleId);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  async bookTestDrive(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await publicService.bookTestDrive(req.body);
      return ResponseUtil.created(res, result, 'Test drive booked successfully');
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('not available')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Lookup contract by contract code and customer info
   */
  async lookupContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractCode, email, phone } = req.body;

      if (!contractCode || (!email && !phone)) {
        return ResponseUtil.badRequest(
          res,
          'Contract code and either email or phone is required'
        );
      }

      const result = await publicService.lookupContract(
        contractCode,
        email,
        phone
      );

      return ResponseUtil.success(
        res,
        result,
        'Contract information retrieved successfully'
      );
    } catch (error: any) {
      if (error.message === 'Contract not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('does not match')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get debt information for a contract
   */
  async getContractDebt(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractCode } = req.params;
      const { email, phone } = req.query;

      if (!email && !phone) {
        return ResponseUtil.badRequest(
          res,
          'Email or phone is required for verification'
        );
      }

      const debtInfo = await publicService.getContractDebt(
        contractCode,
        email as string,
        phone as string
      );

      return ResponseUtil.success(
        res,
        debtInfo,
        'Debt information retrieved successfully'
      );
    } catch (error: any) {
      if (error.message === 'Contract not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('does not match')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get payment schedule for installment contract
   */
  async getPaymentSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { contractCode } = req.params;
      const { email, phone } = req.query;

      if (!email && !phone) {
        return ResponseUtil.badRequest(
          res,
          'Email or phone is required for verification'
        );
      }

      const schedule = await publicService.getPaymentSchedule(
        contractCode,
        email as string,
        phone as string
      );

      return ResponseUtil.success(
        res,
        schedule,
        'Payment schedule retrieved successfully'
      );
    } catch (error: any) {
      if (error.message === 'Contract not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('does not match')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes('not an installment contract')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }
}
