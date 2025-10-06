import prisma from '../../config/database';
import { Prisma, TestDriveStatus } from '@prisma/client';

interface TestDriveFilters {
  search?: string;
  customerId?: string;
  vehicleId?: string;
  staffId?: string;
  dealerId?: string;
  status?: TestDriveStatus;
  fromDate?: Date;
  toDate?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateTestDriveInput {
  customerId: string;
  vehicleId: string;
  staffId: string;
  scheduledDate: Date;
  notes?: string;
}

interface UpdateTestDriveInput {
  scheduledDate?: Date;
  notes?: string;
  feedback?: string;
}

export class TestDriveService {
  /**
   * Get all test drives with filters
   */
  async getAllTestDrives(
    filters: TestDriveFilters,
    pagination: PaginationParams,
    userRole?: string,
    userDealerId?: string
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'scheduledDate';
    const sortOrder = pagination.sortOrder || 'desc';

    const where: Prisma.TestDriveWhereInput = {
      ...(filters.search && {
        OR: [
          { customer: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { email: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { phone: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.staffId && { staffId: filters.staffId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.fromDate && { scheduledDate: { gte: filters.fromDate } }),
      ...(filters.toDate && { scheduledDate: { lte: filters.toDate } }),
      // Dealer staff can only see their dealer's test drives
      ...(userRole === 'DEALER_MANAGER' || userRole === 'DEALER_STAFF'
        ? { staff: { dealerId: userDealerId } }
        : filters.dealerId
        ? { staff: { dealerId: filters.dealerId } }
        : {}),
    };

    const total = await prisma.testDrive.count({ where });

    const testDrives = await prisma.testDrive.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
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
            phone: true,
            dealer: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
              },
            },
          },
        },
      },
    });

    return {
      data: testDrives,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get test drive by ID
   */
  async getTestDriveById(id: string) {
    const testDrive = await prisma.testDrive.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            _count: {
              select: {
                testDrives: true,
                quotations: true,
                contracts: true,
              },
            },
          },
        },
        vehicle: {
          include: {
            manufacturer: true,
            images: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dealer: {
              select: {
                id: true,
                name: true,
                code: true,
                address: true,
                city: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!testDrive) {
      throw new Error('Test drive not found');
    }

    return testDrive;
  }

  /**
   * Create test drive
   */
  async createTestDrive(data: CreateTestDriveInput, userId: string) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (vehicle.status !== 'ACTIVE') {
      throw new Error('Vehicle is not available for test drives');
    }

    // Verify staff exists and get dealer
    const staff = await prisma.user.findUnique({
      where: { id: data.staffId },
      include: {
        dealer: true,
      },
    });

    if (!staff) {
      throw new Error('Staff not found');
    }

    if (!staff.dealer) {
      throw new Error('Staff must belong to a dealer');
    }

    // Validate scheduled date is in the future
    if (data.scheduledDate < new Date()) {
      throw new Error('Scheduled date must be in the future');
    }

    // Check for scheduling conflicts (same staff, same time slot)
    const conflictingTestDrive = await prisma.testDrive.findFirst({
      where: {
        staffId: data.staffId,
        scheduledDate: data.scheduledDate,
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
    });

    if (conflictingTestDrive) {
      throw new Error('Staff already has a test drive scheduled at this time');
    }

    // Create test drive with transaction
    const testDrive = await prisma.$transaction(async (tx) => {
      const newTestDrive = await tx.testDrive.create({
        data: {
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          staffId: data.staffId,
          scheduledDate: data.scheduledDate,
          status: 'SCHEDULED',
          notes: data.notes,
        },
        include: {
          customer: true,
          vehicle: {
            include: {
              manufacturer: true,
            },
          },
          staff: {
            include: {
              dealer: true,
            },
          },
        },
      });

      // Update customer status to TEST_DRIVE if not already purchased
      if (customer.status !== 'PURCHASED') {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { status: 'TEST_DRIVE' },
        });

        // Add lifecycle event
        await tx.customerLifecycle.create({
          data: {
            customerId: data.customerId,
            status: 'TEST_DRIVE',
            notes: `Test drive scheduled for ${vehicle.model} ${vehicle.variant}`,
            changedBy: userId,
          },
        });
      }

      return newTestDrive;
    });

    return testDrive;
  }

  /**
   * Update test drive
   */
  async updateTestDrive(id: string, data: UpdateTestDriveInput) {
    const existingTestDrive = await prisma.testDrive.findUnique({
      where: { id },
    });

    if (!existingTestDrive) {
      throw new Error('Test drive not found');
    }

    // Can only update SCHEDULED test drives
    if (existingTestDrive.status !== 'SCHEDULED') {
      throw new Error('Can only update scheduled test drives');
    }

    // Validate new scheduled date if provided
    if (data.scheduledDate) {
      if (data.scheduledDate < new Date()) {
        throw new Error('Scheduled date must be in the future');
      }

      // Check for conflicts if date is being changed
      if (data.scheduledDate.getTime() !== existingTestDrive.scheduledDate.getTime()) {
        const conflictingTestDrive = await prisma.testDrive.findFirst({
          where: {
            staffId: existingTestDrive.staffId,
            scheduledDate: data.scheduledDate,
            status: {
              in: ['SCHEDULED', 'CONFIRMED'],
            },
            id: { not: id },
          },
        });

        if (conflictingTestDrive) {
          throw new Error('Staff already has a test drive scheduled at this time');
        }
      }
    }

    const testDrive = await prisma.testDrive.update({
      where: { id },
      data: {
        ...(data.scheduledDate && { scheduledDate: data.scheduledDate }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.feedback !== undefined && { feedback: data.feedback }),
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            manufacturer: true,
          },
        },
        staff: {
          include: {
            dealer: true,
          },
        },
      },
    });

    return testDrive;
  }

  /**
   * Update test drive status
   */
  async updateTestDriveStatus(id: string, status: TestDriveStatus, feedback?: string) {
    const testDrive = await prisma.testDrive.findUnique({
      where: { id },
    });

    if (!testDrive) {
      throw new Error('Test drive not found');
    }

    // Validate status transitions
    const validTransitions: Record<TestDriveStatus, TestDriveStatus[]> = {
      SCHEDULED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };

    if (!validTransitions[testDrive.status].includes(status)) {
      throw new Error(`Cannot transition from ${testDrive.status} to ${status}`);
    }

    // Feedback required for COMPLETED status
    if (status === 'COMPLETED' && !feedback && !testDrive.feedback) {
      throw new Error('Feedback is required when marking test drive as completed');
    }

    const updatedTestDrive = await prisma.testDrive.update({
      where: { id },
      data: {
        status,
        ...(feedback && { feedback }),
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            manufacturer: true,
          },
        },
        staff: {
          include: {
            dealer: true,
          },
        },
      },
    });

    return updatedTestDrive;
  }

  /**
   * Cancel test drive
   */
  async cancelTestDrive(id: string, reason?: string) {
    const testDrive = await prisma.testDrive.findUnique({
      where: { id },
    });

    if (!testDrive) {
      throw new Error('Test drive not found');
    }

    if (testDrive.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed test drive');
    }

    if (testDrive.status === 'CANCELLED') {
      throw new Error('Test drive is already cancelled');
    }

    const cancelledTestDrive = await prisma.testDrive.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `${testDrive.notes || ''}\nCancelled: ${reason}` : testDrive.notes,
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            manufacturer: true,
          },
        },
        staff: {
          include: {
            dealer: true,
          },
        },
      },
    });

    return cancelledTestDrive;
  }

  /**
   * Get test drive statistics
   */
  async getTestDriveStatistics(filters?: {
    dealerId?: string;
    staffId?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: Prisma.TestDriveWhereInput = {
      ...(filters?.dealerId && { staff: { dealerId: filters.dealerId } }),
      ...(filters?.staffId && { staffId: filters.staffId }),
      ...(filters?.fromDate && { scheduledDate: { gte: filters.fromDate } }),
      ...(filters?.toDate && { scheduledDate: { lte: filters.toDate } }),
    };

    // Total count
    const totalCount = await prisma.testDrive.count({ where });

    // By status
    const byStatus = await prisma.testDrive.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Completion rate
    const completedCount = await prisma.testDrive.count({
      where: {
        ...where,
        status: 'COMPLETED',
      },
    });

    const noShowCount = await prisma.testDrive.count({
      where: {
        ...where,
        status: 'NO_SHOW',
      },
    });

    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const noShowRate = totalCount > 0 ? (noShowCount / totalCount) * 100 : 0;

    // By vehicle
    const byVehicle = await prisma.testDrive.groupBy({
      by: ['vehicleId'],
      where,
      _count: true,
    });

    const vehicleStats = await Promise.all(
      byVehicle.slice(0, 10).map(async (item) => {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: item.vehicleId },
          select: {
            id: true,
            model: true,
            variant: true,
            manufacturer: {
              select: {
                name: true,
              },
            },
          },
        });
        return {
          vehicle,
          count: item._count,
        };
      })
    );

    return {
      total: totalCount,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      rates: {
        completionRate: Math.round(completionRate * 100) / 100,
        noShowRate: Math.round(noShowRate * 100) / 100,
      },
      topVehicles: vehicleStats.sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Get test drives by status
   */
  async getTestDrivesByStatus(dealerId?: string) {
    const where: Prisma.TestDriveWhereInput = {
      ...(dealerId && { staff: { dealerId } }),
    };

    const byStatus = await prisma.testDrive.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return byStatus.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }

  /**
   * Get upcoming test drives
   */
  async getUpcomingTestDrives(dealerId?: string, staffId?: string) {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const where: Prisma.TestDriveWhereInput = {
      scheduledDate: {
        gte: now,
        lte: sevenDaysLater,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
      ...(dealerId && { staff: { dealerId } }),
      ...(staffId && { staffId }),
    };

    const testDrives = await prisma.testDrive.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            variant: true,
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
      orderBy: { scheduledDate: 'asc' },
    });

    return testDrives;
  }
}