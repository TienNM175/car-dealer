import prisma from '../../config/database';
import { Prisma, DealerOrderStatus } from '@prisma/client';

interface DealerOrderFilters {
  search?: string;
  dealerId?: string;
  vehicleId?: string;
  status?: DealerOrderStatus;
  fromDate?: Date;
  toDate?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateDealerOrderInput {
  dealerId: string;
  staffId: string;
  vehicleId: string;
  quantity: number;
  notes?: string;
}

interface UpdateDealerOrderInput {
  quantity?: number;
  notes?: string;
}

export class DealerOrderService {
  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastOrder = await prisma.dealerOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: `DO-${year}${month}`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `DO-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Get all dealer orders with filters
   */
  async getAllDealerOrders(
    filters: DealerOrderFilters,
    pagination: PaginationParams,
    userRole?: string,
    userDealerId?: string
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    const where: Prisma.DealerOrderWhereInput = {
      ...(filters.search && {
        OR: [
          { orderNumber: { contains: filters.search, mode: 'insensitive' } },
          { dealer: { name: { contains: filters.search, mode: 'insensitive' } } },
          { dealer: { code: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
      ...(filters.dealerId && { dealerId: filters.dealerId }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.fromDate && { orderedAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { orderedAt: { lte: filters.toDate } }),
      // Dealer staff can only see their dealer's orders
      ...(userRole === 'DEALER_MANAGER' || userRole === 'DEALER_STAFF'
        ? { dealerId: userDealerId }
        : {}),
    };

    const total = await prisma.dealerOrder.count({ where });

    const orders = await prisma.dealerOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            region: {
              select: {
                name: true,
              },
            },
          },
        },
        vehicle: {
          include: {
            manufacturer: {
              select: {
                name: true,
              },
            },
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dealer order by ID
   */
  async getDealerOrderById(id: string) {
    const order = await prisma.dealerOrder.findUnique({
      where: { id },
      include: {
        dealer: {
          include: {
            region: true,
          },
        },
        vehicle: {
          include: {
            manufacturer: true,
            images: true,
            evmInventories: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Dealer order not found');
    }

    return order;
  }

  /**
   * Create dealer order
   */
  async createDealerOrder(data: CreateDealerOrderInput) {
    // Verify dealer exists and is active
    const dealer = await prisma.dealer.findUnique({
      where: { id: data.dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    if (!dealer.isActive) {
      throw new Error('Cannot create order for inactive dealer');
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: {
        evmInventories: true,
      },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (vehicle.status !== 'ACTIVE') {
      throw new Error('Vehicle is not available for order');
    }

    // Check EVM inventory
    const evmInventory = vehicle.evmInventories[0];
    if (!evmInventory) {
      throw new Error('No EVM inventory found for this vehicle');
    }

    if (evmInventory.available < data.quantity) {
      throw new Error(
        `Insufficient EVM inventory. Available: ${evmInventory.available}, Requested: ${data.quantity}`
      );
    }

    // Validate quantity
    if (data.quantity < 1) {
      throw new Error('Order quantity must be at least 1');
    }

    // Get wholesale price
    const unitPrice = vehicle.wholesalePrice;
    const totalAmount = Number(unitPrice) * data.quantity;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.dealerOrder.create({
        data: {
          orderNumber,
          dealerId: data.dealerId,
          staffId: data.staffId,
          vehicleId: data.vehicleId,
          quantity: data.quantity,
          unitPrice,
          totalAmount,
          status: 'PENDING',
          orderedAt: new Date(),
          notes: data.notes,
        },
        include: {
          dealer: true,
          vehicle: {
            include: {
              manufacturer: true,
            },
          },
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Reserve EVM inventory
      await tx.eVMInventory.update({
        where: { vehicleId: data.vehicleId },
        data: {
          reserved: { increment: data.quantity },
          available: { decrement: data.quantity },
        },
      });

      return newOrder;
    });

    return order;
  }

  /**
   * Update dealer order
   */
  async updateDealerOrder(id: string, data: UpdateDealerOrderInput) {
    const existingOrder = await prisma.dealerOrder.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            evmInventories: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new Error('Dealer order not found');
    }

    // Can only update PENDING orders
    if (existingOrder.status !== 'PENDING') {
      throw new Error('Can only update pending orders');
    }

    // If quantity changed, update inventory reservation
    if (data.quantity && data.quantity !== existingOrder.quantity) {
      const quantityDiff = data.quantity - existingOrder.quantity;
      const evmInventory = existingOrder.vehicle.evmInventories[0];

      if (!evmInventory) {
        throw new Error('No EVM inventory found');
      }

      // Check if enough inventory for increase
      if (quantityDiff > 0 && evmInventory.available < quantityDiff) {
        throw new Error(
          `Insufficient inventory to increase quantity. Available: ${evmInventory.available}, Required: ${quantityDiff}`
        );
      }

      const newTotalAmount = Number(existingOrder.unitPrice) * data.quantity;

      const order = await prisma.$transaction(async (tx) => {
        // Update order
        const updatedOrder = await tx.dealerOrder.update({
          where: { id },
          data: {
            quantity: data.quantity,
            totalAmount: newTotalAmount,
            ...(data.notes !== undefined && { notes: data.notes }),
          },
          include: {
            dealer: true,
            vehicle: {
              include: {
                manufacturer: true,
              },
            },
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Update EVM inventory reservation
        await tx.eVMInventory.update({
          where: { vehicleId: existingOrder.vehicleId },
          data: {
            reserved: { increment: quantityDiff },
            available: { decrement: quantityDiff },
          },
        });

        return updatedOrder;
      });

      return order;
    }

    // Update without quantity change
    const order = await prisma.dealerOrder.update({
      where: { id },
      data: {
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        dealer: true,
        vehicle: {
          include: {
            manufacturer: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return order;
  }

  /**
   * Update dealer order status
   */
  async updateDealerOrderStatus(id: string, status: DealerOrderStatus, _userId: string) {
    const order = await prisma.dealerOrder.findUnique({
      where: { id },
      include: {
        vehicle: true,
        dealer: true,
      },
    });

    if (!order) {
      throw new Error('Dealer order not found');
    }

    // Validate status transitions
    const validTransitions: Record<DealerOrderStatus, DealerOrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.dealerOrder.update({
        where: { id },
        data: {
          status,
          ...(status === 'CONFIRMED' && { confirmedAt: new Date() }),
          ...(status === 'SHIPPED' && { shippedAt: new Date() }),
          ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
        },
        include: {
          dealer: true,
          vehicle: {
            include: {
              manufacturer: true,
            },
          },
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // If delivered, update inventories
      if (status === 'DELIVERED') {
        // Reduce EVM inventory reserved
        await tx.eVMInventory.update({
          where: { vehicleId: order.vehicleId },
          data: {
            reserved: { decrement: order.quantity },
            quantity: { decrement: order.quantity },
          },
        });

        // Add to dealer inventory or update existing
        const dealerInventory = await tx.inventory.findUnique({
          where: {
            dealerId_vehicleId: {
              dealerId: order.dealerId,
              vehicleId: order.vehicleId,
            },
          },
        });

        if (dealerInventory) {
          await tx.inventory.update({
            where: {
              dealerId_vehicleId: {
                dealerId: order.dealerId,
                vehicleId: order.vehicleId,
              },
            },
            data: {
              quantity: { increment: order.quantity },
              available: { increment: order.quantity },
            },
          });
        } else {
          await tx.inventory.create({
            data: {
              dealerId: order.dealerId,
              vehicleId: order.vehicleId,
              quantity: order.quantity,
              reserved: 0,
              sold: 0,
              available: order.quantity,
              location: 'Warehouse',
            },
          });
        }
      }

      // If cancelled, release EVM inventory
      if (status === 'CANCELLED' && order.status !== 'DELIVERED') {
        await tx.eVMInventory.update({
          where: { vehicleId: order.vehicleId },
          data: {
            reserved: { decrement: order.quantity },
            available: { increment: order.quantity },
          },
        });
      }

      return updatedOrder;
    });

    return result;
  }

  /**
   * Cancel dealer order
   */
  async cancelDealerOrder(id: string, reason?: string) {
    const order = await prisma.dealerOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('Dealer order not found');
    }

    // Cannot cancel delivered orders
    if (order.status === 'DELIVERED') {
      throw new Error('Cannot cancel delivered orders');
    }

    // Already cancelled
    if (order.status === 'CANCELLED') {
      throw new Error('Order is already cancelled');
    }

    const cancelledOrder = await this.updateDealerOrderStatus(id, 'CANCELLED', '');

    // Update notes with cancellation reason
    if (reason) {
      await prisma.dealerOrder.update({
        where: { id },
        data: {
          notes: `${order.notes || ''}\nCancelled: ${reason}`,
        },
      });
    }

    return cancelledOrder;
  }

  /**
   * Get dealer order statistics
   */
  async getDealerOrderStatistics(filters?: {
    dealerId?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: Prisma.DealerOrderWhereInput = {
      ...(filters?.dealerId && { dealerId: filters.dealerId }),
      ...(filters?.fromDate && { orderedAt: { gte: filters.fromDate } }),
      ...(filters?.toDate && { orderedAt: { lte: filters.toDate } }),
    };

    // Total statistics
    const totalStats = await prisma.dealerOrder.aggregate({
      where,
      _count: true,
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _avg: {
        quantity: true,
        totalAmount: true,
      },
    });

    // By status
    const byStatus = await prisma.dealerOrder.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: {
        quantity: true,
        totalAmount: true,
      },
    });

    // By dealer
    const byDealer = await prisma.dealerOrder.groupBy({
      by: ['dealerId'],
      where,
      _count: true,
      _sum: {
        quantity: true,
        totalAmount: true,
      },
    });

    const dealerStats = await Promise.all(
      byDealer.map(async (item) => {
        const dealer = await prisma.dealer.findUnique({
          where: { id: item.dealerId },
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        });
        return {
          dealer,
          orderCount: item._count,
          totalQuantity: item._sum.quantity || 0,
          totalAmount: item._sum.totalAmount || 0,
        };
      })
    );

    return {
      total: {
        orderCount: totalStats._count,
        totalQuantity: totalStats._sum.quantity || 0,
        totalAmount: totalStats._sum.totalAmount || 0,
        averageQuantity: totalStats._avg.quantity || 0,
        averageAmount: totalStats._avg.totalAmount || 0,
      },
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
        quantity: item._sum.quantity || 0,
        amount: item._sum.totalAmount || 0,
      })),
      byDealer: dealerStats,
    };
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(dealerId?: string) {
    const where: Prisma.DealerOrderWhereInput = {
      ...(dealerId && { dealerId }),
    };

    const byStatus = await prisma.dealerOrder.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return byStatus.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }
}