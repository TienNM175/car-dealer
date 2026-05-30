// src/modules/ai/ai-admin.routes.ts
import { Router } from 'express';
import { AIAdminController } from './ai-admin.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';

const router = Router();
const aiController = new AIAdminController();

/**
 * @swagger
 * /api/v1/ai/admin/executive-summary:
 *   get:
 *     summary: Generate AI executive summary
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *     responses:
 *       200:
 *         description: AI-generated executive summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get(
  '/executive-summary',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  aiController.getExecutiveSummary
);

/**
 * @swagger
 * /api/v1/ai/admin/dealer-performance:
 *   get:
 *     summary: Analyze dealer performance with AI
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: AI-generated dealer performance analysis
 */
router.get(
  '/dealer-performance',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  aiController.getDealerPerformance
);

/**
 * @swagger
 * /api/v1/ai/admin/market-trends:
 *   get:
 *     summary: Analyze market trends and forecast with AI
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI-generated market trends analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get(
  '/market-trends',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  aiController.getMarketTrends
);

export default router;