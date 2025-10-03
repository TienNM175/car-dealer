import { Router } from 'express';
import { VehicleController } from './vehicle.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';

const router = Router();
const vehicleController = new VehicleController();

/**
 * @route   GET /api/v1/vehicles
 * @desc    Get all vehicles with filters and pagination
 * @access  Public
 */
router.get('/', vehicleController.getAllVehicles);

/**
 * @route   GET /api/v1/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Public
 */
router.get('/:id', vehicleController.getVehicleById);

/**
 * @route   POST /api/v1/vehicles/compare
 * @desc    Compare multiple vehicles
 * @access  Public
 */
router.post('/compare', vehicleController.compareVehicles);

/**
 * @route   GET /api/v1/vehicles/manufacturer/:manufacturerId
 * @desc    Get vehicles by manufacturer
 * @access  Public
 */
router.get('/manufacturer/:manufacturerId', vehicleController.getVehiclesByManufacturer);

/**
 * @route   POST /api/v1/vehicles
 * @desc    Create new vehicle
 * @access  Private - EVM Staff, Admin
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.createVehicle
);

/**
 * @route   PUT /api/v1/vehicles/:id
 * @desc    Update vehicle
 * @access  Private - EVM Staff, Admin
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.updateVehicle
);

/**
 * @route   PATCH /api/v1/vehicles/:id/status
 * @desc    Update vehicle status
 * @access  Private - EVM Staff, Admin
 */
router.patch(
  '/:id/status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  vehicleController.updateVehicleStatus
);

/**
 * @route   DELETE /api/v1/vehicles/:id
 * @desc    Delete vehicle
 * @access  Private - Admin only
 */
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireAdmin,
  vehicleController.deleteVehicle
);

export default router;