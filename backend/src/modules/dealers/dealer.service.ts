import prisma from '../../config/database';
import { Prisma, UserRole } from '@prisma/client';
import { PasswordUtil } from '../../utils/password.util';

interface DealerFilters {
  search?: string;
  regionId?: string;
  city?: string;
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateDealerInput {
  name: string;
  code: string;
  regionId: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
}

interface UpdateDealerInput {
  name?: string;
  regionId?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

interface CreateStaffInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  dealerId: string;
}

export class DealerService {
  /**
   * Get all dealers with filters
   */
  async getAllDealers(filters: DealerFilters, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    const where: Prisma.DealerWhereInput = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.regionId && { regionId: filters.regionId }),
      ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    const total = await prisma.dealer.count({ where });

    const dealers = await prisma.dealer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        region: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            users: true,
            dealerOrders: true,
            inventories: true,
            dealerContracts: true,
          },
        },
      },
    });

    return {
      data: dealers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get dealer by ID
   */
  async getDealerById(id: string) {
    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: {
        region: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        dealerContracts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        targets: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        },
        dealerDebts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        dealerDiscounts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            users: true,
            dealerOrders: true,
            inventories: true,
            dealerContracts: true,
            targets: true,
            dealerDebts: true,
          },
        },
      },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    return dealer;
  }

  /**
   * Create new dealer
   */
  async createDealer(data: CreateDealerInput) {
    // Check if code already exists
    const existingDealer = await prisma.dealer.findUnique({
      where: { code: data.code },
    });

    if (existingDealer) {
      throw new Error('Dealer code already exists');
    }

    // Verify region exists
    const region = await prisma.region.findUnique({
      where: { id: data.regionId },
    });

    if (!region) {
      throw new Error('Region not found');
    }

    const dealer = await prisma.dealer.create({
      data: {
        name: data.name,
        code: data.code,
        regionId: data.regionId,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
      },
      include: {
        region: true,
      },
    });

    return dealer;
  }

  /**
   * Update dealer
   */
  async updateDealer(id: string, data: UpdateDealerInput) {
    const existingDealer = await prisma.dealer.findUnique({
      where: { id },
    });

    if (!existingDealer) {
      throw new Error('Dealer not found');
    }

    // Verify region if provided
    if (data.regionId) {
      const region = await prisma.region.findUnique({
        where: { id: data.regionId },
      });

      if (!region) {
        throw new Error('Region not found');
      }
    }

    const dealer = await prisma.dealer.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.regionId && { regionId: data.regionId }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        region: true,
      },
    });

    return dealer;
  }

  /**
   * Delete dealer
   */
  async deleteDealer(id: string) {
    const dealer = await prisma.dealer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            dealerOrders: true,
            inventories: true,
          },
        },
      },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    // Check if dealer has staff
    if (dealer._count.users > 0) {
      throw new Error('Cannot delete dealer with existing staff. Deactivate instead.');
    }

    // Check if dealer has orders
    if (dealer._count.dealerOrders > 0) {
      throw new Error('Cannot delete dealer with existing orders. Deactivate instead.');
    }

    // Check if dealer has inventory
    if (dealer._count.inventories > 0) {
      throw new Error('Cannot delete dealer with existing inventory. Deactivate instead.');
    }

    await prisma.dealer.delete({
      where: { id },
    });

    return { message: 'Dealer deleted successfully' };
  }

  /**
   * Get dealer staff
   */
  async getDealerStaff(dealerId: string) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const staff = await prisma.user.findMany({
      where: { dealerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contracts: true,
            quotations: true,
            testDrives: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return staff;
  }

  /**
   * Add staff to dealer
   */
  async addStaff(data: CreateStaffInput) {
    // Check if dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: data.dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    if (!dealer.isActive) {
      throw new Error('Cannot add staff to inactive dealer');
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Validate role - only dealer roles allowed
    if (!['DEALER_MANAGER', 'DEALER_STAFF'].includes(data.role)) {
      throw new Error('Invalid role for dealer staff');
    }

    // Validate password
    const passwordValidation = PasswordUtil.validate(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        dealerId: data.dealerId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        dealerId: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Update staff
   */
  async updateStaff(staffId: string, dealerId: string, data: { firstName?: string; lastName?: string; phone?: string; role?: UserRole; isActive?: boolean }) {
    // Verify staff belongs to dealer
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        dealerId,
      },
    });

    if (!staff) {
      throw new Error('Staff not found in this dealer');
    }

    // Validate role if provided
    if (data.role && !['DEALER_MANAGER', 'DEALER_STAFF'].includes(data.role)) {
      throw new Error('Invalid role for dealer staff');
    }

    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        dealerId: true,
        updatedAt: true,
      },
    });

    return updatedStaff;
  }

  /**
   * Remove staff from dealer
   */
  async removeStaff(staffId: string, dealerId: string) {
    // Verify staff belongs to dealer
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        dealerId,
      },
      include: {
        _count: {
          select: {
            contracts: true,
            quotations: true,
            testDrives: true,
          },
        },
      },
    });

    if (!staff) {
      throw new Error('Staff not found in this dealer');
    }

    // Check if staff has active records
    const hasActiveRecords = staff._count.contracts > 0 || 
                            staff._count.quotations > 0 || 
                            staff._count.testDrives > 0;

    if (hasActiveRecords) {
      throw new Error('Cannot remove staff with existing records. Deactivate instead.');
    }

    await prisma.user.delete({
      where: { id: staffId },
    });

    return { message: 'Staff removed successfully' };
  }

  /**
   * Get dealer inventory
   */
  async getDealerInventory(dealerId: string) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const inventory = await prisma.inventory.findMany({
      where: { dealerId },
      include: {
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
      },
      orderBy: { available: 'asc' },
    });

    return inventory;
  }

  /**
   * Get dealer orders
   */
  async getDealerOrders(dealerId: string, status?: string) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const orders = await prisma.dealerOrder.findMany({
      where: {
        dealerId,
        ...(status && { status: status as any }),
      },
      include: {
        vehicle: {
          include: {
            manufacturer: {
              select: {
                name: true,
              },
            },
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
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  /**
   * Get dealer sales statistics
   */
  async getDealerSalesStats(dealerId: string, fromDate?: Date, toDate?: Date) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const where: Prisma.ContractWhereInput = {
      staff: { dealerId },
      ...(fromDate && { createdAt: { gte: fromDate } }),
      ...(toDate && { createdAt: { lte: toDate } }),
    };

    // Total contracts and revenue
    const contractStats = await prisma.contract.aggregate({
      where,
      _count: true,
      _sum: {
        finalPrice: true,
        discount: true,
      },
      _avg: {
        finalPrice: true,
      },
    });

    // By status
    const byStatus = await prisma.contract.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    // By staff
    const byStaff = await prisma.contract.groupBy({
      by: ['staffId'],
      where,
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    // Get staff details
    const staffStats = await Promise.all(
      byStaff.map(async (item) => {
        const staff = await prisma.user.findUnique({
          where: { id: item.staffId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        });
        return {
          staff,
          contractCount: item._count,
          totalRevenue: item._sum.finalPrice || 0,
        };
      })
    );

    return {
      dealer: {
        id: dealer.id,
        name: dealer.name,
        code: dealer.code,
      },
      total: {
        contracts: contractStats._count,
        revenue: contractStats._sum.finalPrice || 0,
        discount: contractStats._sum.discount || 0,
        averageOrderValue: contractStats._avg.finalPrice || 0,
      },
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count,
        revenue: item._sum.finalPrice || 0,
      })),
      byStaff: staffStats,
    };
  }

  /**
   * Get dealer targets
   */
  async getDealerTargets(dealerId: string, year?: number) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    const currentYear = year || new Date().getFullYear();

    const targets = await prisma.target.findMany({
      where: {
        dealerId,
        year: currentYear,
      },
      orderBy: { month: 'asc' },
    });

    return targets;
  }

  /**
   * Set dealer target
   */
  async setDealerTarget(dealerId: string, year: number, month: number, targetAmount: number) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new Error('Dealer not found');
    }

    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    if (targetAmount < 0) {
      throw new Error('Target amount must be positive');
    }

    const target = await prisma.target.upsert({
      where: {
        dealerId_year_month: {
          dealerId,
          year,
          month,
        },
      },
      update: {
        targetAmount,
      },
      create: {
        dealerId,
        year,
        month,
        targetAmount,
        achievedAmount: 0,
      },
    });

    return target;
  }

  /**
   * Get all regions
   */
  async getAllRegions() {
    const regions = await prisma.region.findMany({
      include: {
        _count: {
          select: {
            dealers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return regions;
  }
}