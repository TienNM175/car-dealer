import { Router } from "express";
import { DealerController } from "./dealer.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  createDealerValidation,
  updateDealerValidation,
  dealerIdValidation,
  addStaffValidation,
  updateStaffValidation,
  staffIdValidation,
  setTargetValidation,
} from "./dealer.validation";

const router = Router();
const dealerController = new DealerController();

// ============================================
// REGION ROUTES
// ============================================

/**
 * @route   GET /api/v1/dealers/regions
 * @desc    Get all regions
 * @access  Private - All authenticated users
 */
router.get(
  "/regions",
  AuthMiddleware.authenticate,
  dealerController.getAllRegions
);

// ============================================
// DEALER CRUD
// ============================================

/**
 * @swagger
 * /api/v1/dealers:
 *   get:
 *     summary: Get all dealers with filters and pagination
 *     tags: [Dealers]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: List of dealers
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
 *                     dealers:
 *                       type: array
 */
router.get("/", AuthMiddleware.authenticate, dealerController.getAllDealers);

/**
 * @swagger
 * /api/v1/dealers/{id}:
 *   get:
 *     summary: Get dealer by ID
 *     tags: [Dealers]
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
 *         description: Dealer details
 *       404:
 *         description: Dealer not found
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.getDealerById
);

/**
 * @swagger
 * /api/v1/dealers:
 *   post:
 *     summary: Create new dealer
 *     tags: [Dealers]
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
 *               - regionId
 *             properties:
 *               name:
 *                 type: string
 *               regionId:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dealer created successfully
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  createDealerValidation,
  ValidationMiddleware.validate,
  dealerController.createDealer
);

/**
 * @route   PUT /api/v1/dealers/:id
 * @desc    Update dealer
 * @access  Private - EVM Staff, Admin
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  updateDealerValidation,
  ValidationMiddleware.validate,
  dealerController.updateDealer
);

/**
 * @route   DELETE /api/v1/dealers/:id
 * @desc    Delete dealer
 * @access  Private - Admin only
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireAdmin,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.deleteDealer
);

// ============================================
// DEALER STAFF MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/dealers/:id/staff
 * @desc    Get dealer staff
 * @access  Private - Dealer Manager (own dealer), EVM Staff, Admin
 */
router.get(
  "/:id/staff",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.getDealerStaff
);

/**
 * @route   POST /api/v1/dealers/:id/staff
 * @desc    Add staff to dealer
 * @access  Private - Dealer Manager (own dealer), EVM Staff, Admin
 */
router.post(
  "/:id/staff",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  addStaffValidation,
  ValidationMiddleware.validate,
  dealerController.addStaff
);

/**
 * @route   PUT /api/v1/dealers/:id/staff/:staffId
 * @desc    Update staff
 * @access  Private - Dealer Manager (own dealer), EVM Staff, Admin
 */
router.put(
  "/:id/staff/:staffId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  updateStaffValidation,
  ValidationMiddleware.validate,
  dealerController.updateStaff
);

/**
 * @route   DELETE /api/v1/dealers/:id/staff/:staffId
 * @desc    Remove staff from dealer
 * @access  Private - Dealer Manager (own dealer), EVM Staff, Admin
 */
router.delete(
  "/:id/staff/:staffId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  staffIdValidation,
  ValidationMiddleware.validate,
  dealerController.removeStaff
);

// ============================================
// DEALER OPERATIONS
// ============================================

/**
 * @route   GET /api/v1/dealers/:id/inventory
 * @desc    Get dealer inventory
 * @access  Private - Dealer Staff (own dealer), EVM Staff, Admin
 */
router.get(
  "/:id/inventory",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.getDealerInventory
);

/**
 * @route   GET /api/v1/dealers/:id/orders
 * @desc    Get dealer orders
 * @access  Private - Dealer Staff (own dealer), EVM Staff, Admin
 */
router.get(
  "/:id/orders",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.getDealerOrders
);

/**
 * @route   GET /api/v1/dealers/:id/sales-stats
 * @desc    Get dealer sales statistics
 * @access  Private - Dealer Manager (own dealer), EVM Staff, Admin
 */
router.get(
  "/:id/sales-stats",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.getDealerSalesStats
);

// ============================================
// DEALER TARGETS
// ============================================

/**
 * @route   GET /api/v1/dealers/:id/targets
 * @desc    Get dealer targets
 * @access  Private - Dealer Manager (own dealer), EVM Staff, Admin
 */
router.get(
  "/:id/targets",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.getDealerTargets
);

/**
 * @route   POST /api/v1/dealers/:id/targets
 * @desc    Set dealer target
 * @access  Private - EVM Staff, Admin
 */
router.post(
  "/:id/targets",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  setTargetValidation,
  ValidationMiddleware.validate,
  dealerController.setDealerTarget
);

export default router;
