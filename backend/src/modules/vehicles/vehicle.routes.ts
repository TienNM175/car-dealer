import { Router } from "express";
import { VehicleController } from "./vehicle.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { uploadMiddleware } from "../../middlewares/upload.middleware";

const router = Router();
const vehicleController = new VehicleController();

/**
 * @route   GET /api/v1/vehicles
 * @desc    Get all vehicles with filters and pagination
 * @access  Public
 */
router.get("/", vehicleController.getAllVehicles);

/**
 * @route   GET /api/v1/vehicles/dealer/:dealerId
 * @desc    Get vehicles available in dealer inventory
 * @access  Private - Dealer Staff and above
 */
router.get(
  "/dealer/:dealerId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  RoleMiddleware.requireSameDealer,
  vehicleController.getDealerVehicles
);

/**
 * @route   POST /api/v1/vehicles/compare
 * @desc    Compare multiple vehicles
 * @access  Public
 */
router.post("/compare", vehicleController.compareVehicles);

/**
 * @route   GET /api/v1/vehicles/manufacturers
 * @desc    Get all manufacturers
 * @access  Public
 */
router.get("/manufacturers", vehicleController.getAllManufacturers);

/**
 * @route   GET /api/v1/vehicles/manufacturer/:manufacturerId
 * @desc    Get vehicles by manufacturer
 * @access  Public
 */
router.get(
  "/manufacturer/:manufacturerId",
  vehicleController.getVehiclesByManufacturer
);

/**
 * @route   GET /api/v1/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Public
 */
router.get("/:id", vehicleController.getVehicleById);

/**
 * @route   POST /api/v1/vehicles
 * @desc    Create new vehicle
 * @access  Private - EVM Staff, Admin
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.createVehicle
);

/**
 * @route   PUT /api/v1/vehicles/:id
 * @desc    Update vehicle
 * @access  Private - EVM Staff, Admin
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.updateVehicle
);

/**
 * @route   PATCH /api/v1/vehicles/:id/status
 * @desc    Update vehicle status
 * @access  Private - EVM Staff, Admin
 */
router.patch(
  "/:id/status",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.updateVehicleStatus
);

/**
 * @route   DELETE /api/v1/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private - EVM Staff, Admin
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.deleteVehicle
);

// IMAGE UPLOAD ROUTES
router.post(
  "/:id/images",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  uploadMiddleware.array("images", 10),
  vehicleController.uploadImages
);

router.delete(
  "/:vehicleId/images/:imageId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.deleteImage
);

router.patch(
  "/:vehicleId/images/:imageId/main",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.setMainImage
);

router.put(
  "/:vehicleId/images/reorder",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.reorderImages
);
export default router;
