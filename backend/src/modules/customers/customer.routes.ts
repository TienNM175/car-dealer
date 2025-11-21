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
 * @swagger
 * /api/v1/customers:
 *   get:
 *     summary: Get all customers with filters and pagination
 *     tags: [Customers]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, BLACKLISTED]
 *     responses:
 *       200:
 *         description: List of customers
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
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
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
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
 * @swagger
 * /api/v1/customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
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
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLACKLISTED]
 *     responses:
 *       200:
 *         description: Customer updated successfully
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
 * @swagger
 * /api/v1/customers/{id}/contracts:
 *   get:
 *     summary: Get customer contracts
 *     tags: [Customers]
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
 *         description: Customer contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
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