// backend/src/modules/public/public.routes.ts
import { Router } from 'express';
import { PublicController } from './public.controller';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import { 
  createPublicTestDriveValidation 
} from './public.validation';

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

export default router;