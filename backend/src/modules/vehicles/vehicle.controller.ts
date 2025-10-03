import { Request, Response, NextFunction } from 'express';
import { VehicleService } from './vehicle.service';
import { ResponseUtil } from '../../utils/response.util';

const vehicleService = new VehicleService();

export class VehicleController {
  async getAllVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        manufacturerId: req.query.manufacturerId as string,
        status: req.query.status as any,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        bodyType: req.query.bodyType as string,
        color: req.query.color as string,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await vehicleService.getAllVehicles(filters, pagination);
      return ResponseUtil.success(res, result.data, 'Vehicles retrieved successfully', 200, result.meta);
    } catch (error: any) {
      return next(error);
    }
  }

  async getVehicleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getVehicleById(id);
      return ResponseUtil.success(res, vehicle, 'Vehicle retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Vehicle not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
      return ResponseUtil.created(res, vehicle, 'Vehicle created successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  async updateVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.updateVehicle(id, req.body);
      return ResponseUtil.success(res, vehicle, 'Vehicle updated successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  async deleteVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await vehicleService.deleteVehicle(id);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message.includes('Cannot delete')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  async compareVehicles(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleIds } = req.body;
      const vehicles = await vehicleService.compareVehicles(vehicleIds);
      return ResponseUtil.success(res, vehicles, 'Vehicles comparison retrieved');
    } catch (error: any) {
      if (error.message.includes('select')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  async getVehiclesByManufacturer(req: Request, res: Response, next: NextFunction) {
    try {
      const { manufacturerId } = req.params;
      const vehicles = await vehicleService.getVehiclesByManufacturer(manufacturerId);
      return ResponseUtil.success(res, vehicles);
    } catch (error: any) {
      return next(error);
    }
  }

  async updateVehicleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const vehicle = await vehicleService.updateVehicleStatus(id, status);
      return ResponseUtil.success(res, vehicle, 'Vehicle status updated');
    } catch (error: any) {
      return next(error);
    }
  }
}
