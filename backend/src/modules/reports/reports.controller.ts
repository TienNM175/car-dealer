import { Request, Response, NextFunction } from "express";
import { ReportsService } from "./reports.service";
import { ResponseUtil } from "../../utils/response.util";

const reportsService = new ReportsService();

export class ReportsController {
  /**
   * Get dashboard overview
   */
  async getDashboardOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
        dealerId: req.query.dealerId as string,
      };

      const overview = await reportsService.getDashboardOverview(filters);
      return ResponseUtil.success(
        res,
        overview,
        "Dashboard overview retrieved successfully"
      );
    } catch (error: any) {
      return next(error); // ✅ thêm return
    }
  }

  /**
   * Get sales report
   */
  async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
        dealerId: req.query.dealerId as string,
      };

      const report = await reportsService.getSalesReport(filters);
      return ResponseUtil.success(
        res,
        report,
        "Sales report retrieved successfully"
      );
    } catch (error: any) {
      return next(error); // ✅
    }
  }

  /**
   * Get customer report
   */
  async getCustomerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
        dealerId: req.query.dealerId as string,
      };

      const report = await reportsService.getCustomerReport(filters);
      return ResponseUtil.success(
        res,
        report,
        "Customer report retrieved successfully"
      );
    } catch (error: any) {
      return next(error); // ✅
    }
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const dealerId = req.query.dealerId as string;
      const report = await reportsService.getInventoryReport(dealerId);
      return ResponseUtil.success(
        res,
        report,
        "Inventory report retrieved successfully"
      );
    } catch (error: any) {
      return next(error); // ✅
    }
  }

  /**
   * Get dealer performance report
   */
  async getDealerPerformanceReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters = {
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      };

      const report = await reportsService.getDealerPerformanceReport(filters);
      return ResponseUtil.success(
        res,
        report,
        "Dealer performance report retrieved successfully"
      );
    } catch (error: any) {
      return next(error); // ✅
    }
  }

  /**
   * Get vehicles by dealer report
   */
  async getVehiclesByDealerReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters = {
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      };

      const report = await reportsService.getVehiclesByDealerReport(filters);
      return ResponseUtil.success(
        res,
        report,
        "Vehicles by dealer report retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get vehicle detail report
   */
  async getVehicleDetailReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { vehicleId } = req.params;
      const filters = {
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      };

      const report = await reportsService.getVehicleDetailReport(
        vehicleId,
        filters
      );
      return ResponseUtil.success(
        res,
        report,
        "Vehicle detail report retrieved successfully"
      );
    } catch (error: any) {
      if (error.message === "Vehicle not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Get executive summary
   */
  async getExecutiveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      };

      const summary = await reportsService.getExecutiveSummary(filters);
      return ResponseUtil.success(
        res,
        summary,
        "Executive summary retrieved successfully"
      );
    } catch (error: any) {
      return next(error); // ✅
    }
  }
}
