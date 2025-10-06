import prisma from '../../config/database';
import { Prisma, ContractStatus, PaymentType } from '@prisma/client';

interface ContractFilters {
  search?: string;
  status?: ContractStatus;
  customerId?: string;
  staffId?: string;
  dealerId?: string;
  paymentType?: PaymentType;
  fromDate?: Date;
  toDate?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateContractInput {
  customerId: string;
  staffId: string;
  vehicleId: string;
  basePrice: number;
  discount?: number;
  paymentType: PaymentType;
  installmentMonths?: number;
  interestRate?: number;
  deliveryDate?: Date;
  notes?: string;
}

interface UpdateContractInput {
  basePrice?: number;
  discount?: number;
  paymentType?: PaymentType;
  installmentMonths?: number;
  interestRate?: number;
  deliveryDate?: Date;
  notes?: string;
}

export class ContractService {
  /**
   * Calculate contract financial details
   */
  private calculateFinancials(
    basePrice: number,
    discount: number = 0,
    paymentType: PaymentType,
    installmentMonths?: number,
    interestRate?: number
  ) {
    const finalPrice = basePrice - discount;
    
    let monthlyPayment = null;
    
    if (paymentType === 'INSTALLMENT' && installmentMonths && interestRate) {
      // Calculate monthly payment with interest
      const principal = finalPrice;
      const monthlyRate = interestRate / 100 / 12;
      const numberOfPayments = installmentMonths;
      
      // Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
      monthlyPayment = 
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      
      monthlyPayment = Math.round(monthlyPayment * 100) / 100;
    }
    
    return {
      finalPrice,
      monthlyPayment,
    };
  }

  /**
   * Generate unique contract code
   */
  private async generateContractCode(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get last contract number for this month
    const lastContract = await prisma.contract.findFirst({
      where: {
        contractCode: {
          startsWith: `CT-${year}${month}`,
        },
      },
      orderBy: {
        contractCode: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastContract) {
      const lastNumber = parseInt(lastContract.contractCode.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }

    return `CT-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Get all contracts with filters
   */
  async getAllContracts(filters: ContractFilters, pagination: PaginationParams, _userId?: string, userRole?: string, dealerId?: string) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    // Build where clause
    const where: Prisma.ContractWhereInput = {
      ...(filters.search && {
        OR: [
          { contractCode: { contains: filters.search, mode: 'insensitive' } },
          { customer: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { email: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
      ...(filters.status && { status: filters.status }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.staffId && { staffId: filters.staffId }),
      ...(filters.paymentType && { paymentType: filters.paymentType }),
      ...(filters.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { createdAt: { lte: filters.toDate } }),
      // Dealer staff can only see their dealer's contracts
      ...(userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER' 
        ? { staff: { dealerId } } 
        : filters.dealerId 
        ? { staff: { dealerId: filters.dealerId } } 
        : {}),
    };

    const total = await prisma.contract.count({ where });

    const contracts = await prisma.contract.findMany({
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
        customerDebts: true,
        _count: {
          select: {
            feedbacks: true,
            complaints: true,
          },
        },
      },
    });

    return {
      data: contracts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get contract by ID
   */
  async getContractById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            _count: {
              select: {
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
        feedbacks: {
          orderBy: { createdAt: 'desc' },
        },
        complaints: {
          orderBy: { createdAt: 'desc' },
        },
        customerDebts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    return contract;
  }

  /**
   * Create new contract
   */
  async createContract(data: CreateContractInput, userId: string) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
      include: {
        dealerInventories: {
          where: {
            dealer: {
              users: {
                some: {
                  id: data.staffId,
                },
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (vehicle.status !== 'ACTIVE') {
      throw new Error('Vehicle is not available for sale');
    }

    // Check inventory availability
    const dealerInventory = vehicle.dealerInventories[0];
    if (!dealerInventory || dealerInventory.available < 1) {
      throw new Error('Vehicle not available in inventory');
    }

    // Validate installment data
    if (data.paymentType === 'INSTALLMENT') {
      if (!data.installmentMonths || data.installmentMonths < 1) {
        throw new Error('Installment months is required for installment payment');
      }
      if (!data.interestRate || data.interestRate < 0) {
        throw new Error('Interest rate is required for installment payment');
      }
    }

    // Calculate financials
    const { finalPrice, monthlyPayment } = this.calculateFinancials(
      data.basePrice,
      data.discount || 0,
      data.paymentType,
      data.installmentMonths,
      data.interestRate
    );

    // Generate contract code
    const contractCode = await this.generateContractCode();

    // Create contract with transaction
    const contract = await prisma.$transaction(async (tx) => {
      // Create contract
      const newContract = await tx.contract.create({
        data: {
          contractCode,
          customerId: data.customerId,
          staffId: data.staffId,
          vehicleId: data.vehicleId,
          basePrice: data.basePrice,
          discount: data.discount || 0,
          finalPrice,
          paymentType: data.paymentType,
          installmentMonths: data.installmentMonths,
          monthlyPayment,
          interestRate: data.interestRate,
          status: 'DRAFT',
          deliveryDate: data.deliveryDate,
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

      // Reserve inventory
      await tx.inventory.update({
        where: {
          dealerId_vehicleId: {
            dealerId: dealerInventory.dealerId,
            vehicleId: data.vehicleId,
          },
        },
        data: {
          reserved: { increment: 1 },
          available: { decrement: 1 },
        },
      });

      // Update customer status to PURCHASED if not already
      if (customer.status !== 'PURCHASED') {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { status: 'PURCHASED' },
        });

        // Add lifecycle event
        await tx.customerLifecycle.create({
          data: {
            customerId: data.customerId,
            status: 'PURCHASED',
            notes: `Contract ${contractCode} created`,
            changedBy: userId,
          },
        });
      }

      return newContract;
    });

    return contract;
  }

  /**
   * Update contract
   */
  async updateContract(id: string, data: UpdateContractInput) {
    // Check if contract exists
    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!existingContract) {
      throw new Error('Contract not found');
    }

    // Can only update DRAFT or PENDING contracts
    if (existingContract.status !== 'DRAFT' && existingContract.status !== 'PENDING') {
      throw new Error('Can only update draft or pending contracts');
    }

    // Calculate new financials if price/discount changed
    const basePrice = data.basePrice ?? existingContract.basePrice;
    const discount = data.discount ?? existingContract.discount;
    const paymentType = data.paymentType ?? existingContract.paymentType;
    const installmentMonths = data.installmentMonths ?? existingContract.installmentMonths;
    const interestRate = data.interestRate ?? existingContract.interestRate;

    const { finalPrice, monthlyPayment } = this.calculateFinancials(
      Number(basePrice),
      Number(discount),
      paymentType,
      installmentMonths || undefined,
      interestRate ? Number(interestRate) : undefined
    );

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.discount !== undefined && { discount: data.discount }),
        finalPrice,
        ...(data.paymentType && { paymentType: data.paymentType }),
        ...(data.installmentMonths !== undefined && { installmentMonths: data.installmentMonths }),
        monthlyPayment,
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.deliveryDate && { deliveryDate: data.deliveryDate }),
        ...(data.notes !== undefined && { notes: data.notes }),
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

    return contract;
  }

  /**
   * Update contract status
   */
  async updateContractStatus(id: string, status: ContractStatus, _userId: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        vehicle: true,
        staff: {
          include: {
            dealer: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Validate status transitions
    const validTransitions: Record<ContractStatus, ContractStatus[]> = {
      DRAFT: ['PENDING', 'CANCELLED'],
      PENDING: ['SIGNED', 'CANCELLED'],
      SIGNED: ['DELIVERING', 'CANCELLED'],
      DELIVERING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[contract.status].includes(status)) {
      throw new Error(`Cannot transition from ${contract.status} to ${status}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id },
        data: {
          status,
          ...(status === 'SIGNED' && { signedAt: new Date() }),
          ...(status === 'COMPLETED' && { deliveredAt: new Date() }),
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

      // If completed, move from reserved to sold in inventory
      if (status === 'COMPLETED') {
        await tx.inventory.update({
          where: {
            dealerId_vehicleId: {
              dealerId: contract.staff.dealerId!,
              vehicleId: contract.vehicleId,
            },
          },
          data: {
            reserved: { decrement: 1 },
            sold: { increment: 1 },
            quantity: { decrement: 1 },
          },
        });
      }

      // If cancelled, release reserved inventory
      if (status === 'CANCELLED' && contract.status !== 'COMPLETED') {
        await tx.inventory.update({
          where: {
            dealerId_vehicleId: {
              dealerId: contract.staff.dealerId!,
              vehicleId: contract.vehicleId,
            },
          },
          data: {
            reserved: { decrement: 1 },
            available: { increment: 1 },
          },
        });
      }

      return updatedContract;
    });

    return result;
  }

  /**
   * Delete contract (only DRAFT)
   */
  async deleteContract(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        staff: {
          include: {
            dealer: true,
          },
        },
      },
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'DRAFT') {
      throw new Error('Can only delete draft contracts');
    }

    await prisma.$transaction(async (tx) => {
      // Release reserved inventory
      await tx.inventory.update({
        where: {
          dealerId_vehicleId: {
            dealerId: contract.staff.dealerId!,
            vehicleId: contract.vehicleId,
          },
        },
        data: {
          reserved: { decrement: 1 },
          available: { increment: 1 },
        },
      });

      // Delete contract
      await tx.contract.delete({
        where: { id },
      });
    });

    return { message: 'Contract deleted successfully' };
  }

  /**
   * Get contract statistics
   */
  async getContractStatistics(filters?: { dealerId?: string; staffId?: string; fromDate?: Date; toDate?: Date }) {
    const where: Prisma.ContractWhereInput = {
      ...(filters?.dealerId && { staff: { dealerId: filters.dealerId } }),
      ...(filters?.staffId && { staffId: filters.staffId }),
      ...(filters?.fromDate && { createdAt: { gte: filters.fromDate } }),
      ...(filters?.toDate && { createdAt: { lte: filters.toDate } }),
    };

    // Overall statistics
    const totalStats = await prisma.contract.aggregate({
      where,
      _count: true,
      _sum: {
        basePrice: true,
        discount: true,
        finalPrice: true,
      },
      _avg: {
        finalPrice: true,
        discount: true,
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

    // By payment type
    const byPaymentType = await prisma.contract.groupBy({
      by: ['paymentType'],
      where,
      _count: true,
      _sum: {
        finalPrice: true,
      },
    });

    return {
      total: {
        count: totalStats._count,
        totalRevenue: totalStats._sum.finalPrice || 0,
        totalDiscount: totalStats._sum.discount || 0,
        averageOrderValue: totalStats._avg.finalPrice || 0,
      },
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count,
        revenue: item._sum.finalPrice || 0,
      })),
      byPaymentType: byPaymentType.map(item => ({
        type: item.paymentType,
        count: item._count,
        revenue: item._sum.finalPrice || 0,
      })),
    };
  }

  /**
   * Get contracts by status
   */
  async getContractsByStatus(dealerId?: string) {
    const where: Prisma.ContractWhereInput = {
      ...(dealerId && { staff: { dealerId } }),
    };

    const byStatus = await prisma.contract.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return byStatus.map(item => ({
      status: item.status,
      count: item._count,
    }));
  }
}