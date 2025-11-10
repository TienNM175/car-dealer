// backend/src/modules/public/public.service.ts
import prisma from '../../config/database';
import { EmailUtil } from '../../utils/email.util';

export class PublicService {
  async getVehicles(filters: any, pagination: any) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
      ...(filters.search && {
        OR: [
          { model: { contains: filters.search, mode: 'insensitive' } },
          { variant: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.manufacturerId && { manufacturerId: filters.manufacturerId }),
      ...(filters.year && { year: filters.year }),
      ...(filters.bodyType && { bodyType: filters.bodyType }),
      ...(filters.minPrice && { retailPrice: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { retailPrice: { lte: filters.maxPrice } }),
    };

    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        include: {
          manufacturer: {
            select: { id: true, name: true, logo: true, country: true },
          },
          images: {
            where: { isMain: true },
            take: 1,
          },
          dealerInventories: {
            where: { available: { gt: 0 } },
            select: {
              available: true,
              dealer: {
                select: { id: true, name: true, city: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: vehicles,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        manufacturer: true,
        images: { orderBy: { order: 'asc' } },
        dealerInventories: {
          where: { available: { gt: 0 } },
          include: {
            dealer: {
              select: {
                id: true,
                name: true,
                code: true,
                city: true,
                address: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
  }

  async compareVehicles(vehicleIds: string[]) {
    if (!vehicleIds || vehicleIds.length < 2) {
      throw new Error('Please select at least 2 vehicles to compare');
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds }, status: 'ACTIVE' },
      include: {
        manufacturer: { select: { name: true, logo: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    });

    return vehicles;
  }

  async getManufacturers() {
    return prisma.manufacturer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getDealers(vehicleId?: string) {
    const where: any = { isActive: true };

    if (vehicleId) {
      where.inventories = {
        some: {
          vehicleId,
          available: { gt: 0 },
        },
      };
    }

    return prisma.dealer.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        address: true,
        phone: true,
        email: true,
        region: { select: { name: true } },
        ...(vehicleId && {
          inventories: {
            where: { vehicleId, available: { gt: 0 } },
            select: { available: true },
          },
        }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async checkVehicleAtDealer(dealerId: string, vehicleId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: {
        dealerId_vehicleId: { dealerId, vehicleId },
      },
      include: {
        vehicle: {
          select: { model: true, variant: true, retailPrice: true },
        },
        dealer: {
          select: { name: true, city: true, phone: true },
        },
      },
    });

    if (!inventory) throw new Error('Vehicle not available at this dealer');

    return {
      available: inventory.available > 0,
      quantity: inventory.available,
      vehicle: inventory.vehicle,
      dealer: inventory.dealer,
    };
  }

  async bookTestDrive(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vehicleId: string;
    dealerId: string;
    scheduledDate: string;
    notes?: string;
  }) {
    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: { manufacturer: true },
    });
    if (!vehicle || vehicle.status !== 'ACTIVE') {
      throw new Error('Vehicle not available');
    }

    // Verify dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: data.dealerId },
      include: { users: { take: 1 } },
    });
    if (!dealer || !dealer.isActive) {
      throw new Error('Dealer not available');
    }

    // Get a staff member from dealer to assign
    const staff = await prisma.user.findFirst({
      where: { dealerId: data.dealerId, isActive: true },
    });
    if (!staff) {
      throw new Error('No staff available at this dealer');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create or get customer
      let customer = await tx.customer.findFirst({
        where: { email: data.email, dealerId: data.dealerId },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            dealerId: data.dealerId,
            status: 'INTERESTED',
          },
        });
      }

      // Create test drive
      const testDrive = await tx.testDrive.create({
        data: {
          customerId: customer.id,
          vehicleId: data.vehicleId,
          staffId: staff.id,
          scheduledDate: new Date(data.scheduledDate),
          status: 'SCHEDULED',
          notes: data.notes,
        },
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
          vehicle: {
            select: {
              model: true,
              variant: true,
              manufacturer: { select: { name: true } },
            },
          },
          staff: {
            select: {
              firstName: true,
              lastName: true,
              dealer: { select: { name: true, city: true, phone: true, address: true } },
            },
          },
        },
      });

      return testDrive;
    });

    this.sendTestDriveEmailAsync(result, data);

    return result;
  }

  /**
   * ✅ Gửi email xác nhận (không chặn response)
   */
  private sendTestDriveEmailAsync(
    testDrive: any,
    bookingData: any
  ): void {
    // Run in background
    setImmediate(async () => {
      try {
        const customerName = `${testDrive.customer.firstName} ${testDrive.customer.lastName}`;
        
        await EmailUtil.sendTestDriveConfirmation({
          customerName,
          customerEmail: testDrive.customer.email,
          vehicleModel: testDrive.vehicle.model,
          vehicleVariant: testDrive.vehicle.variant,
          manufacturerName: testDrive.vehicle.manufacturer.name,
          scheduledDate: testDrive.scheduledDate,
          dealerName: testDrive.staff.dealer.name,
          dealerPhone: testDrive.staff.dealer.phone,
          dealerAddress: testDrive.staff.dealer.address,
          dealerCity: testDrive.staff.dealer.city,
          staffName: `${testDrive.staff.firstName} ${testDrive.staff.lastName}`,
          notes: bookingData.notes,
        });
      } catch (error: any) {
        console.error('Failed to send test drive email in background:', error.message);
      }
    });
  }
}