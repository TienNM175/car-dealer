import { Router } from "express";
import { PromotionsController } from "./promotions.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  createPromotionValidation,
  updatePromotionValidation,
  calculateDiscountValidation,
} from "./promotions.validation";

const router = Router();
const promotionsController = new PromotionsController();

/**
 * @route   GET /api/v1/promotions
 * @desc    Get all promotions with filters
 * @access  Private - Dealer Staff and above
 * @query   search, dealerId, discountType, isActive, startDate, endDate, minDiscount, maxDiscount, page, limit, sortBy, sortOrder
 */
router.get(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  promotionsController.getAll
);

/**
 * @route   GET /api/v1/promotions/statistics
 * @desc    Get promotion statistics
 * @access  Private - Dealer Manager and above
 */
router.get(
  "/statistics",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  promotionsController.getStatistics
);

/**
 * @route   POST /api/v1/promotions/auto-expire
 * @desc    Manually trigger auto-expire for promotions
 * @access  Private - Admin/EVM Staff
 */
router.post(
  "/auto-expire",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  promotionsController.autoExpire
);

/**
 * @route   POST /api/v1/promotions/calculate
 * @desc    Calculate discount for a purchase
 * @access  Private - Dealer Staff and above
 */
router.post(
  "/calculate",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  calculateDiscountValidation,
  ValidationMiddleware.validate,
  promotionsController.calculateDiscount
);

/**
 * @route   GET /api/v1/promotions/dealer/:dealerId
 * @desc    Get all promotions for a dealer
 * @access  Private - Dealer Staff and above
 * @query   includeInactive (boolean)
 */
router.get(
  "/dealer/:dealerId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  promotionsController.getByDealerId
);

/**
 * @route   GET /api/v1/promotions/dealer/:dealerId/active
 * @desc    Get active promotions for a dealer
 * @access  Private - Dealer Staff and above
 */
router.get(
  "/dealer/:dealerId/active",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  promotionsController.getActivePromotions
);

/**
 * @route   GET /api/v1/promotions/dealer/:dealerId/available
 * @desc    Get all available promotions for a dealer (dealer + manufacturer)
 * @access  Private - Dealer Staff and above
 */
router.get(
  "/dealer/:dealerId/available",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  promotionsController.getAvailablePromotions
);

/**
 * @route   GET /api/v1/promotions/:id
 * @desc    Get single promotion by ID
 * @access  Private - Dealer Staff and above
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  promotionsController.getById
);

/**
 * @route   POST /api/v1/promotions
 * @desc    Create new promotion
 * @access  Private - Dealer Manager and above
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  createPromotionValidation,
  ValidationMiddleware.validate,
  promotionsController.create
);

/**
 * @route   PUT /api/v1/promotions/:id
 * @desc    Update promotion
 * @access  Private - Dealer Manager and above
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  updatePromotionValidation,
  ValidationMiddleware.validate,
  promotionsController.update
);

/**
 * @route   PATCH /api/v1/promotions/:id/toggle
 * @desc    Toggle promotion active status
 * @access  Private - Dealer Manager and above
 */
router.patch(
  "/:id/toggle",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  promotionsController.toggleStatus
);

/**
 * @route   DELETE /api/v1/promotions/:id
 * @desc    Delete promotion
 * @access  Private - Dealer Manager and above
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  promotionsController.delete
);

export default router;
