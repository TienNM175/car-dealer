// backend/src/modules/chatbot/chatbot.routes.ts
import { Router } from 'express';
import { ChatbotController } from './chatbot.controller';
import { body } from 'express-validator';
import { ValidationMiddleware } from '../../middlewares/validation.middleware';

const router = Router();
const chatbotController = new ChatbotController();

/**
 * @route   POST /api/v1/public/chatbot/message
 * @desc    Send message to chatbot
 * @access  Public
 */
router.post(
  '/message',
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 500 })
      .withMessage('Message too long'),
  ],
  ValidationMiddleware.validate,
  chatbotController.sendMessage
);

/**
 * @route   POST /api/v1/public/chatbot/clear-session
 * @desc    Clear chat session
 * @access  Public
 */
router.post(
  '/clear-session',
  [body('sessionId').notEmpty().withMessage('Session ID is required')],
  ValidationMiddleware.validate,
  chatbotController.clearSession
);

export default router;