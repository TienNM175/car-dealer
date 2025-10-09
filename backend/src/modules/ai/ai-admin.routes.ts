// src/modules/ai/ai-admin.routes.ts
import { Router } from 'express';
import { AIAdminController } from './ai-admin.controller';
import { AuthMiddleware } from '../../middlewares/auth.middleware';
import { RoleMiddleware } from '../../middlewares/role.middleware';

const router = Router();
const aiController = new AIAdminController();

/**
 * @route   GET /api/v1/ai/admin/executive-summary
 * @desc    Generate AI executive summary (daily/weekly/monthly)
 * @access  Private - Admin/EVM Staff only
 * @query   period: 'daily' | 'weekly' | 'monthly'
 */
router.get(
  '/executive-summary',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  aiController.getExecutiveSummary
);

/**
 * @route   GET /api/v1/ai/admin/dealer-performance
 * @desc    Analyze dealer performance with AI (month/quarter/year)
 * @access  Private - Admin/EVM Staff only
 * @query   timeframe: 'month' | 'quarter' | 'year'
 */
router.get(
  '/dealer-performance',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  aiController.getDealerPerformance
);

/**
 * @route   GET /api/v1/ai/admin/market-trends
 * @desc    Analyze market trends and forecast with AI
 * @access  Private - Admin/EVM Staff only
 */
router.get(
  '/market-trends',
  AuthMiddleware.authenticate,
  RoleMiddleware.requireEVMStaff,
  aiController.getMarketTrends
);

export default router;