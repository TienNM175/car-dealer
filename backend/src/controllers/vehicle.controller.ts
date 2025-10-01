import type { Request, Response } from "express";
import { VehicleService } from "../services/vehicle.service";
import { z } from "zod";

// Validation schemas
const GetVehiclesQuerySchema = z.object({
  manufacturerId: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  color: z
    .enum([
      "BLACK",
      "WHITE",
      "SILVER",
      "GREY",
      "RED",
      "BLUE",
      "GREEN",
      "YELLOW",
      "ORANGE",
      "BROWN",
      "GOLD",
      "BEIGE",
      "OTHER",
    ])
    .optional(),
  bodyType: z
    .enum([
      "SEDAN",
      "SUV",
      "HATCHBACK",
      "COUPE",
      "WAGON",
      "VAN",
      "TRUCK",
      "OTHER",
    ])
    .optional(),
  year: z.string().transform(Number).optional(),
  minRange: z.string().transform(Number).optional(),
  search: z.string().optional(),
});

const CreateVehicleSchema = z.object({
  manufacturerId: z.string(),
  model: z.string().min(1),
  variant: z.string().optional(),
  year: z.number().int().min(2020).max(2030),
  batteryCapacity: z.number().int().positive(),
  range: z.number().int().positive(),
  chargingTime: z.number().int().positive().optional(),
  motorPower: z.number().int().positive().optional(),
  topSpeed: z.number().int().positive().optional(),
  acceleration: z.number().positive().optional(),
  seats: z.number().int().min(2).max(9).optional(),
  doors: z.number().int().min(2).max(5).optional(),
  color: z.enum([
    "BLACK",
    "WHITE",
    "SILVER",
    "GREY",
    "RED",
    "BLUE",
    "GREEN",
    "YELLOW",
    "ORANGE",
    "BROWN",
    "GOLD",
    "BEIGE",
    "OTHER",
  ]),
  bodyType: z.enum([
    "SEDAN",
    "SUV",
    "HATCHBACK",
    "COUPE",
    "WAGON",
    "VAN",
    "TRUCK",
    "OTHER",
  ]),
  wholesalePrice: z.number().positive(),
  retailPrice: z.number().positive(),
  currency: z.enum(["USD", "EUR", "GBP", "VND"]).optional(),
  description: z.string().optional(),
  specifications: z.string().optional(),
});

const CompareVehiclesSchema = z.object({
  vehicleIds: z.array(z.string()).min(2).max(5), // So sánh 2-5 xe
});

export class VehicleController {
  /**
   * GET /api/vehicles
   * Lấy danh sách xe điện với filters
   */
  static async getVehicles(req: Request, res: Response) {
    try {
      const filters = GetVehiclesQuerySchema.parse(req.query);
      const vehicles = await VehicleService.getVehicles(filters);

      res.json({
        success: true,
        data: vehicles,
        total: vehicles.length,
      });
    } catch (error: any) {
      console.error("Get vehicles error:", error);
      res.status(400).json({
        error: "Failed to get vehicles",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/vehicles/:id
   * Lấy chi tiết xe điện
   */
  static async getVehicleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicle = await VehicleService.getVehicleById(id);

      res.json({
        success: true,
        data: vehicle,
      });
    } catch (error: any) {
      console.error("Get vehicle by ID error:", error);
      res.status(404).json({
        error: "Vehicle not found",
        message: error.message,
      });
    }
  }

  /**
   * POST /api/vehicles/compare
   * So sánh nhiều xe điện
   */
  static async compareVehicles(req: Request, res: Response) {
    try {
      const { vehicleIds } = CompareVehiclesSchema.parse(req.body);
      const comparison = await VehicleService.compareVehicles(vehicleIds);

      res.json({
        success: true,
        data: comparison,
        count: comparison.length,
      });
    } catch (error: any) {
      console.error("Compare vehicles error:", error);
      res.status(400).json({
        error: "Failed to compare vehicles",
        message: error.message,
      });
    }
  }

  /**
   * POST /api/vehicles
   * Tạo xe điện mới (chỉ EVM Staff & Admin)
   */
  static async createVehicle(req: Request, res: Response) {
    try {
      const data = CreateVehicleSchema.parse(req.body);
      const vehicle = await VehicleService.createVehicle(data);

      res.status(201).json({
        success: true,
        data: vehicle,
        message: "Vehicle created successfully",
      });
    } catch (error: any) {
      console.error("Create vehicle error:", error);
      res.status(400).json({
        error: "Failed to create vehicle",
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/vehicles/:id
   * Update thông tin xe (chỉ EVM Staff & Admin)
   */
  static async updateVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = CreateVehicleSchema.partial().parse(req.body);
      const vehicle = await VehicleService.updateVehicle(id, data);

      res.json({
        success: true,
        data: vehicle,
        message: "Vehicle updated successfully",
      });
    } catch (error: any) {
      console.error("Update vehicle error:", error);
      res.status(400).json({
        error: "Failed to update vehicle",
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/vehicles/:id
   * Xóa xe (soft delete - chỉ Admin)
   */
  static async deleteVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicle = await VehicleService.deleteVehicle(id);

      res.json({
        success: true,
        data: vehicle,
        message: "Vehicle deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete vehicle error:", error);
      res.status(400).json({
        error: "Failed to delete vehicle",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/manufacturers
   * Lấy danh sách hãng xe
   */
  static async getManufacturers(req: Request, res: Response) {
    try {
      const manufacturers = await VehicleService.getManufacturers();

      res.json({
        success: true,
        data: manufacturers,
      });
    } catch (error: any) {
      console.error("Get manufacturers error:", error);
      res.status(400).json({
        error: "Failed to get manufacturers",
        message: error.message,
      });
    }
  }

  /**
   * GET /api/manufacturers/:id/vehicles
   * Lấy vehicles theo manufacturer
   */
  static async getVehiclesByManufacturer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicles = await VehicleService.getVehiclesByManufacturer(id);

      res.json({
        success: true,
        data: vehicles,
        total: vehicles.length,
      });
    } catch (error: any) {
      console.error("Get vehicles by manufacturer error:", error);
      res.status(400).json({
        error: "Failed to get vehicles",
        message: error.message,
      });
    }
  }
}
