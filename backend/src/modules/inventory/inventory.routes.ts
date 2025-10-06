import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  updateEVMInventoryValidation,
  updateDealerInventoryValidation,
  transferInventoryValidation,
  reserveInventoryValidation,
  completeSaleValidation,
  cancelReservationValidation,
} from './inventory.validation';

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
  '/evm',
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
  '/evm/vehicle/:vehicleId',
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
  '/evm/:vehicleId',
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
  '/dealers',
  AuthMiddleware.authenticate,
  inventoryController.getAllDealerInventories
);

/**
 * @route   GET /api/v1/inventory/dealers/:dealerId
 * @desc    Get inventory for specific dealer
 * @access  Private - Dealer staff can only view own inventory
 */
router.get(
  '/dealers/:dealerId',
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
  '/dealers/:dealerId/vehicle/:vehicleId',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireSameDealer,
  inventoryController.getDealerInventoryItem
);

/**
 * @route   PUT /api/v1/inventory/dealers/:dealerId/:vehicleId
 * @desc    Update dealer inventory
 * @access  Private - Dealer Manager, EVM Staff, Admin
 */
router.put(
  '/dealers/:dealerId/:vehicleId',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole('ADMIN', 'EVM_STAFF', 'DEALER_MANAGER'),
  RoleMiddleware.requireSameDealer,
  updateDealerInventoryValidation,
  ValidationMiddleware.validate,
  inventoryController.updateDealerInventory
);

// ============================================
// INVENTORY OPERATIONS
// ============================================

/**
 * @route   POST /api/v1/inventory/transfer
 * @desc    Transfer inventory between dealers
 * @access  Private - Admin, EVM Staff
 */
router.post(
  '/transfer',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  transferInventoryValidation,
  ValidationMiddleware.validate,
  inventoryController.transferInventory
);

/**
 * @route   POST /api/v1/inventory/dealers/:dealerId/:vehicleId/reserve
 * @desc    Reserve inventory (when customer orders)
 * @access  Private - Dealer Staff
 */
router.post(
  '/dealers/:dealerId/:vehicleId/reserve',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  RoleMiddleware.requireSameDealer,
  reserveInventoryValidation,
  ValidationMiddleware.validate,
  inventoryController.reserveInventory
);

/**
 * @route   POST /api/v1/inventory/dealers/:dealerId/:vehicleId/complete-sale
 * @desc    Complete sale (move from reserved to sold)
 * @access  Private - Dealer Staff
 */
router.post(
  '/dealers/:dealerId/:vehicleId/complete-sale',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  RoleMiddleware.requireSameDealer,
  completeSaleValidation,
  ValidationMiddleware.validate,
  inventoryController.completeSale
);

/**
 * @route   POST /api/v1/inventory/dealers/:dealerId/:vehicleId/cancel-reservation
 * @desc    Cancel reservation
 * @access  Private - Dealer Staff
 */
router.post(
  '/dealers/:dealerId/:vehicleId/cancel-reservation',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  RoleMiddleware.requireSameDealer,
  cancelReservationValidation,
  ValidationMiddleware.validate,
  inventoryController.cancelReservation
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
  '/low-stock',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole('ADMIN', 'EVM_STAFF', 'DEALER_MANAGER'),
  inventoryController.getLowStockAlerts
);

/**
 * @route   GET /api/v1/inventory/summary
 * @desc    Get inventory summary/statistics
 * @access  Private - Admin, EVM Staff
 */
router.get(
  '/summary',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  inventoryController.getInventorySummary
);

export default router;