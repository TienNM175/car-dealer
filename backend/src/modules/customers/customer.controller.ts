import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service';
import { ResponseUtil } from '../../utils/response.util';

const customerService = new CustomerService();

export class CustomerController {
  /**
   * Get all customers
   * ✅ Filtered by dealer
   */
  async getAllCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as any,
        city: req.query.city as string,
        hasContract: req.query.hasContract === 'true',
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      // ✅ Get dealerId from authenticated user
      const userDealerId = req.user?.dealerId;

      const result = await customerService.getAllCustomers(
        filters,
        pagination,
        req.user?.userId,
        userDealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        'Customers retrieved successfully',
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get customer by ID
   * ✅ Check dealer ownership
   */
  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const customer = await customerService.getCustomerById(id, userDealerId);
      return ResponseUtil.success(res, customer, 'Customer retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Create new customer
   * ✅ Auto-assign to user's dealer
   */
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userDealerId = req.user?.dealerId;

      if (!userDealerId) {
        return ResponseUtil.badRequest(res, 'User must belong to a dealer');
      }

      // ✅ Auto-assign dealerId from authenticated user
      const customerData = {
        ...req.body,
        dealerId: userDealerId,
      };

      const customer = await customerService.createCustomer(
        customerData,
        req.user?.userId
      );

      return ResponseUtil.created(res, customer, 'Customer created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return ResponseUtil.conflict(res, error.message);
      }
      if (error.message.includes('inactive dealer')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update customer
   * ✅ Check dealer ownership
   */
  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      // Debug log to check if address is received
      console.log('🔍 Update customer request body:', {
        id,
        address: req.body.address,
        city: req.body.city,
        phone: req.body.phone,
        fullBody: req.body,
      });

      const customer = await customerService.updateCustomer(
        id,
        req.body,
        req.user?.userId,
        userDealerId
      );

      return ResponseUtil.success(res, customer, 'Customer updated successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('already in use')) {
        return ResponseUtil.conflict(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Delete customer
   * ✅ Check dealer ownership
   */
  async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const result = await customerService.deleteCustomer(id, userDealerId);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot delete')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get customer lifecycle
   */
  async getCustomerLifecycle(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const lifecycle = await customerService.getCustomerLifecycle(id, userDealerId);
      return ResponseUtil.success(res, lifecycle, 'Customer lifecycle retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Add lifecycle event
   */
  async addLifecycleEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const lifecycleData = {
        customerId: id,
        status: req.body.status,
        notes: req.body.notes,
        changedBy: req.user?.userId || '',
      };

      // ✅ Pass userDealerId to check ownership
      const lifecycle = await customerService.addLifecycleEvent(lifecycleData, userDealerId);
      return ResponseUtil.created(res, lifecycle, 'Lifecycle event added successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get customer contracts
   */
  async getCustomerContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const contracts = await customerService.getCustomerContracts(id, userDealerId);
      return ResponseUtil.success(res, contracts, 'Customer contracts retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get customer test drives
   */
  async getCustomerTestDrives(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const testDrives = await customerService.getCustomerTestDrives(id, userDealerId);
      return ResponseUtil.success(res, testDrives, 'Customer test drives retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get customer quotations
   */
  async getCustomerQuotations(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const quotations = await customerService.getCustomerQuotations(id, userDealerId);
      return ResponseUtil.success(res, quotations, 'Customer quotations retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get customer feedbacks
   */
  async getCustomerFeedbacks(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const feedbacks = await customerService.getCustomerFeedbacks(id, userDealerId);
      return ResponseUtil.success(res, feedbacks, 'Customer feedbacks retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get customer complaints
   */
  async getCustomerComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const complaints = await customerService.getCustomerComplaints(id, userDealerId);
      return ResponseUtil.success(res, complaints, 'Customer complaints retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userDealerId = req.user?.dealerId;

      const stats = await customerService.getCustomerStatistics(id, userDealerId);
      return ResponseUtil.success(res, stats, 'Customer statistics retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Customer not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return ResponseUtil.badRequest(res, 'Search query is required');
      }

      const userDealerId = req.user?.dealerId;
      const customers = await customerService.searchCustomers(query, userDealerId);
      return ResponseUtil.success(res, customers, 'Search results retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get customers by status
   */
  async getCustomersByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userDealerId = req.user?.dealerId;
      const statusCounts = await customerService.getCustomersByStatus(userDealerId);
      return ResponseUtil.success(res, statusCounts, 'Customer status summary retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }
}