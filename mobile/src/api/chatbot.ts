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
    selectedDealerId?: string;
    preferredDate?: string;
    preferredTime?: string;
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
    bookingInfo?: any;
    dealers?: any[];
    nextAction?: string;
    comparison?: any;
    priceRange?: any;
  };
}

export interface TestDriveConfirmRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId: string;
  dealerId: string;
  scheduledDate: string;
  notes?: string;
}

export interface TestDriveConfirmResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    scheduledDate: string;
    status: string;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    vehicle: {
      model: string;
      variant?: string;
      manufacturer: {
        name: string;
      };
    };
    staff: {
      firstName: string;
      lastName: string;
      dealer: {
        name: string;
        city: string;
        phone?: string;
      };
    };
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

  /**
   * ✅ NEW: Confirm test drive directly from chatbot
   */
  confirmTestDrive: async (data: TestDriveConfirmRequest) => {
    const response = await apiClient.post<TestDriveConfirmResponse>(
      '/public/test-drives',
      data
    );
    return response.data;
  },
};