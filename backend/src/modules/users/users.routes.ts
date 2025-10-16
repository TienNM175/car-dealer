import { Router } from 'express';
import { UsersController } from './users.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';
import {
  createUserValidation,
  updateUserValidation,
  assignDealerValidation,
  changePasswordValidation,
} from './users.validation';

const router = Router();
const usersController = new UsersController();

/**
 * @route   POST /api/v1/users
 * @desc    Create new user (Admin/Dealer Manager)
 * @access  Private (Admin, Dealer Manager)
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole('ADMIN', 'DEALER_MANAGER'),
  createUserValidation,
  ValidationMiddleware.validate,
  usersController.createUser
);

/**
 * @route   GET /api/v1/users
 * @desc    List all users with filters
 * @access  Private (All authenticated users)
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  usersController.listUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  AuthMiddleware.authenticate,
  usersController.getUserById
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin, Dealer Manager)
 */
router.put(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireRole('ADMIN', 'DEALER_MANAGER'),
  updateUserValidation,
  ValidationMiddleware.validate,
  usersController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireAdmin,
  usersController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/dealer
 * @desc    Assign user to dealer
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/dealer',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireAdmin,
  assignDealerValidation,
  ValidationMiddleware.validate,
  usersController.assignToDealer
);

/**
 * @route   PATCH /api/v1/users/:id/password
 * @desc    Change user password
 * @access  Private (Owner or Admin)
 */
router.patch(
  '/:id/password',
  AuthMiddleware.authenticate,
  changePasswordValidation,
  ValidationMiddleware.validate,
  usersController.changePassword
);

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle user active status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/status',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireAdmin,
  usersController.toggleActiveStatus
);

export default router;