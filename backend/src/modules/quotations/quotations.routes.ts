import { Router } from 'express';
import { QuotationsController } from './quotations.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import { createQuotationValidation, updateQuotationValidation, updateStatusValidation } from './quotations.validation';

const router = Router();
const quotationsController = new QuotationsController();

/**
 * @route   GET /api/v1/quotations
 * @desc    Get all quotations with filters
 * @access  Private - Dealer Staff and above
 * @query   search, customerId, vehicleId, staffId, status, minPrice, maxPrice, validFrom, validTo, paymentType, page, limit, sortBy, sortOrder
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  quotationsController.getAll
);

/**
 * @route   GET /api/v1/quotations/statistics
 * @desc    Get quotation statistics
 * @access  Private - Dealer Manager and above
 */
router.get(
  '/statistics',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  quotationsController.getStatistics
);

/**
 * @route   POST /api/v1/quotations/expire
 * @desc    Manually expire old quotations
 * @access  Private - Admin/EVM Staff
 */
router.post(
  '/expire',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  quotationsController.expireOldQuotations
);

/**
 * @route   GET /api/v1/quotations/quote/:quoteNumber
 * @desc    Get quotation by quote number
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/quote/:quoteNumber',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  quotationsController.getByQuoteNumber
);

/**
 * @route   GET /api/v1/quotations/customer/:customerId
 * @desc    Get quotations by customer ID
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/customer/:customerId',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  quotationsController.getByCustomerId
);

/**
 * @route   GET /api/v1/quotations/:id
 * @desc    Get single quotation by ID
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  quotationsController.getById
);

/**
 * @route   POST /api/v1/quotations
 * @desc    Create new quotation
 * @access  Private - Dealer Staff and above
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  createQuotationValidation,
  ValidationMiddleware.validate,
  quotationsController.create
);

/**
 * @route   PUT /api/v1/quotations/:id
 * @desc    Update quotation
 * @access  Private - Dealer Staff and above (own dealer only)
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  updateQuotationValidation,
  ValidationMiddleware.validate,
  quotationsController.update
);

/**
 * @route   PATCH /api/v1/quotations/:id/status
 * @desc    Update quotation status (send, accept, reject, expire)
 * @access  Private - Dealer Staff and above
 */
router.patch(
  '/:id/status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  updateStatusValidation,
  ValidationMiddleware.validate,
  quotationsController.updateStatus
);

/**
 * @route   DELETE /api/v1/quotations/:id
 * @desc    Delete quotation (draft only)
 * @access  Private - Dealer Manager and above
 */
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  quotationsController.delete
);

export default router