import { Request, Response, NextFunction } from "express";
import { VehicleUnitService } from "./vehicle-unit.service";
import { ResponseUtil } from "../../utils/response.util";
import {
  VehicleUnitStatus,
  VehicleUnitStorageType,
} from "@prisma/client";

const vehicleUnitService = new VehicleUnitService();

export class VehicleUnitController {
  async getVehicleUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const statusQuery = req.query.status as string | undefined;
      let statusFilter: VehicleUnitStatus | VehicleUnitStatus[] | undefined;
      if (statusQuery) {
        statusFilter = statusQuery.includes(",")
          ? (statusQuery.split(",") as VehicleUnitStatus[])
          : (statusQuery as VehicleUnitStatus);
      }
      const filters = {
        search: req.query.search as string,
        vehicleId: req.query.vehicleId as string,
        dealerId: req.query.dealerId as string,
        status: statusFilter,
        storageType: req.query.storageType as VehicleUnitStorageType,
      };

      const pagination = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as "asc" | "desc",
      };

      const result = await vehicleUnitService.listVehicleUnits(
        filters,
        pagination,
        req.user?.role,
        req.user?.dealerId
      );

      return ResponseUtil.success(
        res,
        result.data,
        "Vehicle units retrieved successfully",
        200,
        result.meta
      );
    } catch (error) {
      return next(error);
    }
  }

  async getVehicleUnitById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicleUnit = await vehicleUnitService.getVehicleUnitById(
        id,
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.success(
        res,
        vehicleUnit,
        "Vehicle unit retrieved successfully"
      );
    } catch (error: any) {
      if (error.message === "Vehicle unit not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("only access")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      return next(error);
    }
  }

  async createVehicleUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const vehicleUnit = await vehicleUnitService.createVehicleUnit(
        req.body,
        req.user?.userId || ""
      );
      return ResponseUtil.created(
        res,
        vehicleUnit,
        "Vehicle unit created successfully"
      );
    } catch (error: any) {
      if (error.message.includes("required") || error.message.includes("not")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  async updateVehicleUnit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const vehicleUnit = await vehicleUnitService.updateVehicleUnit(
        id,
        req.body,
        req.user?.userId || "",
        req.user?.role,
        req.user?.dealerId
      );
      return ResponseUtil.success(
        res,
        vehicleUnit,
        "Vehicle unit updated successfully"
      );
    } catch (error: any) {
      if (error.message === "Vehicle unit not found") {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message.includes("only update")) {
        return ResponseUtil.forbidden(res, error.message);
      }
      if (error.message.includes("Dealer not found")) {
        return ResponseUtil.badRequest(res, error.message);
      }
      return next(error);
    }
  }

  async getAvailableVehicleUnits(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { vehicleId } = req.query;
      const dealerId =
        (req.query.dealerId as string) || req.user?.dealerId || null;

      if (!dealerId) {
        return ResponseUtil.badRequest(
          res,
          "dealerId is required to fetch available vehicle units"
        );
      }
      const units = await vehicleUnitService.getAvailableUnits(
        vehicleId as string,
        dealerId
      );
      return ResponseUtil.success(
        res,
        units,
        "Available vehicle units retrieved successfully"
      );
    } catch (error) {
      return next(error);
    }
  }
}
