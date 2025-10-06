import { Router } from 'express';
import { DealerController } from './dealer.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  createDealerValidation,
  updateDealerValidation,
  dealerIdValidation,
  addStaffValidation,
  updateStaffValidation,
  staffIdValidation,
  setTargetValidation,
} from './dealer.validation';

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
  '/regions',
  AuthMiddleware.authenticate,
  dealerController.getAllRegions
);

// ============================================
// DEALER CRUD
// ============================================

/**
 * @route   GET /api/v1/dealers
 * @desc    Get all dealers with filters and pagination
 * @access  Private - All authenticated users
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  dealerController.getAllDealers
);

/**
 * @route   GET /api/v1/dealers/:id
 * @desc    Get dealer by ID
 * @access  Private - All authenticated users
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  dealerIdValidation,
  ValidationMiddleware.validate,
  dealerController.getDealerById
);

/**
 * @route   POST /api/v1/dealers
 * @desc    Create new dealer
 * @access  Private - EVM Staff, Admin
 */
router.post(
  '/',
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
  '/:id',
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
  '/:id',
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
  '/:id/staff',
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
  '/:id/staff',
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
  '/:id/staff/:staffId',
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
  '/:id/staff/:staffId',
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
  '/:id/inventory',
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
  '/:id/orders',
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
  '/:id/sales-stats',
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
  '/:id/targets',
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
  '/:id/targets',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  setTargetValidation,
  ValidationMiddleware.validate,
  dealerController.setDealerTarget
);

export default router;