import { Router } from 'express';
import { TestDriveController } from './test-drive.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  createTestDriveValidation,
  updateTestDriveValidation,
  updateTestDriveStatusValidation,
  cancelTestDriveValidation,
  testDriveIdValidation,
} from './test-drive.validation';

const router = Router();
const testDriveController = new TestDriveController();

// ============================================
// TEST DRIVE CRUD
// ============================================

/**
 * @swagger
 * /api/v1/test-drives:
 *   get:
 *     summary: Get all test drives with filters and pagination
 *     tags: [Test Drives]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of test drives
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  testDriveController.getAllTestDrives
);

/**
 * @route   GET /api/v1/test-drives/upcoming
 * @desc    Get upcoming test drives (next 7 days)
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/upcoming',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  testDriveController.getUpcomingTestDrives
);

/**
 * @route   GET /api/v1/test-drives/by-status
 * @desc    Get test drive count by status
 * @access  Private - Dealer Manager and above
 */
router.get(
  '/by-status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  testDriveController.getTestDrivesByStatus
);

/**
 * @route   GET /api/v1/test-drives/statistics
 * @desc    Get test drive statistics
 * @access  Private - Dealer Manager and above
 */
router.get(
  '/statistics',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  testDriveController.getTestDriveStatistics
);

/**
 * @route   GET /api/v1/test-drives/:id
 * @desc    Get test drive by ID
 * @access  Private - Dealer Staff and above
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  testDriveIdValidation,
  ValidationMiddleware.validate,
  testDriveController.getTestDriveById
);

/**
 * @swagger
 * /api/v1/test-drives:
 *   post:
 *     summary: Create new test drive
 *     tags: [Test Drives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - vehicleId
 *               - scheduledDate
 *             properties:
 *               customerId:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Test drive created successfully
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  createTestDriveValidation,
  ValidationMiddleware.validate,
  testDriveController.createTestDrive
);

/**
 * @route   PUT /api/v1/test-drives/:id
 * @desc    Update test drive (only SCHEDULED)
 * @access  Private - Dealer Staff and above
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  updateTestDriveValidation,
  ValidationMiddleware.validate,
  testDriveController.updateTestDrive
);

/**
 * @route   PATCH /api/v1/test-drives/:id/status
 * @desc    Update test drive status
 * @access  Private - Dealer Staff and above
 */
router.patch(
  '/:id/status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  updateTestDriveStatusValidation,
  ValidationMiddleware.validate,
  testDriveController.updateTestDriveStatus
);

/**
 * @route   POST /api/v1/test-drives/:id/cancel
 * @desc    Cancel test drive
 * @access  Private - Dealer Staff and above
 */
router.post(
  '/:id/cancel',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  cancelTestDriveValidation,
  ValidationMiddleware.validate,
  testDriveController.cancelTestDrive
);

export default router;