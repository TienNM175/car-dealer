import { Request, Response, NextFunction } from "express";
import { DebtsService } from "./debts.service";
import { ResponseUtil } from "../../utils/response.util";

const debtsService = new DebtsService();

export class DebtsController {
  /**
   * Get customer debts report
   */
  async getCustomerDebts(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🎯 DebtsController.getCustomerDebts called");
      console.log("🔍 Query params:", req.query);
      console.log("👤 User:", req.user);

      const filters = {
        dealerId: req.query.dealerId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      console.log("📋 Filters:", filters);

      const report = await debtsService.getCustomerInstallmentDebts(filters.dealerId, filters);
      
      console.log("✅ Report data retrieved successfully");
      console.log("📊 Report summary:", report.summary);
      
      return ResponseUtil.success(res, report, "Customer debts report retrieved successfully");
    } catch (error: any) {
      console.error("❌ Error in getCustomerDebts:", error);
      return next(error);
    }
  }

  /**
   * Get dealer debts report
   */
  async getDealerDebts(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🎯 DebtsController.getDealerDebts called");

      const filters = {
        dealerId: req.query.dealerId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const report = await debtsService.getDealerOrderDebts(filters.dealerId, filters);
      return ResponseUtil.success(res, report, "Dealer debts report retrieved successfully");
    } catch (error: any) {
      console.error("❌ Error in getDealerDebts:", error);
      return next(error);
    }
  }

  /**
   * Get debt overview
   */
  async getDebtOverview(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🎯 DebtsController.getDebtOverview called");

      const filters = {
        dealerId: req.query.dealerId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const overview = await debtsService.getDebtOverview(filters);
      return ResponseUtil.success(res, overview, "Debt overview retrieved successfully");
    } catch (error: any) {
      console.error("❌ Error in getDebtOverview:", error);
      return next(error);
    }
  }

  async getDealerDebtsDetail(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("🎯 DebtsController.getDealerDebtsDetail called");

      const filters = {
        dealerId: req.query.dealerId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      };

      const report = await debtsService.getDealerDebtsDetail(filters.dealerId, filters);
      return ResponseUtil.success(res, report, "Detailed dealer debts retrieved successfully");
    } catch (error: any) {
      console.error("❌ Error in getDealerDebtsDetail:", error);
      return next(error);
    }
  }
}