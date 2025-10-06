import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { ResponseUtil } from '../../utils/response.util';

const inventoryService = new InventoryService();

export class InventoryController {
  /**
   * Get EVM Inventory
   */
  async getEVMInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        vehicleId: req.query.vehicleId as string,
        lowStock: req.query.lowStock === 'true',
        minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
      };

      const inventory = await inventoryService.getEVMInventory(filters);
      return ResponseUtil.success(res, inventory, 'EVM inventory retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get EVM Inventory by Vehicle
   */
  async getEVMInventoryByVehicle(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params;
      const inventory = await inventoryService.getEVMInventoryByVehicle(vehicleId);
      return ResponseUtil.success(res, inventory);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update EVM Inventory
   */
  async updateEVMInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { vehicleId } = req.params;
      const inventory = await inventoryService.updateEVMInventory(vehicleId, req.body);
      return ResponseUtil.success(res, inventory, 'EVM inventory updated successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('cannot be negative')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get All Dealer Inventories
   */
  async getAllDealerInventories(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        vehicleId: req.query.vehicleId as string,
        dealerId: req.query.dealerId as string,
        lowStock: req.query.lowStock === 'true',
        minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
      };

      const inventories = await inventoryService.getAllDealerInventories(filters);
      return ResponseUtil.success(res, inventories, 'Dealer inventories retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get Dealer Inventory
   */
  async getDealerInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId } = req.params;
      const filters = {
        vehicleId: req.query.vehicleId as string,
        lowStock: req.query.lowStock === 'true',
      };

      const inventory = await inventoryService.getDealerInventory(dealerId, filters);
      return ResponseUtil.success(res, inventory, 'Dealer inventory retrieved successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get Dealer Inventory Item
   */
  async getDealerInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, vehicleId } = req.params;
      const inventory = await inventoryService.getDealerInventoryItem(dealerId, vehicleId);
      return ResponseUtil.success(res, inventory);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update Dealer Inventory
   */
  async updateDealerInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, vehicleId } = req.params;
      const inventory = await inventoryService.updateDealerInventory(
        dealerId,
        vehicleId,
        req.body
      );
      return ResponseUtil.success(res, inventory, 'Dealer inventory updated successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('cannot be negative') || error.message.includes('must be non-negative')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Transfer Inventory
   */
  async transferInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.transferInventory(req.body);
      return ResponseUtil.success(res, result, 'Inventory transferred successfully');
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('does not have')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (
        error.message.includes('Insufficient') ||
        error.message.includes('must be positive') ||
        error.message.includes('Cannot transfer')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get Low Stock Alerts
   */
  async getLowStockAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
      const alerts = await inventoryService.getLowStockAlerts(threshold);
      return ResponseUtil.success(res, alerts, 'Low stock alerts retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get Inventory Summary
   */
  async getInventorySummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await inventoryService.getInventorySummary();
      return ResponseUtil.success(res, summary, 'Inventory summary retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Reserve Inventory
   */
  async reserveInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, vehicleId } = req.params;
      const { quantity } = req.body;
      
      const inventory = await inventoryService.reserveInventory(dealerId, vehicleId, quantity || 1);
      return ResponseUtil.success(res, inventory, 'Inventory reserved successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Insufficient') || error.message.includes('must be positive')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Complete Sale
   */
  async completeSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, vehicleId } = req.params;
      const { quantity } = req.body;
      
      const inventory = await inventoryService.completeSale(dealerId, vehicleId, quantity || 1);
      return ResponseUtil.success(res, inventory, 'Sale completed successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Insufficient') || error.message.includes('must be positive')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Cancel Reservation
   */
  async cancelReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const { dealerId, vehicleId } = req.params;
      const { quantity } = req.body;
      
      const inventory = await inventoryService.cancelReservation(dealerId, vehicleId, quantity || 1);
      return ResponseUtil.success(res, inventory, 'Reservation cancelled successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot cancel') || error.message.includes('must be positive')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }
}
