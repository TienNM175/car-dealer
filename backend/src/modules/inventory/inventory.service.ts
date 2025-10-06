import prisma from '../../config/database';
import { Prisma } from '@prisma/client';

interface InventoryFilters {
  vehicleId?: string;
  dealerId?: string;
  lowStock?: boolean;
  minQuantity?: number;
}

interface TransferInventoryInput {
  vehicleId: string;
  fromDealerId: string;
  toDealerId: string;
  quantity: number;
  notes?: string;
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

    const inventory = await prisma.eVMInventory.findMany({
      where,
      include: {
        vehicle: {
          include: {
            manufacturer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { available: 'asc' },
    });

    return inventory;
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
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!inventory) {
      throw new Error('EVM inventory not found for this vehicle');
    }

    return inventory;
  }

  /**
   * Update EVM Inventory
   */
  async updateEVMInventory(
    vehicleId: string,
    data: { quantity?: number; reserved?: number; location?: string }
  ) {
    // Check if inventory exists
    const existing = await prisma.eVMInventory.findUnique({
      where: { vehicleId },
    });

    if (!existing) {
      throw new Error('EVM inventory not found');
    }

    // Calculate new values
    const quantity = data.quantity ?? existing.quantity;
    const reserved = data.reserved ?? existing.reserved;
    const available = quantity - reserved;

    if (available < 0) {
      throw new Error('Available quantity cannot be negative');
    }

    const inventory = await prisma.eVMInventory.update({
      where: { vehicleId },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.reserved !== undefined && { reserved: data.reserved }),
        available,
        ...(data.location && { location: data.location }),
      },
      include: {
        vehicle: {
          include: {
            manufacturer: true,
          },
        },
      },
    });

    return inventory;
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

    const inventories = await prisma.inventory.findMany({
      where,
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            regionId: true,
          },
        },
        vehicle: {
          include: {
            manufacturer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ dealerId: 'asc' }, { available: 'asc' }],
    });

    return inventories;
  }

  /**
   * Get Dealer Inventory by Dealer ID
   */
  async getDealerInventory(dealerId: string, filters: InventoryFilters = {}) {
    // Verify dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const where: Prisma.InventoryWhereInput = {
      dealerId,
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.lowStock && { available: { lte: 5 } }),
    };

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        vehicle: {
          include: {
            manufacturer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { available: 'asc' },
    });

    return inventory;
  }

  /**
   * Get specific dealer inventory item
   */
  async getDealerInventoryItem(dealerId: string, vehicleId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: {
        dealerId_vehicleId: {
          dealerId,
          vehicleId,
        },
      },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        vehicle: {
          include: {
            manufacturer: true,
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    return inventory;
  }

  /**
   * Update Dealer Inventory
   */
  async updateDealerInventory(
    dealerId: string,
    vehicleId: string,
    data: {
      quantity?: number;
      reserved?: number;
      sold?: number;
      location?: string;
    }
  ) {
    // Check if inventory exists
    const existing = await prisma.inventory.findUnique({
      where: {
        dealerId_vehicleId: {
          dealerId,
          vehicleId,
        },
      },
    });

    if (!existing) {
      throw new Error('Dealer inventory not found');
    }

    // Calculate new values
    const quantity = data.quantity ?? existing.quantity;
    const reserved = data.reserved ?? existing.reserved;
    const sold = data.sold ?? existing.sold;
    const available = quantity - reserved - sold;

    if (available < 0) {
      throw new Error('Available quantity cannot be negative');
    }

    if (reserved < 0 || sold < 0) {
      throw new Error('Reserved and sold quantities must be non-negative');
    }

    const inventory = await prisma.inventory.update({
      where: {
        dealerId_vehicleId: {
          dealerId,
          vehicleId,
        },
      },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.reserved !== undefined && { reserved: data.reserved }),
        ...(data.sold !== undefined && { sold: data.sold }),
        available,
        ...(data.location && { location: data.location }),
      },
      include: {
        dealer: true,
        vehicle: {
          include: {
            manufacturer: true,
          },
        },
      },
    });

    return inventory;
  }

  /**
   * Transfer inventory between dealers
   */
  async transferInventory(data: TransferInventoryInput) {
    const { vehicleId, fromDealerId, toDealerId, quantity, notes } = data;

    if (quantity <= 0) {
      throw new Error('Transfer quantity must be positive');
    }

    if (fromDealerId === toDealerId) {
      throw new Error('Cannot transfer to the same dealer');
    }

    return await prisma.$transaction(async (tx) => {
      // Get source inventory
      const fromInventory = await tx.inventory.findUnique({
        where: {
          dealerId_vehicleId: {
            dealerId: fromDealerId,
            vehicleId,
          },
        },
      });

      if (!fromInventory) {
        throw new Error('Source dealer does not have this vehicle in inventory');
      }

      if (fromInventory.available < quantity) {
        throw new Error(
          `Insufficient available quantity. Available: ${fromInventory.available}, Requested: ${quantity}`
        );
      }

      // Update source dealer inventory (decrease)
      const updatedFrom = await tx.inventory.update({
        where: {
          dealerId_vehicleId: {
            dealerId: fromDealerId,
            vehicleId,
          },
        },
        data: {
          quantity: { decrement: quantity },
          available: { decrement: quantity },
        },
      });

      // Check if destination dealer has this vehicle
      const toInventory = await tx.inventory.findUnique({
        where: {
          dealerId_vehicleId: {
            dealerId: toDealerId,
            vehicleId,
          },
        },
      });

      let updatedTo;

      if (toInventory) {
        // Update existing inventory (increase)
        updatedTo = await tx.inventory.update({
          where: {
            dealerId_vehicleId: {
              dealerId: toDealerId,
              vehicleId,
            },
          },
          data: {
            quantity: { increment: quantity },
            available: { increment: quantity },
          },
        });
      } else {
        // Create new inventory record
        updatedTo = await tx.inventory.create({
          data: {
            dealerId: toDealerId,
            vehicleId,
            quantity,
            reserved: 0,
            sold: 0,
            available: quantity,
            location: 'Storage',
          },
        });
      }

      return {
        from: updatedFrom,
        to: updatedTo,
        transferDetails: {
          vehicleId,
          fromDealerId,
          toDealerId,
          quantity,
          notes,
          transferredAt: new Date(),
        },
      };
    });
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold: number = 5) {
    // EVM low stock
    const evmLowStock = await prisma.eVMInventory.findMany({
      where: {
        available: { lte: threshold },
      },
      include: {
        vehicle: {
          include: {
            manufacturer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { available: 'asc' },
    });

    // Dealer low stock
    const dealerLowStock = await prisma.inventory.findMany({
      where: {
        available: { lte: threshold },
      },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        vehicle: {
          include: {
            manufacturer: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
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
    // EVM summary
    const evmTotal = await prisma.eVMInventory.aggregate({
      _sum: {
        quantity: true,
        reserved: true,
        available: true,
      },
      _count: true,
    });

    // Dealer summary
    const dealerTotal = await prisma.inventory.aggregate({
      _sum: {
        quantity: true,
        reserved: true,
        sold: true,
        available: true,
      },
      _count: true,
    });

    // By dealer
    const byDealer = await prisma.inventory.groupBy({
      by: ['dealerId'],
      _sum: {
        quantity: true,
        reserved: true,
        sold: true,
        available: true,
      },
      _count: true,
    });

    // Get dealer names
    const dealerSummary = await Promise.all(
      byDealer.map(async (item) => {
        const dealer = await prisma.dealer.findUnique({
          where: { id: item.dealerId },
          select: { id: true, name: true, code: true, city: true },
        });
        return {
          dealer,
          totalQuantity: item._sum.quantity || 0,
          totalReserved: item._sum.reserved || 0,
          totalSold: item._sum.sold || 0,
          totalAvailable: item._sum.available || 0,
          vehicleTypes: item._count,
        };
      })
    );

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
      byDealer: dealerSummary,
    };
  }

  /**
   * Reserve inventory (when customer makes order)
   */
  async reserveInventory(dealerId: string, vehicleId: string, quantity: number = 1) {
    if (quantity <= 0) {
      throw new Error('Reserve quantity must be positive');
    }

    return await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          dealerId_vehicleId: {
            dealerId,
            vehicleId,
          },
        },
      });

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      if (inventory.available < quantity) {
        throw new Error(
          `Insufficient available quantity. Available: ${inventory.available}, Requested: ${quantity}`
        );
      }

      const updated = await tx.inventory.update({
        where: {
          dealerId_vehicleId: {
            dealerId,
            vehicleId,
          },
        },
        data: {
          reserved: { increment: quantity },
          available: { decrement: quantity },
        },
        include: {
          dealer: true,
          vehicle: true,
        },
      });

      return updated;
    });
  }

  /**
   * Complete sale (move from reserved to sold)
   */
  async completeSale(dealerId: string, vehicleId: string, quantity: number = 1) {
    if (quantity <= 0) {
      throw new Error('Sale quantity must be positive');
    }

    return await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          dealerId_vehicleId: {
            dealerId,
            vehicleId,
          },
        },
      });

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      if (inventory.reserved < quantity) {
        throw new Error(
          `Insufficient reserved quantity. Reserved: ${inventory.reserved}, Requested: ${quantity}`
        );
      }

      const updated = await tx.inventory.update({
        where: {
          dealerId_vehicleId: {
            dealerId,
            vehicleId,
          },
        },
        data: {
          reserved: { decrement: quantity },
          sold: { increment: quantity },
          quantity: { decrement: quantity },
        },
        include: {
          dealer: true,
          vehicle: true,
        },
      });

      return updated;
    });
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(dealerId: string, vehicleId: string, quantity: number = 1) {
    if (quantity <= 0) {
      throw new Error('Cancel quantity must be positive');
    }

    return await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          dealerId_vehicleId: {
            dealerId,
            vehicleId,
          },
        },
      });

      if (!inventory) {
        throw new Error('Inventory not found');
      }

      if (inventory.reserved < quantity) {
        throw new Error(
          `Cannot cancel more than reserved. Reserved: ${inventory.reserved}, Requested: ${quantity}`
        );
      }

      const updated = await tx.inventory.update({
        where: {
          dealerId_vehicleId: {
            dealerId,
            vehicleId,
          },
        },
        data: {
          reserved: { decrement: quantity },
          available: { increment: quantity },
        },
        include: {
          dealer: true,
          vehicle: true,
        },
      });

      return updated;
    });
  }
}