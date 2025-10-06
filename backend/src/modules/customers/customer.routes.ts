import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  createCustomerValidation,
  updateCustomerValidation,
  customerIdValidation,
  addLifecycleValidation,
  searchCustomerValidation,
} from './customer.validation';

const router = Router();
const customerController = new CustomerController();

// ============================================
// CUSTOMER CRUD
// ============================================

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers with filters and pagination
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerController.getAllCustomers
);

/**
 * @route   GET /api/v1/customers/search
 * @desc    Search customers
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/search',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  searchCustomerValidation,
  ValidationMiddleware.validate,
  customerController.searchCustomers
);

/**
 * @route   GET /api/v1/customers/by-status
 * @desc    Get customer count by status
 * @access  Private - Dealer Manager and above
 */
router.get(
  '/by-status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  customerController.getCustomersByStatus
);

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get customer by ID
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerById
);

/**
 * @route   POST /api/v1/customers
 * @desc    Create new customer
 * @access  Private - Dealer Staff and above
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  createCustomerValidation,
  ValidationMiddleware.validate,
  customerController.createCustomer
);

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private - Dealer Staff and above
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  updateCustomerValidation,
  ValidationMiddleware.validate,
  customerController.updateCustomer
);

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer
 * @access  Private - Dealer Manager and above
 */
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.deleteCustomer
);

// ============================================
// CUSTOMER LIFECYCLE
// ============================================

/**
 * @route   GET /api/v1/customers/:id/lifecycle
 * @desc    Get customer lifecycle history
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id/lifecycle',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerLifecycle
);

/**
 * @route   POST /api/v1/customers/:id/lifecycle
 * @desc    Add customer lifecycle event
 * @access  Private - Dealer Staff and above
 */
router.post(
  '/:id/lifecycle',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  addLifecycleValidation,
  ValidationMiddleware.validate,
  customerController.addLifecycleEvent
);

// ============================================
// CUSTOMER RELATIONS
// ============================================

/**
 * @route   GET /api/v1/customers/:id/contracts
 * @desc    Get customer contracts
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id/contracts',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerContracts
);

/**
 * @route   GET /api/v1/customers/:id/test-drives
 * @desc    Get customer test drives
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id/test-drives',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerTestDrives
);

/**
 * @route   GET /api/v1/customers/:id/quotations
 * @desc    Get customer quotations
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id/quotations',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerQuotations
);

/**
 * @route   GET /api/v1/customers/:id/feedbacks
 * @desc    Get customer feedbacks
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id/feedbacks',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerFeedbacks
);

/**
 * @route   GET /api/v1/customers/:id/complaints
 * @desc    Get customer complaints
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id/complaints',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerComplaints
);

/**
 * @route   GET /api/v1/customers/:id/statistics
 * @desc    Get customer statistics
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id/statistics',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  customerIdValidation,
  ValidationMiddleware.validate,
  customerController.getCustomerStatistics
);

export default router;