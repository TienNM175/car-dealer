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

  async lookupContract(
    contractCode: string,
    email?: string,
    phone?: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: { contractCode },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          include: {
            manufacturer: {
              select: { name: true, logo: true },
            },
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
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
        customerDebts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        vehicleUnit: {
          select: {
            vin: true,
            engineNumber: true,
            color: true,
            deliveredAt: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Verify customer identity
    const emailMatch = email && contract.customer.email.toLowerCase() === email.toLowerCase();
    const phoneMatch = phone && contract.customer.phone === phone;

    if (!emailMatch && !phoneMatch) {
      throw new Error('Customer information does not match contract records');
    }

    // Calculate debt information
    const debtInfo = this.calculateDebtInfo(contract);

    return {
      contract: {
        contractCode: contract.contractCode,
        status: contract.status,
        signedAt: contract.signedAt,
        deliveredAt: contract.deliveredAt,
        deliveryDate: contract.deliveryDate,
        basePrice: contract.basePrice,
        discount: contract.discount,
        tax: contract.tax,
        finalPrice: contract.finalPrice,
        paymentType: contract.paymentType,
        installmentMonths: contract.installmentMonths,
        monthlyPayment: contract.monthlyPayment,
        interestRate: contract.interestRate,
        notes: contract.notes,
      },
      customer: {
        firstName: contract.customer.firstName,
        lastName: contract.customer.lastName,
        email: contract.customer.email,
        phone: contract.customer.phone,
      },
      vehicle: {
        model: contract.vehicle.model,
        variant: contract.vehicle.variant,
        year: contract.vehicle.year,
        manufacturer: contract.vehicle.manufacturer,
        image: contract.vehicle.images[0]?.url,
        vin: contract.vehicleUnit?.vin,
        engineNumber: contract.vehicleUnit?.engineNumber,
        color: contract.vehicleUnit?.color,
      },
      dealer: contract.staff.dealer,
      staff: {
        name: `${contract.staff.firstName} ${contract.staff.lastName}`,
        phone: contract.staff.phone,
      },
      debt: debtInfo,
    };
  }

  /**
   * Get detailed debt information
   */
  async getContractDebt(
    contractCode: string,
    email?: string,
    phone?: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: { contractCode },
      include: {
        customer: {
          select: {
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        customerDebts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Verify customer identity
    const emailMatch = email && contract.customer.email.toLowerCase() === email.toLowerCase();
    const phoneMatch = phone && contract.customer.phone === phone;

    if (!emailMatch && !phoneMatch) {
      throw new Error('Customer information does not match contract records');
    }

    const debtInfo = this.calculateDebtInfo(contract);

    return {
      contractCode: contract.contractCode,
      customer: {
        name: `${contract.customer.firstName} ${contract.customer.lastName}`,
        email: contract.customer.email,
        phone: contract.customer.phone,
      },
      debt: debtInfo,
      paymentHistory: contract.customerDebts.map((debt) => ({
        id: debt.id,
        totalDebt: debt.totalDebt,
        paidAmount: debt.paidAmount,
        status: debt.status,
        dueDate: debt.dueDate,
        createdAt: debt.createdAt,
        updatedAt: debt.updatedAt,
      })),
    };
  }

  /**
   * Get payment schedule for installment contracts
   */
  async getPaymentSchedule(
    contractCode: string,
    email?: string,
    phone?: string
  ) {
    const contract = await prisma.contract.findUnique({
      where: { contractCode },
      include: {
        customer: {
          select: {
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        customerDebts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Verify customer identity
    const emailMatch = email && contract.customer.email.toLowerCase() === email.toLowerCase();
    const phoneMatch = phone && contract.customer.phone === phone;

    if (!emailMatch && !phoneMatch) {
      throw new Error('Customer information does not match contract records');
    }

    // Only for installment contracts
    if (contract.paymentType !== 'INSTALLMENT') {
      throw new Error('This is not an installment contract');
    }

    if (!contract.installmentMonths || !contract.monthlyPayment || !contract.signedAt) {
      throw new Error('Incomplete installment information');
    }

    // Generate payment schedule
    const schedule = this.generatePaymentSchedule(
      contract.signedAt,
      contract.installmentMonths,
      Number(contract.monthlyPayment),
      Number(contract.finalPrice),
      contract.customerDebts[0]
    );

    return {
      contractCode: contract.contractCode,
      customer: {
        name: `${contract.customer.firstName} ${contract.customer.lastName}`,
      },
      paymentInfo: {
        totalAmount: contract.finalPrice,
        installmentMonths: contract.installmentMonths,
        monthlyPayment: contract.monthlyPayment,
        interestRate: contract.interestRate,
        startDate: contract.signedAt,
      },
      schedule,
      summary: {
        totalPaid: contract.customerDebts[0]?.paidAmount || 0,
        remainingDebt: Number(contract.finalPrice) - Number(contract.customerDebts[0]?.paidAmount || 0),
        paidMonths: schedule.filter((s) => s.status === 'PAID').length,
        remainingMonths: schedule.filter((s) => s.status !== 'PAID').length,
      },
    };
  }

  /**
   * Helper: Calculate debt information
   */
  private calculateDebtInfo(contract: any) {
    if (contract.paymentType === 'FULL') {
      // Full payment contracts
      const totalAmount = Number(contract.finalPrice);
      const paidAmount = contract.status === 'COMPLETED' ? totalAmount : 0;
      
      return {
        paymentType: 'FULL',
        totalAmount,
        paidAmount,
        remainingDebt: totalAmount - paidAmount,
        status: contract.status === 'COMPLETED' ? 'PAID' : 'UNPAID',
        isPaid: contract.status === 'COMPLETED',
      };
    }

    // Installment contracts
    const customerDebt = contract.customerDebts?.[0];
    const totalAmount = Number(contract.finalPrice);
    const paidAmount = customerDebt ? Number(customerDebt.paidAmount) : 0;
    const remainingDebt = totalAmount - paidAmount;

    // Calculate months paid
    const monthlyPayment = Number(contract.monthlyPayment || 0);
    const monthsPaid = monthlyPayment > 0 ? Math.floor(paidAmount / monthlyPayment) : 0;
    const remainingMonths = (contract.installmentMonths || 0) - monthsPaid;

    // Calculate next payment due
    let nextPaymentDate = null;
    let isOverdue = false;
    
    if (contract.signedAt && remainingDebt > 0) {
      const signedDate = new Date(contract.signedAt);
      nextPaymentDate = new Date(signedDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + monthsPaid + 1);
      
      const today = new Date();
      isOverdue = today > nextPaymentDate;
    }

    return {
      paymentType: 'INSTALLMENT',
      totalAmount,
      paidAmount,
      remainingDebt,
      monthlyPayment: contract.monthlyPayment,
      installmentMonths: contract.installmentMonths,
      monthsPaid,
      remainingMonths,
      nextPaymentDate,
      nextPaymentAmount: remainingDebt > 0 ? Math.min(monthlyPayment, remainingDebt) : 0,
      isOverdue,
      status: customerDebt?.status || 'UNPAID',
      isPaid: remainingDebt <= 0,
    };
  }

  /**
   * Helper: Generate payment schedule
   */
  private generatePaymentSchedule(
    startDate: Date,
    months: number,
    monthlyPayment: number,
    totalAmount: number,
    debt: any
  ) {
    const schedule = [];
    const paidAmount = debt ? Number(debt.paidAmount) : 0;
    const monthsPaid = Math.floor(paidAmount / monthlyPayment);

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      const isLastMonth = i === months - 1;
      const paymentAmount = isLastMonth
        ? totalAmount - (monthlyPayment * (months - 1)) // Adjust last payment
        : monthlyPayment;

      let status: 'PAID' | 'PENDING' | 'OVERDUE';
      let paidDate = null;

      if (i < monthsPaid) {
        status = 'PAID';
        paidDate = new Date(startDate);
        paidDate.setMonth(paidDate.getMonth() + i + 1);
      } else if (new Date() > dueDate) {
        status = 'OVERDUE';
      } else {
        status = 'PENDING';
      }

      schedule.push({
        month: i + 1,
        dueDate,
        amount: paymentAmount,
        status,
        paidDate,
      });
    }

    return schedule;
  }
}