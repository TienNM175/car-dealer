import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service';
import { ResponseUtil } from '../../utils/response.util';

const customerService = new CustomerService();

export class CustomerController {
  /**
   * Get all customers
   */
  async getAllCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as any,
        city: req.query.city as string,
        dealerId: req.query.dealerId as string,
        hasContract: req.query.hasContract === 'true',
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await customerService.getAllCustomers(filters, pagination, req.user?.userId);
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
   */
  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);
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
   */
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.createCustomer(req.body, req.user?.userId);
      return ResponseUtil.created(res, customer, 'Customer created successfully');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return ResponseUtil.conflict(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await customerService.updateCustomer(id, req.body, req.user?.userId);
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
   */
  async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await customerService.deleteCustomer(id);
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
      const lifecycle = await customerService.getCustomerLifecycle(id);
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
      const lifecycleData = {
        customerId: id,
        status: req.body.status,
        notes: req.body.notes,
        changedBy: req.user?.userId || '',
      };

      const lifecycle = await customerService.addLifecycleEvent(lifecycleData);
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
      const contracts = await customerService.getCustomerContracts(id);
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
      const testDrives = await customerService.getCustomerTestDrives(id);
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
      const quotations = await customerService.getCustomerQuotations(id);
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
      const feedbacks = await customerService.getCustomerFeedbacks(id);
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
      const complaints = await customerService.getCustomerComplaints(id);
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
      const stats = await customerService.getCustomerStatistics(id);
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

      const customers = await customerService.searchCustomers(query);
      return ResponseUtil.success(res, customers, 'Search results retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get customers by status
   */
  async getCustomersByStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const statusCounts = await customerService.getCustomersByStatus();
      return ResponseUtil.success(res, statusCounts, 'Customer status summary retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }
}
