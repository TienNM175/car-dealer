import { Router } from "express";
import { DealerOrderController } from "./dealer-order.controller";
import { AuthMiddleware } from "../../middlewares/auth.middleware";
import { RoleMiddleware } from "../../middlewares/role.middleware";
import { ValidationMiddleware } from "../../middlewares/validation.middleware";
import {
  createDealerOrderValidation,
  updateDealerOrderValidation,
  updateDealerOrderStatusValidation,
  cancelDealerOrderValidation,
  dealerOrderIdValidation,
} from "./dealer-order.validation";

const router = Router();
const dealerOrderController = new DealerOrderController();

// ============================================
// DEALER ORDER CRUD
// ============================================

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get all dealer orders with filters and pagination
 *     tags: [Orders]
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
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *       - in: query
 *         name: dealerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of dealer orders
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
 *                     orders:
 *                       type: array
 *                     pagination:
 *                       type: object
 */
router.get(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerOrderController.getAllDealerOrders
);

/**
 * @swagger
 * /api/v1/orders/by-status:
 *   get:
 *     summary: Get order count by status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order count grouped by status
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
 *                     PENDING:
 *                       type: number
 *                     CONFIRMED:
 *                       type: number
 *                     PROCESSING:
 *                       type: number
 */
router.get(
  "/by-status",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerOrderController.getOrdersByStatus
);

/**
 * @swagger
 * /api/v1/orders/statistics:
 *   get:
 *     summary: Get dealer order statistics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dealer order statistics
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
 *                     totalOrders:
 *                       type: number
 *                     totalValue:
 *                       type: number
 *                     averageOrderValue:
 *                       type: number
 */
router.get(
  "/statistics",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  dealerOrderController.getDealerOrderStatistics
);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get dealer order by ID
 *     tags: [Orders]
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
 *         description: Dealer order details
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
 *                     id:
 *                       type: string
 *                     orderNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                     vehicleId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *       404:
 *         description: Order not found
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  dealerOrderIdValidation,
  ValidationMiddleware.validate,
  dealerOrderController.getDealerOrderById
);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create new dealer order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - quantity
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: uuid
 *               quantity:
 *                 type: number
 *                 example: 5
 *                 minimum: 1
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: Urgent order for customer
 *     responses:
 *       201:
 *         description: Dealer order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  createDealerOrderValidation,
  ValidationMiddleware.validate,
  dealerOrderController.createDealerOrder
);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update dealer order (only PENDING status)
 *     tags: [Orders]
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
 *               quantity:
 *                 type: number
 *                 example: 10
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Dealer order updated successfully
 *       400:
 *         description: Order is not in PENDING status or validation error
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  updateDealerOrderValidation,
  ValidationMiddleware.validate,
  dealerOrderController.updateDealerOrder
);

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     summary: Update dealer order status
 *     tags: [Orders]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition
 */
router.patch(
  "/:id/status",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  updateDealerOrderStatusValidation,
  ValidationMiddleware.validate,
  dealerOrderController.updateDealerOrderStatus
);

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     summary: Cancel dealer order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 example: Customer cancelled
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled (already shipped/delivered)
 */
router.post(
  "/:id/cancel",
  AuthMiddleware.authenticate,
  RoleMiddleware.requireDealerManager,
  cancelDealerOrderValidation,
  ValidationMiddleware.validate,
  dealerOrderController.cancelDealerOrder
);

export default router;
