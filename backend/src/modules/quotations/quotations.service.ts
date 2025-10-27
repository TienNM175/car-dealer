import prisma from '../../config/database';
import { Prisma, QuotationStatus, PaymentType } from '@prisma/client';

interface QuotationFilters {
  search?: string;
  customerId?: string;
  vehicleId?: string;
  staffId?: string;
  status?: QuotationStatus;
  minPrice?: number;
  maxPrice?: number;
  validFrom?: string;
  validTo?: string;
  paymentType?: PaymentType;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

 export interface QuotationCreatePayload {
  customerId: string;
  vehicleId: string;
  basePrice?: number;
  discount?: number;
  paymentType?: 'FULL' | 'INSTALLMENT';
  installmentMonths?: number;
  validUntil?: Date;
  status?: QuotationStatus;
  notes?: string;
}

export class QuotationsService {
  /**
   * Get all quotations with filters and pagination
   */
  async getAll(filters: QuotationFilters, pagination: PaginationParams, _userId?: string, userRole?: string, dealerId?: string) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 10, 100);
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    const where: Prisma.QuotationWhereInput = {
      ...(filters.search && {
        OR: [
          { quoteNumber: { contains: filters.search, mode: 'insensitive' } },
          { customer: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: filters.search, mode: 'insensitive' } } },
          { vehicle: { model: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.staffId && { staffId: filters.staffId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.paymentType && { paymentType: filters.paymentType }),
      ...(filters.minPrice && { finalPrice: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { finalPrice: { lte: filters.maxPrice } }),
      ...(filters.validFrom && filters.validTo && {
        validUntil: {
          gte: new Date(filters.validFrom),
          lte: new Date(filters.validTo),
        },
      }),
    };

    // Dealer staff can only see quotations from their dealer
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      where.staff = {
        dealerId: dealerId || undefined,
      };
    }

    const total = await prisma.quotation.count({ where });

    const quotations = await prisma.quotation.findMany({
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
          select: {
            id: true,
            model: true,
            variant: true,
            year: true,
            manufacturer: {
              select: { name: true },
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
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return {
      data: quotations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single quotation by ID
   */
  async getById(id: string, _userId?: string, userRole?: string, dealerId?: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
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

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Check authorization
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      if (quotation.staff.dealerId !== dealerId) {
        throw new Error('Access denied');
      }
    }

    return quotation;
  }

  /**
   * Get quotation by quote number
   */
  async getByQuoteNumber(quoteNumber: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { quoteNumber },
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

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    return quotation;
  }

  /**
   * Get customer quotations
   */
  async getByCustomerId(customerId: string, pagination: PaginationParams) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 10, 100);
    const skip = (page - 1) * limit;

    const total = await prisma.quotation.count({
      where: { customerId },
    });

    const quotations = await prisma.quotation.findMany({
      where: { customerId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          include: {
            manufacturer: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      data: quotations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Create new quotation
   */
  async create(data: QuotationCreatePayload, staffId: string) {
    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Validate vehicle exists and get price
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    if (vehicle.status !== 'ACTIVE') {
      throw new Error('Vehicle is not available');
    }

    // Generate quote number
    const quoteNumber = await this.generateQuoteNumber();

    // Calculate final price
    const basePrice = data.basePrice || vehicle.retailPrice;
    const discount = data.discount || 0;
    const finalPrice = Number(basePrice) - Number(discount);

    if (finalPrice < 0) {
      throw new Error('Final price cannot be negative');
    }

    // Calculate installment if needed
    let monthlyPayment = null;
    if (data.paymentType === 'INSTALLMENT' && data.installmentMonths) {
      // Simple calculation (should use proper loan formula)
      const interestRate = 0.08; // 8% annual
      const months = data.installmentMonths;
      const monthlyRate = interestRate / 12;
      monthlyPayment = (Number(finalPrice) * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                       (Math.pow(1 + monthlyRate, months) - 1);
    }

    // Set valid until (default 30 days)
    const validUntil = data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber,
        customer: { connect: { id: customer.id } },
        vehicle: { connect: { id: vehicle.id } },
        staff: { connect: { id: staffId } },
        basePrice,
        discount,
        finalPrice,
        paymentType: data.paymentType || 'FULL',
        installmentMonths: data.installmentMonths,
        monthlyPayment: monthlyPayment ? new Prisma.Decimal(monthlyPayment) : null,
        validUntil,
        status: data.status || 'DRAFT',
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

    // Update customer status to QUOTED if not already
    if (customer.status === 'INTERESTED' || customer.status === 'CONTACTED') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { status: 'QUOTED' },
      });

      // Add lifecycle event
      await prisma.customerLifecycle.create({
        data: {
          customerId: customer.id,
          status: 'QUOTED',
          notes: `Quotation ${quoteNumber} created`,
          changedBy: staffId,
        },
      });
    }

    return quotation;
  }

  /**
   * Update quotation
   */
  async update(id: string, data: Prisma.QuotationUpdateInput, _userId: string, userRole: string, dealerId?: string) {
    const existing = await prisma.quotation.findUnique({
      where: { id },
      include: { staff: true },
    });

    if (!existing) {
      throw new Error('Quotation not found');
    }

    // Check authorization
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      if (existing.staff.dealerId !== dealerId) {
        throw new Error('Access denied');
      }
    }

    // Cannot update accepted/rejected/expired quotations
    if (['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(existing.status)) {
      throw new Error(`Cannot update ${existing.status.toLowerCase()} quotation`);
    }

    // Recalculate if prices changed
    let finalPrice = existing.finalPrice;
    let monthlyPayment = existing.monthlyPayment;

    if (data.basePrice || data.discount) {
      const basePrice = data.basePrice || existing.basePrice;
      const discount = data.discount || existing.discount;
      finalPrice = new Prisma.Decimal(Number(basePrice) - Number(discount));

      if (Number(finalPrice) < 0) {
        throw new Error('Final price cannot be negative');
      }
    }

    if (data.paymentType === 'INSTALLMENT' && (data.installmentMonths || existing.installmentMonths)) {
      const months = (data.installmentMonths as number) || existing.installmentMonths || 12;
      const interestRate = 0.08;
      const monthlyRate = interestRate / 12;
      const calculated = (Number(finalPrice) * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                        (Math.pow(1 + monthlyRate, months) - 1);
      monthlyPayment = new Prisma.Decimal(calculated);
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        ...data,
        finalPrice,
        monthlyPayment,
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

    return quotation;
  }

  /**
   * Update quotation status
   */
  async updateStatus(id: string, status: QuotationStatus, userId: string, userRole: string, dealerId?: string) {
    const existing = await prisma.quotation.findUnique({
      where: { id },
      include: { staff: true, customer: true },
    });

    if (!existing) {
      throw new Error('Quotation not found');
    }

    // Check authorization
    if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
      if (existing.staff.dealerId !== dealerId) {
        throw new Error('Access denied');
      }
    }

    // Validate status transitions
    const validTransitions: Record<QuotationStatus, QuotationStatus[]> = {
      DRAFT: ['SENT', 'EXPIRED'],
      SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
      ACCEPTED: ['EXPIRED'],
      REJECTED: [],
      EXPIRED: [],
    };

    if (!validTransitions[existing.status].includes(status)) {
      throw new Error(`Cannot transition from ${existing.status} to ${status}`);
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: { status },
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

    // Add customer lifecycle event
    await prisma.customerLifecycle.create({
      data: {
        customerId: existing.customerId,
        status: existing.customer.status,
        notes: `Quotation ${existing.quoteNumber} ${status.toLowerCase()}`,
        changedBy: userId,
      },
    });

    return quotation;
  }

  /**
   * Delete quotation
   */
  async delete(id: string, _userId: string, userRole: string, dealerId?: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { staff: true },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Check authorization
    if (userRole !== 'ADMIN') {
      if (userRole === 'DEALER_STAFF' || userRole === 'DEALER_MANAGER') {
        if (quotation.staff.dealerId !== dealerId) {
          throw new Error('Access denied');
        }
      }
    }

    // Only allow deleting DRAFT quotations
    if (quotation.status !== 'DRAFT') {
      throw new Error('Can only delete draft quotations');
    }

    await prisma.quotation.delete({
      where: { id },
    });

    return { message: 'Quotation deleted successfully' };
  }

  /**
   * Check and expire old quotations
   */
  async expireOldQuotations() {
    const now = new Date();

    const expired = await prisma.quotation.updateMany({
      where: {
        validUntil: { lt: now },
        status: { in: ['DRAFT', 'SENT'] },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return { count: expired.count };
  }

  /**
   * Generate unique quote number
   */
  private async generateQuoteNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const prefix = `QT${year}${month}`;
    
    const lastQuote = await prisma.quotation.findFirst({
      where: {
        quoteNumber: { startsWith: prefix },
      },
      orderBy: { quoteNumber: 'desc' },
    });

    let sequence = 1;
    if (lastQuote) {
      const lastSequence = parseInt(lastQuote.quoteNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Get quotation statistics
   */
  async getStatistics(dealerId?: string) {
    const where: Prisma.QuotationWhereInput = dealerId
      ? { staff: { dealerId } }
      : {};

    const [total, byStatus, avgFinalPrice, recentQuotations] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.quotation.aggregate({
        where,
        _avg: { finalPrice: true },
      }),
      prisma.quotation.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          vehicle: {
            select: {
              model: true,
              variant: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      avgFinalPrice: avgFinalPrice._avg.finalPrice,
      recentQuotations,
    };
  }
}