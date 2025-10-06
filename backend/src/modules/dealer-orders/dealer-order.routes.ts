import { Router } from 'express';
import { DealerOrderController } from './dealer-order.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  createDealerOrderValidation,
  updateDealerOrderValidation,
  updateDealerOrderStatusValidation,
  cancelDealerOrderValidation,
  dealerOrderIdValidation,
} from './dealer-order.validation';

const router = Router();
const dealerOrderController = new DealerOrderController();

// ============================================
// DEALER ORDER CRUD
// ============================================

/**
 * @route   GET /api/v1/dealer-orders
 * @desc    Get all dealer orders with filters and pagination
 * @access  Private - Dealer Manager and above
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerOrderController.getAllDealerOrders
);

/**
 * @route   GET /api/v1/dealer-orders/by-status
 * @desc    Get order count by status
 * @access  Private - Dealer Manager and above
 */
router.get(
  '/by-status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerOrderController.getOrdersByStatus
);

/**
 * @route   GET /api/v1/dealer-orders/statistics
 * @desc    Get dealer order statistics
 * @access  Private - EVM Staff, Admin
 */
router.get(
  '/statistics',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  dealerOrderController.getDealerOrderStatistics
);

/**
 * @route   GET /api/v1/dealer-orders/:id
 * @desc    Get dealer order by ID
 * @access  Private - Dealer Manager and above
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerOrderIdValidation,
  ValidationMiddleware.validate,
  dealerOrderController.getDealerOrderById
);

/**
 * @route   POST /api/v1/dealer-orders
 * @desc    Create new dealer order
 * @access  Private - Dealer Manager and above
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  createDealerOrderValidation,
  ValidationMiddleware.validate,
  dealerOrderController.createDealerOrder
);

/**
 * @route   PUT /api/v1/dealer-orders/:id
 * @desc    Update dealer order (only PENDING)
 * @access  Private - Dealer Manager and above
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  updateDealerOrderValidation,
  ValidationMiddleware.validate,
  dealerOrderController.updateDealerOrder
);

/**
 * @route   PATCH /api/v1/dealer-orders/:id/status
 * @desc    Update dealer order status
 * @access  Private - EVM Staff (confirm/process/ship), Dealer Manager (cancel)
 */
router.patch(
  '/:id/status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  updateDealerOrderStatusValidation,
  ValidationMiddleware.validate,
  dealerOrderController.updateDealerOrderStatus
);

/**
 * @route   POST /api/v1/dealer-orders/:id/cancel
 * @desc    Cancel dealer order
 * @access  Private - Dealer Manager, EVM Staff, Admin
 */
router.post(
  '/:id/cancel',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  cancelDealerOrderValidation,
  ValidationMiddleware.validate,
  dealerOrderController.cancelDealerOrder
);

export default router;