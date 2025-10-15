import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { ResponseUtil } from '../../utils/response.util';

const inventoryService = new InventoryService();

export class InventoryController {
  async getEVMInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        vehicleId: req.query.vehicleId as string,
        lowStock: req.query.lowStock === 'true',
        minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
      };
      const data = await inventoryService.getEVMInventory(filters);
      return ResponseUtil.success(res, data, 'EVM inventory retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getEVMInventoryByVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params;
      const data = await inventoryService.getEVMInventoryByVehicle(vehicleId);
      return ResponseUtil.success(res, data);
    } catch (error: any) {
      if (error.message.includes('not found'))
        return ResponseUtil.notFound(res, error.message);
      return next(error);
    }
  }

  async updateEVMInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params;
      const data = await inventoryService.updateEVMInventory(vehicleId, req.body);
      return ResponseUtil.success(res, data, 'EVM inventory updated');
    } catch (error: any) {
      if (error.message.includes('not found'))
        return ResponseUtil.notFound(res, error.message);
      if (error.message.includes('cannot be negative'))
        return ResponseUtil.badRequest(res, error.message);
      return next(error);
    }
  }

  async getAllDealerInventories(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        vehicleId: req.query.vehicleId as string,
        dealerId: req.query.dealerId as string,
        lowStock: req.query.lowStock === 'true',
        minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
      };
      const data = await inventoryService.getAllDealerInventories(filters);
      return ResponseUtil.success(res, data, 'Dealer inventories retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getDealerInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId } = req.params;
      const filters = {
        vehicleId: req.query.vehicleId as string,
        lowStock: req.query.lowStock === 'true',
      };
      const data = await inventoryService.getDealerInventory(dealerId, filters);
      return ResponseUtil.success(res, data, 'Dealer inventory retrieved');
    } catch (error: any) {
      if (error.message.includes('not found'))
        return ResponseUtil.notFound(res, error.message);
      return next(error);
    }
  }

  async getDealerInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, vehicleId } = req.params;
      const data = await inventoryService.getDealerInventoryItem(dealerId, vehicleId);
      return ResponseUtil.success(res, data);
    } catch (error: any) {
      if (error.message.includes('not found'))
        return ResponseUtil.notFound(res, error.message);
      return next(error);
    }
  }

  async getLowStockAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
      const data = await inventoryService.getLowStockAlerts(threshold);
      return ResponseUtil.success(res, data, 'Low stock alerts retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getInventorySummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.getInventorySummary();
      return ResponseUtil.success(res, data, 'Inventory summary retrieved');
    } catch (error) {
      return next(error);
    }
  }
}
