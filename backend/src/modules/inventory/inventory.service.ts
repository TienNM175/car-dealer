import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

interface InventoryFilters {
  vehicleId?: string;
  dealerId?: string;
  lowStock?: boolean;
  minQuantity?: number;
}

export class InventoryService {
  /**
   * Get EVM (Manufacturer) Inventory
   */
  async getEVMInventory(filters: InventoryFilters = {}) {
    const where: Prisma.EVMInventoryWhereInput = {
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.lowStock && { available: { lte: 10 } }),
      ...(filters.minQuantity && { quantity: { gte: filters.minQuantity } }),
    };

    return await prisma.eVMInventory.findMany({
      where,
      include: {
        vehicle: {
          include: {
            manufacturer: { select: { id: true, name: true, code: true } },
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
      orderBy: { available: 'asc' },
    });
  }

  /**
   * Get single EVM inventory by vehicle ID
   */
  async getEVMInventoryByVehicle(vehicleId: string) {
    const inventory = await prisma.eVMInventory.findUnique({
      where: { vehicleId },
      include: {
        vehicle: {
          include: {
            manufacturer: true,
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
    });

    if (!inventory) throw new Error('EVM inventory not found for this vehicle');
    return inventory;
  }

  /**
   * Update EVM Inventory (admin only)
   */
  async updateEVMInventory(
    vehicleId: string,
    data: { quantity?: number; reserved?: number; location?: string }
  ) {
    const existing = await prisma.eVMInventory.findUnique({ where: { vehicleId } });
    if (!existing) throw new Error('EVM inventory not found');

    const quantity = data.quantity ?? existing.quantity;
    const reserved = data.reserved ?? existing.reserved;
    const available = quantity - reserved;

    if (available < 0) throw new Error('Available quantity cannot be negative');

    return await prisma.eVMInventory.update({
      where: { vehicleId },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.reserved !== undefined && { reserved: data.reserved }),
        available,
        ...(data.location && { location: data.location }),
      },
      include: {
        vehicle: { include: { manufacturer: true } },
      },
    });
  }

  /**
   * Get All Dealer Inventories
   */
  async getAllDealerInventories(filters: InventoryFilters = {}) {
    const where: Prisma.InventoryWhereInput = {
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.dealerId && { dealerId: filters.dealerId }),
      ...(filters.lowStock && { available: { lte: 5 } }),
      ...(filters.minQuantity && { quantity: { gte: filters.minQuantity } }),
    };

    return await prisma.inventory.findMany({
      where,
      include: {
        dealer: { select: { id: true, name: true, code: true, city: true, regionId: true } },
        vehicle: {
          include: {
            manufacturer: { select: { id: true, name: true, code: true } },
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
      orderBy: [{ dealerId: 'asc' }, { available: 'asc' }],
    });
  }

  /**
   * Get Dealer Inventory by Dealer ID
   */
  async getDealerInventory(dealerId: string, filters: InventoryFilters = {}) {
    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new Error('Dealer not found');

    const where: Prisma.InventoryWhereInput = {
      dealerId,
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.lowStock && { available: { lte: 5 } }),
    };

    return await prisma.inventory.findMany({
      where,
      include: {
        vehicle: {
          include: {
            manufacturer: { select: { id: true, name: true, code: true } },
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
      orderBy: { available: 'asc' },
    });
  }

  /**
   * Get specific dealer inventory item
   */
  async getDealerInventoryItem(dealerId: string, vehicleId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: { dealerId_vehicleId: { dealerId, vehicleId } },
      include: {
        dealer: { select: { id: true, name: true, code: true, city: true } },
        vehicle: {
          include: {
            manufacturer: true,
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
    });

    if (!inventory) throw new Error('Inventory item not found');
    return inventory;
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold: number = 5) {
    const evmLowStock = await prisma.eVMInventory.findMany({
      where: { available: { lte: threshold } },
      include: {
        vehicle: { include: { manufacturer: { select: { id: true, name: true, code: true } } } },
      },
      orderBy: { available: 'asc' },
    });

    const dealerLowStock = await prisma.inventory.findMany({
      where: { available: { lte: threshold } },
      include: {
        dealer: { select: { id: true, name: true, code: true, city: true } },
        vehicle: { include: { manufacturer: { select: { id: true, name: true, code: true } } } },
      },
      orderBy: [{ dealerId: 'asc' }, { available: 'asc' }],
    });

    return {
      evm: evmLowStock,
      dealers: dealerLowStock,
      summary: {
        evmCount: evmLowStock.length,
        dealerCount: dealerLowStock.length,
        totalAffected: evmLowStock.length + dealerLowStock.length,
      },
    };
  }

  /**
   * Get inventory summary/statistics
   */
  async getInventorySummary() {
    const evmTotal = await prisma.eVMInventory.aggregate({
      _sum: { quantity: true, reserved: true, available: true },
      _count: true,
    });

    const dealerTotal = await prisma.inventory.aggregate({
      _sum: { quantity: true, reserved: true, sold: true, available: true },
      _count: true,
    });

    return {
      evm: {
        totalQuantity: evmTotal._sum.quantity || 0,
        totalReserved: evmTotal._sum.reserved || 0,
        totalAvailable: evmTotal._sum.available || 0,
        vehicleTypes: evmTotal._count,
      },
      dealers: {
        totalQuantity: dealerTotal._sum.quantity || 0,
        totalReserved: dealerTotal._sum.reserved || 0,
        totalSold: dealerTotal._sum.sold || 0,
        totalAvailable: dealerTotal._sum.available || 0,
        vehicleTypes: dealerTotal._count,
      },
    };
  }
}
