import express from "express";
import { VehicleController } from "../controllers/vehicle.controller";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();

// ============================================
// PUBLIC ROUTES (không cần auth)
// ============================================

/**
 * GET /api/vehicles
 * Lấy danh sách xe điện với filters
 * Query params:
 * - manufacturerId: string (optional)
 * - minPrice: number (optional)
 * - maxPrice: number (optional)
 * - color: VehicleColor (optional)
 * - bodyType: VehicleBodyType (optional)
 * - year: number (optional)
 * - minRange: number (optional)
 * - search: string (optional)
 */
router.get("/", VehicleController.getVehicles);

/**
 * GET /api/vehicles/:id
 * Lấy chi tiết xe điện theo ID
 */
router.get("/:id", VehicleController.getVehicleById);

/**
 * POST /api/vehicles/compare
 * So sánh nhiều xe điện
 * Body: { vehicleIds: string[] }
 */
router.post("/compare", VehicleController.compareVehicles);

/**
 * GET /api/manufacturers
 * Lấy danh sách hãng xe
 */
router.get("/manufacturers", VehicleController.getManufacturers);

/**
 * GET /api/manufacturers/:id/vehicles
 * Lấy vehicles theo manufacturer
 */
router.get(
  "/manufacturers/:id/vehicles",
  VehicleController.getVehiclesByManufacturer
);

// ============================================
// PROTECTED ROUTES (cần auth)
// ============================================

/**
 * POST /api/vehicles
 * Tạo xe điện mới
 * Chỉ EVM_STAFF và ADMIN
 */
router.post(
  "/",
  authenticateToken,
  requireRole(["EVM_STAFF", "ADMIN"]),
  VehicleController.createVehicle
);

/**
 * PUT /api/vehicles/:id
 * Update thông tin xe
 * Chỉ EVM_STAFF và ADMIN
 */
router.put(
  "/:id",
  authenticateToken,
  requireRole(["EVM_STAFF", "ADMIN"]),
  VehicleController.updateVehicle
);

/**
 * DELETE /api/vehicles/:id
 * Xóa xe (soft delete)
 * Chỉ ADMIN
 */
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["ADMIN"]),
  VehicleController.deleteVehicle
);

export default router;
