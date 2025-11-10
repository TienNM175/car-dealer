// mobile/src/api/chatbot.ts
import { apiClient } from './client';

export interface ChatbotMessageRequest {
  sessionId: string;
  message: string;
  context?: {
    userPreferences?: {
      budget?: number;
      seats?: number;
      bodyType?: string;
      purpose?: string;
    };
    selectedVehicleId?: string;
  };
}

export interface ChatbotMessageResponse {
  success: boolean;
  message: string;
  data: {
    reply: string;
    needsMoreInfo?: boolean;
    missingInfo?: string[];
    vehicles?: any[];
    suggestedActions?: any[];
    comparison?: any;
    priceRange?: any;
    details?: any[];
    recommendation?: string;
  };
}

export const chatbotApi = {
  /**
   * Send message to chatbot
   */
  sendMessage: async (
    sessionId: string,
    message: string,
    context?: ChatbotMessageRequest['context']
  ) => {
    const response = await apiClient.post<ChatbotMessageResponse>(
      '/public/chatbot/message',
      {
        sessionId,
        message,
        context,
      }
    );
    return response.data;
  },

  /**
   * Clear chat session
   */
  clearSession: async (sessionId: string) => {
    const response = await apiClient.post('/public/chatbot/clear-session', {
      sessionId,
    });
    return response.data;
  },
};