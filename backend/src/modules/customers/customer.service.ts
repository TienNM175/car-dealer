import prisma from '../../config/database';
import { Prisma, CustomerStatus } from '@prisma/client';

interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  city?: string;
  dealerId?: string;
  hasContract?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  identityCard?: string;
  status?: CustomerStatus;
}

interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  identityCard?: string;
  status?: CustomerStatus;
}

interface AddLifecycleInput {
  customerId: string;
  status: CustomerStatus;
  notes?: string;
  changedBy: string;
}

export class CustomerService {
  /**
   * Get all customers with filters and pagination
   */
  async getAllCustomers(filters: CustomerFilters, pagination: PaginationParams, _userId?: string) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';

    // Build where clause
    const where: Prisma.CustomerWhereInput = {
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.status && { status: filters.status }),
      ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
      ...(filters.hasContract && {
        contracts: {
          some: {},
        },
      }),
    };

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get customers
    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            contracts: true,
            quotations: true,
            testDrives: true,
            feedbacks: true,
            complaints: true,
          },
        },
      },
    });

    return {
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        lifecycle: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        contracts: {
          include: {
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
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          include: {
            vehicle: {
              select: {
                id: true,
                model: true,
                variant: true,
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
        },
        testDrives: {
          include: {
            vehicle: {
              select: {
                id: true,
                model: true,
                variant: true,
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
          orderBy: { scheduledDate: 'desc' },
        },
        feedbacks: {
          include: {
            contract: {
              select: {
                id: true,
                contractCode: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        complaints: {
          include: {
            contract: {
              select: {
                id: true,
                contractCode: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        customerDebts: {
          include: {
            contract: {
              select: {
                id: true,
                contractCode: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            contracts: true,
            quotations: true,
            testDrives: true,
            feedbacks: true,
            complaints: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  /**
   * Create new customer
   */
  async createCustomer(data: CreateCustomerInput, createdBy?: string) {
    // Check if email already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: data.email },
    });

    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    // Create customer with initial lifecycle
    const customer = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          identityCard: data.identityCard,
          status: data.status || 'INTERESTED',
        },
      });

      // Add initial lifecycle record
      await tx.customerLifecycle.create({
        data: {
          customerId: newCustomer.id,
          status: newCustomer.status,
          notes: 'Customer created',
          changedBy: createdBy,
        },
      });

      return newCustomer;
    });

    return this.getCustomerById(customer.id);
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: UpdateCustomerInput, updatedBy?: string) {
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new Error('Email already in use by another customer');
      }
    }

    // Update customer
    const customer = await prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.email && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.identityCard !== undefined && { identityCard: data.identityCard }),
          ...(data.status && { status: data.status }),
        },
      });

      // Add lifecycle record if status changed
      if (data.status && data.status !== existingCustomer.status) {
        await tx.customerLifecycle.create({
          data: {
            customerId: id,
            status: data.status,
            notes: `Status changed from ${existingCustomer.status} to ${data.status}`,
            changedBy: updatedBy,
          },
        });
      }

      return updated;
    });

    return this.getCustomerById(customer.id);
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contracts: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if customer has contracts
    if (customer._count.contracts > 0) {
      throw new Error('Cannot delete customer with existing contracts. Consider archiving instead.');
    }

    await prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }

  /**
   * Get customer lifecycle history
   */
  async getCustomerLifecycle(customerId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const lifecycle = await prisma.customerLifecycle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        currentStatus: customer.status,
      },
      lifecycle,
    };
  }

  /**
   * Add lifecycle event
   */
  async addLifecycleEvent(data: AddLifecycleInput) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Update customer status and add lifecycle record
    const result = await prisma.$transaction(async (tx) => {
      // Update customer status
      await tx.customer.update({
        where: { id: data.customerId },
        data: { status: data.status },
      });

      // Add lifecycle record
      const lifecycleRecord = await tx.customerLifecycle.create({
        data: {
          customerId: data.customerId,
          status: data.status,
          notes: data.notes,
          changedBy: data.changedBy,
        },
      });

      return lifecycleRecord;
    });

    return result;
  }

  /**
   * Get customer contracts
   */
  async getCustomerContracts(customerId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const contracts = await prisma.contract.findMany({
      where: { customerId },
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
            dealer: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
        customerDebts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return contracts;
  }

  /**
   * Get customer test drives
   */
  async getCustomerTestDrives(customerId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const testDrives = await prisma.testDrive.findMany({
      where: { customerId },
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
            dealer: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });

    return testDrives;
  }

  /**
   * Get customer quotations
   */
  async getCustomerQuotations(customerId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const quotations = await prisma.quotation.findMany({
      where: { customerId },
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
            dealer: {
              select: {
                name: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotations;
  }

  /**
   * Get customer feedbacks
   */
  async getCustomerFeedbacks(customerId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { customerId },
      include: {
        contract: {
          select: {
            id: true,
            contractCode: true,
            vehicle: {
              select: {
                model: true,
                variant: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feedbacks;
  }

  /**
   * Get customer complaints
   */
  async getCustomerComplaints(customerId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const complaints = await prisma.complaint.findMany({
      where: { customerId },
      include: {
        contract: {
          select: {
            id: true,
            contractCode: true,
            vehicle: {
              select: {
                model: true,
                variant: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return complaints;
  }

  /**
   * Get customer statistics
   */
  async getCustomerStatistics(customerId: string) {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get counts
    const stats = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: {
            contracts: true,
            quotations: true,
            testDrives: true,
            feedbacks: true,
            complaints: true,
          },
        },
      },
    });

    // Get contract totals
    const contractStats = await prisma.contract.aggregate({
      where: { customerId },
      _sum: {
        finalPrice: true,
      },
      _count: true,
    });

    // Get debt info
    const debtStats = await prisma.customerDebt.aggregate({
      where: { customerId },
      _sum: {
        totalDebt: true,
        paidAmount: true,
      },
    });

    // Get average feedback rating
    const feedbackStats = await prisma.feedback.aggregate({
      where: { customerId },
      _avg: {
        rating: true,
      },
    });

    return {
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        status: customer.status,
      },
      counts: {
        contracts: stats?._count.contracts || 0,
        quotations: stats?._count.quotations || 0,
        testDrives: stats?._count.testDrives || 0,
        feedbacks: stats?._count.feedbacks || 0,
        complaints: stats?._count.complaints || 0,
      },
      financial: {
        totalPurchases: Number(contractStats._sum.finalPrice) || 0,
        numberOfPurchases: contractStats._count,
        totalDebt: Number(debtStats._sum.totalDebt) || 0,
        paidAmount: Number(debtStats._sum.paidAmount) || 0,
        remainingDebt: (Number(debtStats._sum.totalDebt) || 0) - (Number(debtStats._sum.paidAmount) || 0),
    },
      satisfaction: {
        averageRating: feedbackStats._avg.rating || 0,
        totalFeedbacks: stats?._count.feedbacks || 0,
      },
    };
  }

  /**
   * Search customers by multiple criteria
   */
  async searchCustomers(query: string) {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { identityCard: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        status: true,
        createdAt: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return customers;
  }

  /**
   * Get customers by status
   */
  async getCustomersByStatus() {
    const byStatus = await prisma.customer.groupBy({
      by: ['status'],
      _count: true,
    });

    return byStatus.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }
}