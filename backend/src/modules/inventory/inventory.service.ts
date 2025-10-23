import prisma from "../../config/database";
import { Prisma } from "@prisma/client";

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
      orderBy: { available: "asc" },
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

    if (!inventory) throw new Error("EVM inventory not found for this vehicle");
    return inventory;
  }

  /**
   * Update EVM Inventory (admin only)
   */
  async updateEVMInventory(
    vehicleId: string,
    data: { quantity?: number; reserved?: number; location?: string }
  ) {
    const existing = await prisma.eVMInventory.findUnique({
      where: { vehicleId },
    });
    if (!existing) throw new Error("EVM inventory not found");

    const quantity = data.quantity ?? existing.quantity;
    const reserved = data.reserved ?? existing.reserved;
    const available = quantity - reserved;

    if (available < 0) throw new Error("Available quantity cannot be negative");

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
            manufacturer: { select: { id: true, name: true, code: true } },
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
      orderBy: [{ dealerId: "asc" }, { available: "asc" }],
    });
  }

  /**
   * Get Dealer Inventory by Dealer ID
   */
  async getDealerInventory(dealerId: string, filters: InventoryFilters = {}) {
    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
    if (!dealer) throw new Error("Dealer not found");

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
      orderBy: { available: "asc" },
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

    if (!inventory) throw new Error("Inventory item not found");
    return inventory;
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold: number = 5) {
    const evmLowStock = await prisma.eVMInventory.findMany({
      where: { available: { lte: threshold } },
      include: {
        vehicle: {
          include: {
            manufacturer: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { available: "asc" },
    });

    const dealerLowStock = await prisma.inventory.findMany({
      where: { available: { lte: threshold } },
      include: {
        dealer: { select: { id: true, name: true, code: true, city: true } },
        vehicle: {
          include: {
            manufacturer: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [{ dealerId: "asc" }, { available: "asc" }],
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

    // Get dealers list for transfer dropdown
    const dealers = await prisma.dealer.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: { name: "asc" },
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
      byDealer: dealers.map((dealer) => ({ dealer })),
    };
  }

  /**
   * Update dealer inventory
   */
  async updateDealerInventory(dealerId: string, vehicleId: string, data: any) {
    // Validate inventory exists
    const existing = await prisma.inventory.findUnique({
      where: {
        dealerId_vehicleId: {
          dealerId,
          vehicleId,
        },
      },
    });

    if (!existing) {
      throw new Error("Dealer inventory not found");
    }

    // Validate quantities
    if (data.quantity !== undefined && data.quantity < 0) {
      throw new Error("Quantity cannot be negative");
    }
    if (data.reserved !== undefined && data.reserved < 0) {
      throw new Error("Reserved cannot be negative");
    }
    if (data.sold !== undefined && data.sold < 0) {
      throw new Error("Sold cannot be negative");
    }

    // Update inventory
    const updated = await prisma.inventory.update({
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
        ...(data.location !== undefined && { location: data.location }),
        // Recalculate available
        available:
          data.quantity !== undefined
            ? data.quantity -
              (data.reserved !== undefined
                ? data.reserved
                : existing.reserved) -
              (data.sold !== undefined ? data.sold : existing.sold)
            : undefined,
      },
      include: {
        vehicle: {
          include: {
            manufacturer: { select: { id: true, name: true, code: true } },
            images: { where: { isMain: true }, take: 1 },
          },
        },
        dealer: { select: { id: true, name: true, code: true } },
      },
    });

    return updated;
  }

  /**
   * Transfer inventory from EVM to dealer
   */
  async transferInventory(data: any) {
    const { vehicleId, toDealerId, quantity, notes } = data;

    // Validate EVM inventory exists and has enough quantity
    const evmInventory = await prisma.eVMInventory.findUnique({
      where: { vehicleId },
    });

    if (!evmInventory) {
      throw new Error("EVM inventory not found");
    }

    if (evmInventory.available < quantity) {
      throw new Error(
        `Insufficient EVM inventory. Available: ${evmInventory.available}, Requested: ${quantity}`
      );
    }

    // Use transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Decrease EVM inventory
      await tx.eVMInventory.update({
        where: { vehicleId },
        data: {
          quantity: { decrement: quantity },
          available: { decrement: quantity },
        },
      });

      // Check if dealer inventory exists
      const existingDealerInventory = await tx.inventory.findUnique({
        where: {
          dealerId_vehicleId: {
            dealerId: toDealerId,
            vehicleId: vehicleId,
          },
        },
      });

      if (existingDealerInventory) {
        // Update existing dealer inventory
        await tx.inventory.update({
          where: {
            dealerId_vehicleId: {
              dealerId: toDealerId,
              vehicleId: vehicleId,
            },
          },
          data: {
            quantity: { increment: quantity },
            available: { increment: quantity },
          },
        });
      } else {
        // Create new dealer inventory
        await tx.inventory.create({
          data: {
            dealerId: toDealerId,
            vehicleId: vehicleId,
            quantity: quantity,
            available: quantity,
            reserved: 0,
            sold: 0,
            location: notes || "Transferred from EVM",
          },
        });
      }

      return {
        message: `Successfully transferred ${quantity} units to dealer`,
        vehicleId,
        toDealerId,
        quantity,
      };
    });
  }
}
