import { Router } from "express";
import { VehicleController } from "./vehicle.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { uploadMiddleware } from "../../middlewares/upload.middleware";

const router = Router();
const vehicleController = new VehicleController();

/**
 * @swagger
 * /api/v1/vehicles:
 *   get:
 *     summary: Get all vehicles with filters and pagination
 *     tags: [Vehicles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: manufacturerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vehicle'
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
 * @swagger
 * /api/v1/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
 */
router.get("/:id", vehicleController.getVehicleById);

/**
 * @swagger
 * /api/v1/vehicles:
 *   post:
 *     summary: Create new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - manufacturerId
 *               - model
 *               - year
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 example: Toyota Camry 2024
 *               manufacturerId:
 *                 type: string
 *               model:
 *                 type: string
 *                 example: Camry
 *               year:
 *                 type: number
 *                 example: 2024
 *               price:
 *                 type: number
 *                 example: 1000000000
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.createVehicle
);

/**
 * @swagger
 * /api/v1/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, DISCONTINUED]
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
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
 * @swagger
 * /api/v1/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       404:
 *         description: Vehicle not found
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
