// src/modules/ai/ai-admin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BusinessIntelligenceService } from './services/business-intelligence.service';
import { ResponseUtil } from '../../utils/response.util';

const biService = new BusinessIntelligenceService();

export class AIAdminController {
  /**
   * @route   GET /api/v1/ai/admin/executive-summary
   * @desc    Generate executive summary
   * @access  Private - Admin/EVM Staff
   */
  async getExecutiveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      console.log(`🤖 Generating ${period} executive summary...`);

      const summary = await biService.generateExecutiveSummary(period);

      return ResponseUtil.success(
        res,
        summary,
        `Executive summary generated successfully for ${period} period`
      );
    } catch (error: any) {
      console.error('❌ Executive summary error:', error.message);

      if (error.message.includes('quota')) {
        return ResponseUtil.error(
          res,
          'AI service temporarily unavailable. Please try again in a few minutes.',
          429
        );
      }

      return next(error);
    }
  }

  /**
   * @route   GET /api/v1/ai/admin/dealer-performance
   * @desc    Analyze dealer performance
   * @access  Private - Admin/EVM Staff
   */
  async getDealerPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const timeframe = (req.query.timeframe as 'month' | 'quarter' | 'year') || 'quarter';
      console.log(`🤖 Analyzing dealer performance for ${timeframe}...`);

      const performance = await biService.analyzeDealerPerformance(timeframe);

      return ResponseUtil.success(
        res,
        performance,
        `Dealer performance analysis completed for ${timeframe}`
      );
    } catch (error: any) {
      console.error('❌ Dealer performance error:', error.message);

      if (error.message.includes('quota')) {
        return ResponseUtil.error(
          res,
          'AI service temporarily unavailable. Please try again in a few minutes.',
          429
        );
      }

      return next(error); 
    }
  }

  /**
   * @route   GET /api/v1/ai/admin/market-trends
   * @desc    Analyze market trends
   * @access  Private - Admin/EVM Staff
   */
  async getMarketTrends(_req: Request, res: Response, next: NextFunction) {
    try {
      console.log('🤖 Analyzing market trends...');
      const trends = await biService.analyzeMarketTrends();

      return ResponseUtil.success(res, trends, 'Market trends analysis completed successfully');
    } catch (error: any) {
      console.error('❌ Market trends error:', error.message);

      if (error.message.includes('quota')) {
        return ResponseUtil.error(
          res,
          'AI service temporarily unavailable. Please try again in a few minutes.',
          429
        );
      }

      return next(error); 
    }
  }
}
