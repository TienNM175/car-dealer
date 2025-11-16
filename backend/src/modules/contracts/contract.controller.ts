import { Request, Response, NextFunction } from "express";
import { ContractService } from "./contract.service";
import { ResponseUtil } from "../../utils/response.util";

const contractService = new ContractService();

export class ContractController {
  /**
   * Get all contracts
   */
  async getAllContracts(req: Request, res: Response, next: NextFunction) {
    try {
      // Backend auto-determines dealerId from auth user
      // ADMIN/EVM can specify dealerId via query, or see all if not specified
      // DEALER roles automatically filtered by their dealerId
      const userDealerId = req.user?.dealerId;
      const isAdmin =
        req.user?.role === "ADMIN" || req.user?.role === "EVM_STAFF";
      const queryDealerId = req.query.dealerId as string;

      const filters = {
        search: req.query.search as string,
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        staffId: req.query.staffId as string,
        // Use dealerId from query only if admin, otherwise use user's dealerId
        dealerId: isAdmin ? queryDealerId : userDealerId,
        paymentType: req.query.paymentType as any,
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const result = await contractService.getAllContracts(
        filters,
        pagination,
        req.user?.userId,
        req.user?.role,
        userDealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        "Contracts retrieved successfully",
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
      const contract = await contractService.getContractById(
        id,
        req.user?.dealerId,
        req.user?.role
      );
      return ResponseUtil.success(
        res,
        contract,
        "Contract retrieved successfully"
      );
    } catch (error: any) {
      if (error.message === "Contract not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("can only access")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  /**
   * Create contract
   */
  async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await contractService.createContract(
        req.body,
        req.user?.userId || ""
      );
      return ResponseUtil.created(
        res,
        contract,
        "Contract created successfully"
      );
    } catch (error: any) {
      const message = error.message?.toLowerCase?.() || "";
      if (
        message.includes("not found") ||
        message.includes("not available") ||
        message.includes("is required") ||
        message.includes("vehicle unit")
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
      const contract = await contractService.updateContract(
        id,
        req.body,
        req.user?.dealerId,
        req.user?.role
      );
      return ResponseUtil.success(
        res,
        contract,
        "Contract updated successfully"
      );
    } catch (error: any) {
      if (error.message === "Contract not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Can only update")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes("can only update")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  async assignVehicleUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { vehicleUnitId } = req.body as {
        vehicleUnitId?: string | null;
      };

      const contract = await contractService.assignVehicleUnit(
        id,
        vehicleUnitId ?? null,
        req.user?.userId || "",
        req.user?.dealerId,
        req.user?.role
      );

      return ResponseUtil.success(
        res,
        contract,
        vehicleUnitId
          ? "Vehicle unit assigned successfully"
          : "Vehicle unit released successfully"
      );
    } catch (error: any) {
      if (error.message === "Contract not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("vehicle unit")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (error.message.includes("only assign")) {
        return ResponseUtil.forbidden(res, error.message);
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
        req.user?.userId || "",
        req.user?.dealerId,
        req.user?.role
      );

      return ResponseUtil.success(
        res,
        contract,
        "Contract status updated successfully"
      );
    } catch (error: any) {
      if (error.message === "Contract not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Cannot transition")) {
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
      if (error.message === "Contract not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("Can only delete")) {
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
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      };

      const stats = await contractService.getContractStatistics(filters);
      return ResponseUtil.success(
        res,
        stats,
        "Contract statistics retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get contracts by status
   */
  async getContractsByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // Use dealerId from auth user for DEALER roles
      const userDealerId = req.user?.dealerId;
      const isAdmin =
        req.user?.role === "ADMIN" || req.user?.role === "EVM_STAFF";
      const queryDealerId = req.query.dealerId as string;

      const dealerId = isAdmin ? queryDealerId : userDealerId;
      const statusCounts = await contractService.getContractsByStatus(dealerId);
      return ResponseUtil.success(
        res,
        statusCounts,
        "Contract status summary retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Get contract statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      // Use dealerId from auth user for DEALER roles
      const userDealerId = req.user?.dealerId;
      const isAdmin =
        req.user?.role === "ADMIN" || req.user?.role === "EVM_STAFF";
      const queryDealerId = req.query.dealerId as string;

      const filters = {
        dealerId: isAdmin ? queryDealerId : userDealerId,
        staffId: req.query.staffId as string,
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
      };

      const statistics = await contractService.getContractStatistics(filters);
      return ResponseUtil.success(
        res,
        statistics,
        "Contract statistics retrieved successfully"
      );
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Create SALES contract from DEPOSIT contract
   */
  async createSalesFromDeposit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // depositContractId
      const contract = await contractService.createSalesFromDeposit(
        id,
        req.body,
        req.user?.userId || "",
        req.user?.dealerId,
        req.user?.role
      );
      return ResponseUtil.created(
        res,
        contract,
        "Sales contract created from deposit contract successfully"
      );
    } catch (error: any) {
      const message = error.message?.toLowerCase?.() || "";
      if (
        message.includes("not found") ||
        message.includes("not a deposit") ||
        message.includes("does not have deposit")
      ) {
        return ResponseUtil.badRequest(res, error.message);
      }
      if (message.includes("can only create")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }
}
