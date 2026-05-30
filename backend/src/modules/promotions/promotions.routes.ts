import { Router } from "express";
import { PromotionsController } from "./promotions.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  createPromotionValidation,
  updatePromotionValidation,
  calculateDiscountValidation,
  idValidation,
  dealerIdValidation,
} from "./promotions.validation";

const router = Router();
const promotionsController = new PromotionsController();

/**
 * @swagger
 * /api/v1/promotions:
 *   get:
 *     summary: Get all promotions with filters
 *     tags: [Promotions]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [DEALER, MANUFACTURER]
 *     responses:
 *       200:
 *         description: List of promotions
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
 * @access  Private - Dealer Manager and above (or EVM/Admin for all)
 * @query   source (optional)
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
 * @query   includeInactive (boolean), source (DEALER|MANUFACTURER)
 */
router.get(
  "/dealer/:dealerId",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerStaff,
  dealerIdValidation,
  ValidationMiddleware.validate,
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
  dealerIdValidation,
  ValidationMiddleware.validate,
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
  dealerIdValidation,
  ValidationMiddleware.validate,
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
  idValidation,
  ValidationMiddleware.validate,
  promotionsController.getById
);

/**
 * @swagger
 * /api/v1/promotions:
 *   post:
 *     summary: Create new promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               discountValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               source:
 *                 type: string
 *                 enum: [DEALER, MANUFACTURER]
 *     responses:
 *       201:
 *         description: Promotion created successfully
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  // Note: Role check is flexible; service enforces based on source
  RoleMiddleware.requireDealerManager,
  createPromotionValidation,
  ValidationMiddleware.validate,
  promotionsController.create
);

/**
 * @route   PUT /api/v1/promotions/:id
 * @desc    Update promotion (Dealer only updates DEALER; EVM/Admin updates MANUFACTURER)
 * @access  Private - Dealer Manager (for DEALER) or EVM Staff/Admin (for MANUFACTURER)
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  // Note: Role check is flexible; service enforces based on source
  RoleMiddleware.requireDealerManager,
  idValidation,
  ValidationMiddleware.validate,
  updatePromotionValidation,
  ValidationMiddleware.validate,
  promotionsController.update
);

/**
 * @route   PATCH /api/v1/promotions/:id/toggle
 * @desc    Toggle promotion active status (Dealer only toggles DEALER; EVM/Admin toggles MANUFACTURER)
 * @access  Private - Dealer Staff and above (for DEALER) or EVM Staff/Admin (for MANUFACTURER)
 */
router.patch(
  "/:id/toggle",
  AuthMiddleware.authenticate,
  // Note: Updated to requireDealerStaff for consistency; service enforces
  RoleMiddleware.requireDealerStaff,
  idValidation,
  ValidationMiddleware.validate,
  promotionsController.toggleStatus
);

/**
 * @route   DELETE /api/v1/promotions/:id
 * @desc    Delete promotion (Dealer only deletes DEALER; EVM/Admin deletes MANUFACTURER)
 * @access  Private - Dealer Manager (for DEALER) or EVM Staff/Admin (for MANUFACTURER)
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  // Note: Role check is flexible; service enforces based on source
  RoleMiddleware.requireDealerManager,
  idValidation,
  ValidationMiddleware.validate,
  promotionsController.delete
);

export default router;