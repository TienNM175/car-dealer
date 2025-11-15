// backend/src/modules/public/public.routes.ts
import { Router } from 'express';
import { PublicController } from './public.controller';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import { 
  createPublicTestDriveValidation 
} from './public.validation';
import { body, param } from 'express-validator';

const router = Router();
const publicController = new PublicController();

// ============================================
// PUBLIC ROUTES - NO AUTH REQUIRED
// ============================================

/**
 * @route   GET /api/v1/public/vehicles
 * @desc    Get all vehicles (public)
 * @access  Public
 */
router.get('/vehicles', publicController.getVehicles);

/**
 * @route   GET /api/v1/public/vehicles/:id
 * @desc    Get vehicle details
 * @access  Public
 */
router.get('/vehicles/:id', publicController.getVehicleById);

/**
 * @route   POST /api/v1/public/vehicles/compare
 * @desc    Compare vehicles
 * @access  Public
 */
router.post('/vehicles/compare', publicController.compareVehicles);

/**
 * @route   GET /api/v1/public/manufacturers
 * @desc    Get all manufacturers
 * @access  Public
 */
router.get('/manufacturers', publicController.getManufacturers);

/**
 * @route   GET /api/v1/public/dealers
 * @desc    Get all active dealers with vehicle availability
 * @access  Public
 */
router.get('/dealers', publicController.getDealers);

/**
 * @route   GET /api/v1/public/dealers/:dealerId/vehicles/:vehicleId
 * @desc    Check vehicle availability at specific dealer
 * @access  Public
 */
router.get(
  '/dealers/:dealerId/vehicles/:vehicleId',
  publicController.checkVehicleAtDealer
);

/**
 * @route   POST /api/v1/public/test-drives
 * @desc    Book test drive (no auth required)
 * @access  Public
 */
router.post(
  '/test-drives',
  createPublicTestDriveValidation,
  ValidationMiddleware.validate,
  publicController.bookTestDrive
);

/**
 * @route   POST /api/v1/public/contracts/lookup
 * @desc    Lookup contract by contract code and customer info
 * @access  Public
 * @body    { contractCode, email?, phone? }
 */
router.post(
  '/contracts/lookup',
  body('contractCode')
    .notEmpty()
    .withMessage('Contract code is required')
    .matches(/^CT-\d{6}-\d{4}$/)
    .withMessage('Invalid contract code format'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  ValidationMiddleware.validate,
  publicController.lookupContract
);

/**
 * @route   GET /api/v1/public/contracts/:contractCode/debt
 * @desc    Get debt information for a contract
 * @access  Public (with customer verification)
 * @query   email? or phone?
 */
router.get(
  '/contracts/:contractCode/debt',
  param('contractCode')
    .notEmpty()
    .matches(/^CT-\d{6}-\d{4}$/)
    .withMessage('Invalid contract code format'),
  ValidationMiddleware.validate,
  publicController.getContractDebt
);

/**
 * @route   GET /api/v1/public/contracts/:contractCode/payment-schedule
 * @desc    Get payment schedule for installment contract
 * @access  Public (with customer verification)
 * @query   email? or phone?
 */
router.get(
  '/contracts/:contractCode/payment-schedule',
  param('contractCode')
    .notEmpty()
    .matches(/^CT-\d{6}-\d{4}$/)
    .withMessage('Invalid contract code format'),
  ValidationMiddleware.validate,
  publicController.getPaymentSchedule
);

export default router;