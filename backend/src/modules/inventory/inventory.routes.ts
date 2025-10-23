import { Router } from "express";
import { InventoryController } from "./inventory.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  updateEVMInventoryValidation,
  updateDealerInventoryValidation,
} from "./inventory.validation";

const router = Router();
const inventoryController = new InventoryController();

// ============================================
// EVM INVENTORY ROUTES
// ============================================

/**
 * @route   GET /api/v1/inventory/evm
 * @desc    Get EVM (Manufacturer) inventory
 * @access  Private - EVM Staff, Admin
 */
router.get(
  "/evm",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  inventoryController.getEVMInventory
);

/**
 * @route   GET /api/v1/inventory/evm/vehicle/:vehicleId
 * @desc    Get EVM inventory for specific vehicle
 * @access  Private - EVM Staff, Admin
 */
router.get(
  "/evm/vehicle/:vehicleId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  inventoryController.getEVMInventoryByVehicle
);

/**
 * @route   PUT /api/v1/inventory/evm/:vehicleId
 * @desc    Update EVM inventory
 * @access  Private - EVM Staff, Admin
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
 * @route   GET /api/v1/inventory/dealers
 * @desc    Get all dealer inventories
 * @access  Private - All authenticated users
 */
router.get(
  "/dealers",
  AuthMiddleware.authenticate,
  inventoryController.getAllDealerInventories
);

/**
 * @route   GET /api/v1/inventory/dealers/:dealerId
 * @desc    Get inventory for specific dealer
 * @access  Private - Dealer staff can only view own inventory
 */
router.get(
  "/dealers/:dealerId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireSameDealer,
  inventoryController.getDealerInventory
);

/**
 * @route   GET /api/v1/inventory/dealers/:dealerId/vehicle/:vehicleId
 * @desc    Get specific dealer inventory item
 * @access  Private - Dealer staff can only view own inventory
 */
router.get(
  "/dealers/:dealerId/vehicle/:vehicleId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireSameDealer,
  inventoryController.getDealerInventoryItem
);

/**
 * @route   PUT /api/v1/inventory/dealers/:dealerId/:vehicleId
 * @desc    Update dealer inventory
 * @access  Private - Dealer staff can only update own inventory
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
 * @route   GET /api/v1/inventory/low-stock
 * @desc    Get low stock alerts
 * @access  Private - Admin, EVM Staff, Dealer Manager
 */
router.get(
  "/low-stock",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole("ADMIN", "EVM_STAFF", "DEALER_MANAGER"),
  inventoryController.getLowStockAlerts
);

/**
 * @route   GET /api/v1/inventory/summary
 * @desc    Get inventory summary/statistics
 * @access  Private - Admin, EVM Staff
 */
router.get(
  "/summary",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  inventoryController.getInventorySummary
);

export default router;
