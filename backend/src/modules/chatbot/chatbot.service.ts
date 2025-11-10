// backend/src/modules/chatbot/chatbot.service.ts
import { GeminiClient } from '../../utils/gemini-client.util';
import prisma from '../../config/database';
import { VehicleBodyType } from '@prisma/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatContext {
  sessionId: string;
  messages: ChatMessage[];
  userPreferences?: {
    budget?: number;
    seats?: number;
    bodyType?: string;
    purpose?: string;
  };
}

export class ChatbotService {
  private static sessions = new Map<string, ChatContext>();
  private static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Main chat handler
   */
  async chat(
    sessionId: string,
    userMessage: string,
    context?: Partial<ChatContext> & {
      selectedVehicleId?: string;
    }
  ) {
    // Get or create session
    let session = ChatbotService.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        messages: [],
        userPreferences: context?.userPreferences,
      };
      ChatbotService.sessions.set(sessionId, session);
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Keep only last 10 messages for context
    if (session.messages.length > 10) {
      session.messages = session.messages.slice(-10);
    }

    // Detect intent
    const intent = await this.detectIntent(userMessage, session);

    let response;
    switch (intent) {
      case 'vehicle_recommendation':
        response = await this.handleVehicleRecommendation(userMessage, session);
        break;

      case 'vehicle_comparison':
        response = await this.handleVehicleComparison(userMessage, session, context);
        break;

      case 'price_inquiry':
        response = await this.handlePriceInquiry(userMessage, session);
        break;

      default:
        response = await this.handleGeneralQuery(userMessage, session);
    }

    // Add assistant response to session
    session.messages.push({
      role: 'assistant',
      content: response.reply,
      timestamp: new Date(),
    });

    // Auto-cleanup old sessions
    this.cleanupOldSessions();

    return response;
  }

  /**
   * Detect user intent using AI
   */
  private async detectIntent(message: string, session: ChatContext): Promise<string> {
    const conversationHistory = session.messages
      .slice(-5)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `
Bạn là trợ lý AI phân tích ý định của khách hàng trong ngành bán xe điện.

Lịch sử hội thoại gần đây:
${conversationHistory}

Tin nhắn mới nhất của khách hàng:
"${message}"

Phân tích và trả về JSON với ý định chính:
{
  "intent": "vehicle_recommendation | vehicle_comparison | price_inquiry | general_query",
  "confidence": 0.0-1.0,
  "extractedInfo": {
    "budget": number hoặc null,
    "seats": number hoặc null,
    "bodyType": "SUV | SEDAN | HATCHBACK" hoặc null,
    "vehicleModels": ["tên xe"] hoặc [],
    "purpose": "family | work | business" hoặc null
  }
}

Quy tắc phân loại:
- vehicle_recommendation: Khách hỏi "xe nào tốt", "tư vấn xe", "xe phù hợp"
- vehicle_comparison: Khách hỏi "so sánh", "khác nhau", "xe nào hơn"
- price_inquiry: Khách hỏi về "giá", "bao nhiêu tiền", "chi phí"
- general_query: Các câu hỏi chung khác

LƯU Ý: Chatbot KHÔNG hỗ trợ đặt lịch lái thử. Nếu khách hỏi về đặt lịch, trả về general_query để hướng dẫn họ sử dụng tính năng đặt lịch trên app.
`;

    try {
      const result = await GeminiClient.generateJSON(prompt, {
        useCache: false,
      });

      // Update session preferences
      if (result.extractedInfo) {
        session.userPreferences = {
          ...session.userPreferences,
          ...result.extractedInfo,
        };
      }

      return result.intent;
    } catch (error) {
      console.error('Intent detection failed:', error);
      return 'general_query';
    }
  }

  /**
   * Handle vehicle recommendation
   */
  private async handleVehicleRecommendation(
    message: string,
    session: ChatContext
  ) {
    const preferences = session.userPreferences || {};

    // Get available vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'ACTIVE',
        ...(preferences.budget && {
          retailPrice: { lte: preferences.budget },
        }),
        ...(preferences.seats && { seats: { gte: preferences.seats } }),
        ...(preferences.bodyType && { bodyType: { equals: preferences.bodyType as VehicleBodyType } }),
      },
      include: {
        manufacturer: true,
        images: { where: { isMain: true }, take: 1 },
        dealerInventories: {
          where: { available: { gt: 0 } },
          take: 1,
        },
      },
      take: 10,
    });

    if (vehicles.length === 0) {
      return {
        reply:
          'Hiện tại chưa có xe phù hợp với yêu cầu của bạn. Bạn có thể mở rộng tiêu chí tìm kiếm không?',
        suggestedActions: [
          { label: '🔍 Xem tất cả xe', action: 'VIEW_ALL_VEHICLES' },
        ],
      };
    }

    // AI analyze and rank vehicles
    const conversationHistory = session.messages
      .slice(-5)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `
Bạn là chuyên gia tư vấn xe điện tại Việt Nam.

Hội thoại gần đây:
${conversationHistory}

Tin nhắn mới nhất: "${message}"

Sở thích khách hàng:
${JSON.stringify(preferences, null, 2)}

Danh sách xe có sẵn:
${JSON.stringify(
  vehicles.map((v) => ({
    id: v.id,
    model: v.model,
    variant: v.variant,
    manufacturer: v.manufacturer.name,
    price: Number(v.retailPrice),
    batteryCapacity: v.batteryCapacity,
    range: v.range,
    seats: v.seats,
    bodyType: v.bodyType,
  })),
  null,
  2
)}

Hãy phân tích và trả về JSON:
{
  "needsMoreInfo": boolean,
  "missingInfo": ["ngân sách", "mục đích sử dụng", ...] hoặc null,
  "reply": "Câu trả lời tự nhiên, thân thiện bằng tiếng Việt",
  "recommendations": [
    {
      "vehicleId": "...",
      "score": 0-100,
      "reason": "Lý do đề xuất ngắn gọn"
    }
  ],
  "suggestedActions": [
    {
      "label": "🚗 Xem chi tiết VF 8",
      "action": "VIEW_VEHICLE",
      "vehicleId": "..."
    }
  ]
}

Nếu thiếu thông tin quan trọng (ngân sách, mục đích), set needsMoreInfo = true và hỏi thêm.
Nếu đủ thông tin, đề xuất 3 xe tốt nhất với lý do cụ thể.
`;

    const analysis = await GeminiClient.generateJSON(prompt, {
      useCache: false,
    });

    // Enrich recommendations with full vehicle data
    const recommendedVehicles = analysis.recommendations
      ?.map((rec: any) => {
        const vehicle = vehicles.find((v) => v.id === rec.vehicleId);
        if (!vehicle) return null;

        return {
          vehicleId: vehicle.id,
          model: vehicle.model,
          variant: vehicle.variant,
          manufacturer: vehicle.manufacturer.name,
          price: Number(vehicle.retailPrice),
          image: vehicle.images[0]?.url,
          batteryCapacity: vehicle.batteryCapacity,
          range: vehicle.range,
          seats: vehicle.seats,
          available: vehicle.dealerInventories.length > 0,
          score: rec.score,
          reason: rec.reason,
        };
      })
      .filter(Boolean);

    return {
      reply: analysis.reply,
      needsMoreInfo: analysis.needsMoreInfo,
      missingInfo: analysis.missingInfo,
      vehicles: recommendedVehicles || [],
      suggestedActions: analysis.suggestedActions || [
        { label: '🔍 Xem tất cả xe', action: 'VIEW_ALL_VEHICLES' },
        { label: '📊 So sánh xe', action: 'COMPARE_VEHICLES' },
      ],
    };
  }

  /**
   * Handle vehicle comparison
   */
  private async handleVehicleComparison(
    message: string,
    session: ChatContext,
    context?: any
  ) {
    // Initialize comparison state
    if (!session.userPreferences) {
      session.userPreferences = {};
    }
    const comparisonState = (session.userPreferences as any).comparisonState || {
      selectedVehicles: [],
    };

    // Add vehicle from context (button click)
    if (context?.selectedVehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: context.selectedVehicleId },
        include: { manufacturer: true },
      });

      if (vehicle) {
        const existingIds = comparisonState.selectedVehicles.map((v: any) => v.id);
        if (!existingIds.includes(vehicle.id)) {
          comparisonState.selectedVehicles.push({
            id: vehicle.id,
            model: vehicle.model,
            manufacturer: vehicle.manufacturer.name,
          });
        }
      }
    } else {
      // Extract vehicle from message
      const extractedVehicle = await this.extractVehicleFromMessage(message);
      if (extractedVehicle) {
        const existingIds = comparisonState.selectedVehicles.map((v: any) => v.id);
        if (!existingIds.includes(extractedVehicle.id)) {
          comparisonState.selectedVehicles.push(extractedVehicle);
        }
      }
    }

    // Save state
    (session.userPreferences as any).comparisonState = comparisonState;

    // Need at least 2 vehicles
    if (comparisonState.selectedVehicles.length === 0) {
      const popularVehicles = await prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
        include: { manufacturer: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      return {
        reply: 'Bạn muốn so sánh những mẫu xe nào? Vui lòng chọn ít nhất 2 xe để so sánh. 🚗',
        suggestedActions: popularVehicles.map((v) => ({
          label: `${v.manufacturer.name} ${v.model}`,
          action: 'ADD_TO_COMPARISON',
          vehicleId: v.id,
        })),
      };
    }

    if (comparisonState.selectedVehicles.length === 1) {
      const firstVehicle = comparisonState.selectedVehicles[0];
      
      const otherVehicles = await prisma.vehicle.findMany({
        where: {
          status: 'ACTIVE',
          id: { not: firstVehicle.id },
        },
        include: { manufacturer: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      return {
        reply: `✅ Đã chọn: ${firstVehicle.manufacturer} ${firstVehicle.model}\n\nVui lòng chọn xe thứ 2 để so sánh:`,
        vehicles: [
          {
            vehicleId: firstVehicle.id,
            model: firstVehicle.model,
            manufacturer: firstVehicle.manufacturer,
            selected: true,
          },
        ],
        suggestedActions: otherVehicles.map((v) => ({
          label: `${v.manufacturer.name} ${v.model}`,
          action: 'ADD_TO_COMPARISON',
          vehicleId: v.id,
        })),
      };
    }

    // Have 2+ vehicles - Do comparison
    const vehicleIds = comparisonState.selectedVehicles.map((v: any) => v.id);
    const vehiclesData = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      include: {
        manufacturer: true,
        images: { where: { isMain: true }, take: 1 },
      },
    });

    if (vehiclesData.length < 2) {
      return {
        reply: 'Không tìm thấy đủ thông tin xe để so sánh. Vui lòng thử lại.',
        suggestedActions: [
          { label: '🔄 Bắt đầu lại', action: 'RESTART_COMPARISON' },
        ],
      };
    }

    // AI comparison
    const comparisonPrompt = `
So sánh chi tiết các xe sau bằng tiếng Việt:

${vehiclesData
  .map(
    (v, i) => `
Xe ${i + 1}: ${v.manufacturer.name} ${v.model} ${v.variant || ''}
- Giá: ${Number(v.retailPrice).toLocaleString('vi-VN')} VND
- Pin: ${v.batteryCapacity} kWh
- Quãng đường: ${v.range} km
- Công suất: ${v.motorPower} kW
- Tốc độ tối đa: ${v.topSpeed} km/h
- Tăng tốc 0-100: ${v.acceleration}s
- Số chỗ: ${v.seats}
`
  )
  .join('\n')}

Trả về JSON:
{
  "summary": "Tổng quan so sánh ngắn gọn (2-3 câu)",
  "comparison": {
    "bestValue": {
      "vehicleId": "id xe",
      "reason": "Lý do"
    },
    "bestPerformance": {
      "vehicleId": "id xe",
      "reason": "Lý do"
    },
    "bestRange": {
      "vehicleId": "id xe",
      "reason": "Lý do"
    }
  },
  "details": [
    {
      "category": "Giá cả",
      "winner": "Tên xe",
      "comparison": "Phân tích chi tiết"
    },
    {
      "category": "Hiệu năng",
      "winner": "Tên xe",
      "comparison": "Phân tích chi tiết"
    },
    {
      "category": "Quãng đường",
      "winner": "Tên xe",
      "comparison": "Phân tích chi tiết"
    }
  ],
  "recommendation": "Gợi ý chọn xe nào cho từng đối tượng"
}
`;

    const comparisonResult = await GeminiClient.generateJSON(comparisonPrompt, {
      useCache: false,
    });

    // Clear comparison state after done
    (session.userPreferences as any).comparisonState = { selectedVehicles: [] };

    return {
      reply: comparisonResult.summary,
      vehicles: vehiclesData.map((v) => ({
        vehicleId: v.id,
        model: v.model,
        variant: v.variant,
        manufacturer: v.manufacturer.name,
        price: Number(v.retailPrice),
        batteryCapacity: v.batteryCapacity,
        range: v.range,
        image: v.images[0]?.url,
      })),
      comparison: comparisonResult.comparison,
      details: comparisonResult.details,
      recommendation: comparisonResult.recommendation,
      suggestedActions: [
        {
          label: '📊 So sánh xe khác',
          action: 'RESTART_COMPARISON',
        },
        {
          label: '🔍 Xem tất cả xe',
          action: 'VIEW_ALL_VEHICLES',
        },
      ],
    };
  }

  /**
   * Extract vehicle from message
   */
  private async extractVehicleFromMessage(message: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'ACTIVE' },
      include: { manufacturer: true },
    });

    const lowerMessage = message.toLowerCase();
    for (const vehicle of vehicles) {
      const modelLower = vehicle.model.toLowerCase();
      const manufacturerLower = vehicle.manufacturer.name.toLowerCase();
      
      if (
        lowerMessage.includes(modelLower) ||
        lowerMessage.includes(`${manufacturerLower} ${modelLower}`)
      ) {
        return {
          id: vehicle.id,
          model: vehicle.model,
          manufacturer: vehicle.manufacturer.name,
        };
      }
    }

    return null;
  }

  /**
   * Handle price inquiry
   */
  private async handlePriceInquiry(message: string, session: ChatContext) {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'ACTIVE' },
      include: { manufacturer: true },
      orderBy: { retailPrice: 'asc' },
    });

    const prompt = `
Tin nhắn: "${message}"

Danh sách xe và giá:
${vehicles.map((v) => `${v.manufacturer.name} ${v.model}: ${Number(v.retailPrice).toLocaleString('vi-VN')} VND`).join('\n')}

Trả về JSON với câu trả lời thân thiện về giá xe:
{
  "reply": "Câu trả lời chi tiết về giá",
  "priceRange": {
    "min": number,
    "max": number
  },
  "recommendedVehicles": ["vehicleId1", "vehicleId2", "vehicleId3"]
}
`;

    const analysis = await GeminiClient.generateJSON(prompt, {
      useCache: false,
    });

    const recommended = vehicles.filter((v) =>
      analysis.recommendedVehicles.includes(v.id)
    );

    return {
      reply: analysis.reply,
      priceRange: analysis.priceRange,
      vehicles: recommended.map((v) => ({
        vehicleId: v.id,
        model: v.model,
        manufacturer: v.manufacturer.name,
        price: Number(v.retailPrice),
      })),
      suggestedActions: [
        { label: '🚗 Xem chi tiết xe', action: 'VIEW_ALL_VEHICLES' },
        { label: '💡 Tư vấn xe phù hợp', action: 'GET_RECOMMENDATION' },
      ],
    };
  }

  /**
   * Handle general queries
   */
  private async handleGeneralQuery(message: string, session: ChatContext) {
    const conversationHistory = session.messages
      .slice(-5)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `
Bạn là trợ lý bán hàng xe điện chuyên nghiệp tại Việt Nam.

Hội thoại:
${conversationHistory}

Tin nhắn mới: "${message}"

Trả lời câu hỏi một cách thân thiện, ngắn gọn bằng tiếng Việt.

QUY TẮC QUAN TRỌNG:
- Nếu câu hỏi về kỹ thuật, hãy giải thích đơn giản.
- Nếu không liên quan đến xe điện, hãy lịch sự chuyển hướng về sản phẩm.
- Nếu khách hỏi về ĐẶT LỊCH LÁI THỬ, hãy hướng dẫn họ sử dụng tính năng đặt lịch trên app (không phải qua chatbot):
  + Bước 1: Chọn xe muốn lái thử
  + Bước 2: Nhấn nút "Đặt lịch lái thử" trên trang chi tiết xe
  + Bước 3: Điền thông tin và chọn thời gian

Trả về JSON:
{
  "reply": "Câu trả lời",
  "suggestedActions": [
    { "label": "🔍 Xem xe điện", "action": "VIEW_ALL_VEHICLES" },
    { "label": "💡 Tư vấn xe", "action": "GET_RECOMMENDATION" }
  ]
}
`;

    const response = await GeminiClient.generateJSON(prompt, {
      useCache: false,
    });

    return response;
  }

  /**
   * Cleanup old sessions
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of ChatbotService.sessions.entries()) {
      const lastMessage = session.messages[session.messages.length - 1];
      if (lastMessage && now - lastMessage.timestamp.getTime() > ChatbotService.SESSION_TIMEOUT) {
        ChatbotService.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Clear specific session
   */
  clearSession(sessionId: string): void {
    ChatbotService.sessions.delete(sessionId);
  }
}