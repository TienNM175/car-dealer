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
    dealerId: string;
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
     * ✅ Filter by dealerId from authenticated user
     */
    async getAllCustomers(
      filters: CustomerFilters,
      pagination: PaginationParams,
      _userId?: string,
      userDealerId?: string
    ) {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const skip = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'desc';

      // ✅ Build where clause with dealerId filter
      const where: Prisma.CustomerWhereInput = {
        // ✅ IMPORTANT: Filter by dealer
        ...(userDealerId && { dealerId: userDealerId }),
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
          dealer: {
            select: {
              id: true,
              name: true,
              code: true,
            },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerById(id: string, userDealerId?: string) {
      const where: Prisma.CustomerWhereInput = {
        id,
        ...(userDealerId && { dealerId: userDealerId }),
      };

      const customer = await prisma.customer.findFirst({
        where,
        include: {
          dealer: {
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
            },
          },
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
     * ✅ Auto-assign dealerId from authenticated user
     */
    async createCustomer(data: CreateCustomerInput, createdBy?: string) {
      // ✅ Check if dealer exists
      const dealer = await prisma.dealer.findUnique({
        where: { id: data.dealerId },
      });

      if (!dealer) {
        throw new Error('Dealer not found');
      }

      if (!dealer.isActive) {
        throw new Error('Cannot add customer to inactive dealer');
      }

      // Check if email already exists in this dealer
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: data.email,
          dealerId: data.dealerId,
        },
      });

      if (existingCustomer) {
        throw new Error('Customer with this email already exists in your dealer');
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
            dealerId: data.dealerId,
            createdBy,
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

      return this.getCustomerById(customer.id, data.dealerId);
    }

    /**
     * Update customer
     * ✅ Check dealerId ownership
     */
    async updateCustomer(
      id: string,
      data: UpdateCustomerInput,
      updatedBy?: string,
      userDealerId?: string
    ) {
      // Check if customer exists and belongs to dealer
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id,
          ...(userDealerId && { dealerId: userDealerId }),
        },
      });

      if (!existingCustomer) {
        throw new Error('Customer not found');
      }

      // Check email uniqueness if email is being updated
      if (data.email && data.email !== existingCustomer.email) {
        const emailExists = await prisma.customer.findFirst({
          where: {
            email: data.email,
            dealerId: existingCustomer.dealerId,
            id: { not: id },
          },
        });

        if (emailExists) {
          throw new Error('Email already in use by another customer');
        }
      }

      // Debug log
      console.log('🔍 Update customer data received:', {
        id,
        address: data.address,
        addressUndefined: data.address === undefined,
        addressEmpty: data.address === '',
        city: data.city,
        phone: data.phone,
      });

      // Update customer
      const customer = await prisma.$transaction(async (tx) => {
        const updateData: any = {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.email && { email: data.email }),
        };

        // Handle optional fields - allow empty string to be updated
        if ('phone' in data) {
          updateData.phone = data.phone || null;
        }
        if ('address' in data) {
          updateData.address = data.address || null;
        }
        if ('city' in data) {
          updateData.city = data.city || null;
        }
        if ('identityCard' in data) {
          updateData.identityCard = data.identityCard || null;
        }
        if (data.status) {
          updateData.status = data.status;
        }

        console.log('🔍 Update data to save:', updateData);

        const updated = await tx.customer.update({
          where: { id },
          data: updateData,
        });

        console.log('✅ Customer updated:', { id, address: updated.address });

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

      return this.getCustomerById(customer.id, userDealerId);
    }

    /**
     * Delete customer
     * ✅ Check dealerId ownership
     */
    async deleteCustomer(id: string, userDealerId?: string) {
      // Check if customer exists and belongs to dealer
      const customer = await prisma.customer.findFirst({
        where: {
          id,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerLifecycle(customerId: string, userDealerId?: string) {
      // Check if customer exists and belongs to dealer
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership before adding
     */
    async addLifecycleEvent(data: AddLifecycleInput, userDealerId?: string) {
      // Check if customer exists and belongs to dealer
      const customer = await prisma.customer.findFirst({
        where: {
          id: data.customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerContracts(customerId: string, userDealerId?: string) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerTestDrives(customerId: string, userDealerId?: string) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerQuotations(customerId: string, userDealerId?: string) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerFeedbacks(customerId: string, userDealerId?: string) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerComplaints(customerId: string, userDealerId?: string) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * ✅ Check dealerId ownership
     */
    async getCustomerStatistics(customerId: string, userDealerId?: string) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          ...(userDealerId && { dealerId: userDealerId }),
        },
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
     * Search customers
     * ✅ Filter by dealerId
     */
    async searchCustomers(query: string, userDealerId?: string) {
      const customers = await prisma.customer.findMany({
        where: {
          ...(userDealerId && { dealerId: userDealerId }),
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
          address: true,
          city: true,
          identityCard: true,
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
     * ✅ Filter by dealerId
     */
    async getCustomersByStatus(userDealerId?: string) {
      const byStatus = await prisma.customer.groupBy({
        by: ['status'],
        where: {
          ...(userDealerId && { dealerId: userDealerId }),
        },
        _count: true,
      });

      return byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      }));
    }
  }