// backend/src/modules/chatbot/chatbot.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ChatbotService } from './chatbot.service';
import { ResponseUtil } from '../../utils/response.util';

const chatbotService = new ChatbotService();

export class ChatbotController {
  /**
   * @route   POST /api/v1/public/chatbot/message
   * @desc    Send message to chatbot
   * @access  Public
   */
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, message, context } = req.body;

      if (!sessionId || !message) {
        return ResponseUtil.badRequest(res, 'sessionId and message are required');
      }

      const response = await chatbotService.chat(sessionId, message, context);

      return ResponseUtil.success(res, response, 'Message processed successfully');
    } catch (error: any) {
      console.error('Chatbot error:', error);

      if (error.message.includes('quota')) {
        return ResponseUtil.error(
          res,
          'AI service temporarily unavailable. Please try again later.',
          503
        );
      }

      return next(error);
    }
  }

  /**
   * @route   POST /api/v1/public/chatbot/clear-session
   * @desc    Clear chat session
   * @access  Public
   */
  async clearSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return ResponseUtil.badRequest(res, 'sessionId is required');
      }

      chatbotService.clearSession(sessionId);

      return ResponseUtil.success(res, null, 'Session cleared successfully');
    } catch (error: any) {
      return next(error);
    }
  }
}