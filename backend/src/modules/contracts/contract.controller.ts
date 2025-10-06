import { Request, Response, NextFunction } from 'express';
import { ContractService } from './contract.service';
import { ResponseUtil } from '../../utils/response.util';

const contractService = new ContractService();

export class ContractController {
  /**
   * Get all contracts
   */
  async getAllContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        staffId: req.query.staffId as string,
        dealerId: req.query.dealerId as string,
        paymentType: req.query.paymentType as any,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await contractService.getAllContracts(
        filters,
        pagination,
        req.user?.userId,
        req.user?.role,
        req.user?.dealerId
      );
      
      return ResponseUtil.success(
        res,
        result.data,
        'Contracts retrieved successfully',
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get contract by ID
   */
  async getContractById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contract = await contractService.getContractById(id);
      return ResponseUtil.success(res, contract, 'Contract retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Contract not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Create contract
   */
  async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await contractService.createContract(req.body, req.user?.userId || '');
      return ResponseUtil.created(res, contract, 'Contract created successfully');
    } catch (error: any) {
      if (
        error.message.includes('not found') ||
        error.message.includes('not available') ||
        error.message.includes('is required')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update contract
   */
  async updateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contract = await contractService.updateContract(id, req.body);
      return ResponseUtil.success(res, contract, 'Contract updated successfully');
    } catch (error: any) {
      if (error.message === 'Contract not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Can only update')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update contract status
   */
  async updateContractStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const contract = await contractService.updateContractStatus(
        id,
        status,
        req.user?.userId || ''
      );
      
      return ResponseUtil.success(res, contract, 'Contract status updated successfully');
    } catch (error: any) {
      if (error.message === 'Contract not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot transition')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Delete contract
   */
  async deleteContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await contractService.deleteContract(id);
      return ResponseUtil.success(res, result);
    } catch (error: any) {
      if (error.message === 'Contract not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Can only delete')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        dealerId: req.query.dealerId as string,
        staffId: req.query.staffId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const stats = await contractService.getContractStatistics(filters);
      return ResponseUtil.success(res, stats, 'Contract statistics retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get contracts by status
   */
  async getContractsByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const dealerId = req.query.dealerId as string;
      const statusCounts = await contractService.getContractsByStatus(dealerId);
      return ResponseUtil.success(res, statusCounts, 'Contract status summary retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }
}
