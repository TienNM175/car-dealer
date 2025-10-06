import { Request, Response, NextFunction } from 'express';
import { TestDriveService } from './test-drive.service';
import { ResponseUtil } from '../../utils/response.util';

const testDriveService = new TestDriveService();

export class TestDriveController {
  /**
   * Get all test drives
   */
  async getAllTestDrives(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        customerId: req.query.customerId as string,
        vehicleId: req.query.vehicleId as string,
        staffId: req.query.staffId as string,
        dealerId: req.query.dealerId as string,
        status: req.query.status as any,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await testDriveService.getAllTestDrives(
        filters,
        pagination,
        req.user?.role,
        req.user?.dealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        'Test drives retrieved successfully',
        200,
        result.meta
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get test drive by ID
   */
  async getTestDriveById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const testDrive = await testDriveService.getTestDriveById(id);
      return ResponseUtil.success(res, testDrive, 'Test drive retrieved successfully');
    } catch (error: any) {
      if (error.message === 'Test drive not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Create test drive
   */
  async createTestDrive(req: Request, res: Response, next: NextFunction) {
    try {
      const testDrive = await testDriveService.createTestDrive(req.body, req.user?.userId || '');
      return ResponseUtil.created(res, testDrive, 'Test drive created successfully');
    } catch (error: any) {
      if (
        error.message.includes('not found') ||
        error.message.includes('not available') ||
        error.message.includes('must be') ||
        error.message.includes('already has')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update test drive
   */
  async updateTestDrive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const testDrive = await testDriveService.updateTestDrive(id, req.body);
      return ResponseUtil.success(res, testDrive, 'Test drive updated successfully');
    } catch (error: any) {
      if (error.message === 'Test drive not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (
        error.message.includes('Can only update') ||
        error.message.includes('must be') ||
        error.message.includes('already has')
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Update test drive status
   */
  async updateTestDriveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;

      const testDrive = await testDriveService.updateTestDriveStatus(id, status, feedback);
      return ResponseUtil.success(res, testDrive, 'Test drive status updated successfully');
    } catch (error: any) {
      if (error.message === 'Test drive not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot transition') || error.message.includes('required')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Cancel test drive
   */
  async cancelTestDrive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const testDrive = await testDriveService.cancelTestDrive(id, reason);
      return ResponseUtil.success(res, testDrive, 'Test drive cancelled successfully');
    } catch (error: any) {
      if (error.message === 'Test drive not found') {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes('Cannot cancel') || error.message.includes('already cancelled')) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get test drive statistics
   */
  async getTestDriveStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        dealerId: req.query.dealerId as string,
        staffId: req.query.staffId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const stats = await testDriveService.getTestDriveStatistics(filters);
      return ResponseUtil.success(res, stats, 'Test drive statistics retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get test drives by status
   */
  async getTestDrivesByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const dealerId = req.query.dealerId as string;
      const statusCounts = await testDriveService.getTestDrivesByStatus(dealerId);
      return ResponseUtil.success(
        res,
        statusCounts,
        'Test drive status summary retrieved successfully'
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get upcoming test drives
   */
  async getUpcomingTestDrives(req: Request, res: Response, next: NextFunction) {
    try {
      const dealerId = req.query.dealerId as string;
      const staffId = req.query.staffId as string;
      
      const testDrives = await testDriveService.getUpcomingTestDrives(dealerId, staffId);
      return ResponseUtil.success(res, testDrives, 'Upcoming test drives retrieved successfully');
    } catch (error: any) {
      return next(error);
    }
  }
}
