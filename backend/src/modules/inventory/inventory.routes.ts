import { Router } from "express";
import { InventoryController } from "./inventory.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  updateEVMInventoryValidation,
  updateDealerInventoryValidation,
  transferInventoryValidation,
} from "./inventory.validation";

const router = Router();
const inventoryController = new InventoryController();

// ============================================
// EVM INVENTORY ROUTES
// ============================================

/**
 * @swagger
 * /api/v1/inventory/evm:
 *   get:
 *     summary: Get EVM (Manufacturer) inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: EVM inventory list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get(
  "/evm",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  inventoryController.getEVMInventory
);

/**
 * @swagger
 * /api/v1/inventory/evm/vehicle/{vehicleId}:
 *   get:
 *     summary: Get EVM inventory for specific vehicle
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: EVM inventory for vehicle
 *       404:
 *         description: Vehicle not found
 */
router.get(
  "/evm/vehicle/:vehicleId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  inventoryController.getEVMInventoryByVehicle
);

/**
 * @swagger
 * /api/v1/inventory/evm/{vehicleId}:
 *   put:
 *     summary: Update EVM inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: EVM inventory updated successfully
 */
router.put(
  "/evm/:vehicleId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  updateEVMInventoryValidation,
  ValidationMiddleware.validate,
  inventoryController.updateEVMInventory
);

// ============================================
// DEALER INVENTORY ROUTES
// ============================================

/**
 * @swagger
 * /api/v1/inventory/dealers:
 *   get:
 *     summary: Get all dealer inventories
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dealerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of all dealer inventories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get(
  "/dealers",
  AuthMiddleware.authenticate,
  inventoryController.getAllDealerInventories
);

/**
 * @swagger
 * /api/v1/inventory/dealers/{dealerId}:
 *   get:
 *     summary: Get inventory for specific dealer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dealer inventory
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       403:
 *         description: Access denied - can only view own dealer inventory
 */
router.get(
  "/dealers/:dealerId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireSameDealer,
  inventoryController.getDealerInventory
);

/**
 * @swagger
 * /api/v1/inventory/dealers/{dealerId}/vehicle/{vehicleId}:
 *   get:
 *     summary: Get specific dealer inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dealer inventory item details
 *       404:
 *         description: Inventory item not found
 */
router.get(
  "/dealers/:dealerId/vehicle/:vehicleId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireSameDealer,
  inventoryController.getDealerInventoryItem
);

/**
 * @swagger
 * /api/v1/inventory/dealers/{dealerId}/{vehicleId}:
 *   put:
 *     summary: Update dealer inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: vehicleId
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
 *               quantity:
 *                 type: number
 *                 example: 5
 *               reservedQuantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Dealer inventory updated successfully
 */
router.put(
  "/dealers/:dealerId/:vehicleId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireSameDealer,
  updateDealerInventoryValidation,
  ValidationMiddleware.validate,
  inventoryController.updateDealerInventory
);

// ============================================
// REPORTS & ALERTS
// ============================================

/**
 * @swagger
 * /api/v1/inventory/low-stock:
 *   get:
 *     summary: Get low stock alerts
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Minimum quantity threshold
 *     responses:
 *       200:
 *         description: Low stock alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get(
  "/low-stock",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole("ADMIN", "EVM_STAFF", "DEALER_MANAGER"),
  inventoryController.getLowStockAlerts
);

/**
 * @swagger
 * /api/v1/inventory/summary:
 *   get:
 *     summary: Get inventory summary/statistics
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary and statistics
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
 *                     totalVehicles:
 *                       type: number
 *                     totalQuantity:
 *                       type: number
 *                     lowStockCount:
 *                       type: number
 */
router.get(
  "/summary",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  inventoryController.getInventorySummary
);

/**
 * @swagger
 * /api/v1/inventory/transfer:
 *   post:
 *     summary: Transfer inventory from EVM to dealer
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - dealerId
 *               - quantity
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: uuid
 *               dealerId:
 *                 type: string
 *                 example: uuid
 *               quantity:
 *                 type: number
 *                 example: 5
 *     responses:
 *       200:
 *         description: Inventory transferred successfully
 *       400:
 *         description: Insufficient inventory or validation error
 */
router.post(
  "/transfer",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  transferInventoryValidation,
  ValidationMiddleware.validate,
  inventoryController.transferInventory
);

export default router;
