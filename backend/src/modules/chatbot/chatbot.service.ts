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

interface VehicleRecommendation {
  vehicleId: string;
  model: string;
  variant: string;
  manufacturer: string;
  price: number;
  score: number;
  reason: string;
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
      selectedDealerId?: string;
      preferredDate?: string;
      preferredTime?: string;
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

    // ✅ FIRST: Merge context data BEFORE adding message
    if (!session.userPreferences) {
      session.userPreferences = {};
    }
    
    const bookingInfo = (session.userPreferences as any).bookingInfo || {};
    
    // ✅ Priority: Use context data (from button clicks)
    if (context?.selectedVehicleId) {
      bookingInfo.vehicleId = context.selectedVehicleId;
      
      // Lấy vehicle info để lưu tên
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: context.selectedVehicleId },
        include: { manufacturer: true },
      });
      if (vehicle) {
        bookingInfo.vehicleModel = `${vehicle.manufacturer.name} ${vehicle.model}`;
      }
      
      console.log('✅ Context: Selected vehicleId:', context.selectedVehicleId);
    }
    
    if (context?.selectedDealerId) {
      bookingInfo.selectedDealerId = context.selectedDealerId;
      console.log('✅ Context: Selected dealerId:', context.selectedDealerId);
    }
    
    if (context?.preferredDate) {
      bookingInfo.preferredDate = context.preferredDate;
      console.log('✅ Context: Selected date:', context.preferredDate);
    }
    
    if (context?.preferredTime) {
      bookingInfo.preferredTime = context.preferredTime;
      console.log('✅ Context: Selected time:', context.preferredTime);
    }
    
    // ✅ Save immediately
    (session.userPreferences as any).bookingInfo = bookingInfo;
    
    console.log('📦 Booking Info after context merge:', bookingInfo);

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

      case 'book_test_drive':
        response = await this.handleBookTestDrive(userMessage, session);
        break;

      case 'vehicle_comparison':
        response = await this.handleVehicleComparison(userMessage, session);
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
  "intent": "vehicle_recommendation | book_test_drive | vehicle_comparison | price_inquiry | general_query",
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
- book_test_drive: Khách muốn "đặt lịch", "lái thử", "book test drive"
- vehicle_comparison: Khách hỏi "so sánh", "khác nhau", "xe nào hơn"
- price_inquiry: Khách hỏi về "giá", "bao nhiêu tiền", "chi phí"
- general_query: Các câu hỏi chung khác
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
          { label: 'Tăng ngân sách', action: 'ADJUST_BUDGET' },
          { label: 'Xem tất cả xe', action: 'VIEW_ALL_VEHICLES' },
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
      "label": "Xem chi tiết VF 8",
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
        { label: 'Xem tất cả xe', action: 'VIEW_ALL_VEHICLES' },
        { label: 'Đặt lịch lái thử', action: 'BOOK_TEST_DRIVE' },
      ],
    };
  }

  /**
   * Handle test drive booking
   */
  private async handleBookTestDrive(message: string, session: ChatContext) {
    // ✅ Initialize booking info in session
    if (!session.userPreferences) {
      session.userPreferences = {};
    }
    const bookingInfo = (session.userPreferences as any).bookingInfo || {};

    // ✅ Extract info from latest message (nhưng không override context)
    const extractedInfo = await this.extractBookingInfo(message, session);

    // ✅ Merge extracted info (ONLY if not already set by context)
    if (extractedInfo.vehicleId && !bookingInfo.vehicleId) {
      bookingInfo.vehicleId = extractedInfo.vehicleId;
    }
    if (extractedInfo.vehicleModel && !bookingInfo.vehicleModel) {
      bookingInfo.vehicleModel = extractedInfo.vehicleModel;
    }
    if (extractedInfo.contactInfo?.name && !bookingInfo.contactInfo?.name) {
      bookingInfo.contactInfo = bookingInfo.contactInfo || {};
      bookingInfo.contactInfo.name = extractedInfo.contactInfo.name;
    }
    if (extractedInfo.contactInfo?.phone && !bookingInfo.contactInfo?.phone) {
      bookingInfo.contactInfo = bookingInfo.contactInfo || {};
      bookingInfo.contactInfo.phone = extractedInfo.contactInfo.phone;
    }
    if (extractedInfo.contactInfo?.email && !bookingInfo.contactInfo?.email) {
      bookingInfo.contactInfo = bookingInfo.contactInfo || {};
      bookingInfo.contactInfo.email = extractedInfo.contactInfo.email;
    }
    if (extractedInfo.preferredDate && !bookingInfo.preferredDate) {
      bookingInfo.preferredDate = extractedInfo.preferredDate;
    }
    if (extractedInfo.preferredTime && !bookingInfo.preferredTime) {
      bookingInfo.preferredTime = extractedInfo.preferredTime;
    }
    if (extractedInfo.selectedDealerId && !bookingInfo.selectedDealerId) {
      bookingInfo.selectedDealerId = extractedInfo.selectedDealerId;
    }

    // ✅ Save back to session
    (session.userPreferences as any).bookingInfo = bookingInfo;

    // ✅ Determine next action based on what we have
    const nextAction = this.determineBookingNextAction(bookingInfo);

    console.log('📋 Booking Info:', bookingInfo);
    console.log('🎯 Next Action:', nextAction);

    // ✅ Handle each action
    if (nextAction === 'ASK_VEHICLE') {
      const popularVehicles = await prisma.vehicle.findMany({
        where: {
          status: 'ACTIVE',
          dealerInventories: { some: { available: { gt: 0 } } },
        },
        include: {
          manufacturer: true,
          dealerInventories: {
            where: { available: { gt: 0 } },
            select: { available: true },
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      return {
        reply: 'Bạn muốn lái thử mẫu xe nào? 🚗',
        nextAction,
        suggestedActions: popularVehicles.map((v) => {
          const totalAvailable = v.dealerInventories.reduce(
            (sum, inv) => sum + inv.available,
            0
          );
          return {
            label: `${v.manufacturer.name} ${v.model} (${totalAvailable} xe)`,
            action: 'SELECT_VEHICLE',
            vehicleId: v.id,
            vehicleModel: `${v.manufacturer.name} ${v.model}`,
          };
        }),
      };
    }

    if (nextAction === 'ASK_CONTACT') {
      return {
        reply: `Tuyệt vời! Để đặt lịch lái thử ${bookingInfo.vehicleModel}, vui lòng cung cấp:\n\n📝 Họ tên\n📞 Số điện thoại\n📧 Email\n\nVí dụ: "Tên tôi là Nguyễn Văn A, SĐT 0901234567, email a@gmail.com"`,
        nextAction,
      };
    }

    if (nextAction === 'ASK_DATE') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        reply: 'Bạn muốn lái thử vào thời gian nào? 📅',
        nextAction,
        suggestedActions: [
          {
            label: 'Ngày mai',
            action: 'SELECT_DATE',
            date: tomorrow.toISOString().split('T')[0],
            time: '10:00',
          },
          {
            label: 'Cuối tuần này',
            action: 'SELECT_DATE',
            date: this.getNextWeekendDate(),
            time: '14:00',
          },
          {
            label: 'Chọn ngày khác',
            action: 'CUSTOM_DATE',
          },
        ],
      };
    }

    if (nextAction === 'ASK_DEALER') {
      const dealersWithVehicle = await prisma.dealer.findMany({
        where: {
          isActive: true,
          inventories: {
            some: {
              vehicleId: bookingInfo.vehicleId,
              available: { gt: 0 },
            },
          },
        },
        select: {
          id: true,
          name: true,
          city: true,
          phone: true,
          inventories: {
            where: {
              vehicleId: bookingInfo.vehicleId,
              available: { gt: 0 },
            },
            select: { available: true },
          },
        },
      });

      if (dealersWithVehicle.length === 0) {
        return {
          reply: `Rất tiếc, hiện tại chưa có đại lý nào có sẵn ${bookingInfo.vehicleModel}. 😢\n\nBạn có muốn:\n1️⃣ Chọn mẫu xe khác\n2️⃣ Để lại thông tin, chúng tôi sẽ liên hệ khi có xe`,
          suggestedActions: [
            { label: 'Chọn xe khác', action: 'CHANGE_VEHICLE' },
            { label: 'Để lại thông tin', action: 'LEAVE_CONTACT' },
          ],
        };
      }

      return {
        reply: `Vui lòng chọn đại lý gần bạn để lái thử ${bookingInfo.vehicleModel}: 🏢`,
        dealers: dealersWithVehicle,
        suggestedActions: dealersWithVehicle.map((d) => ({
          label: `${d.name} - ${d.city} (${d.inventories[0]?.available} xe)`,
          action: 'SELECT_DEALER',
          dealerId: d.id,
        })),
      };
    }

    // ✅ CONFIRM_BOOKING - Validate and show confirmation
    if (nextAction === 'CONFIRM_BOOKING') {
      const inventory = await prisma.inventory.findUnique({
        where: {
          dealerId_vehicleId: {
            dealerId: bookingInfo.selectedDealerId,
            vehicleId: bookingInfo.vehicleId,
          },
        },
        include: {
          dealer: { select: { name: true, city: true, phone: true } },
        },
      });

      if (!inventory || inventory.available <= 0) {
        const alternativeDealers = await prisma.dealer.findMany({
          where: {
            isActive: true,
            id: { not: bookingInfo.selectedDealerId },
            inventories: {
              some: {
                vehicleId: bookingInfo.vehicleId,
                available: { gt: 0 },
              },
            },
          },
          select: {
            id: true,
            name: true,
            city: true,
            inventories: {
              where: { vehicleId: bookingInfo.vehicleId },
              select: { available: true },
            },
          },
          take: 3,
        });

        if (alternativeDealers.length === 0) {
          return {
            reply: `⚠️ Xin lỗi, xe ${bookingInfo.vehicleModel} hiện đã hết tại đại lý bạn chọn và tất cả các đại lý khác.\n\nBạn có muốn:\n1️⃣ Chọn mẫu xe tương tự\n2️⃣ Đặt trước để chờ xe về`,
            suggestedActions: [
              { label: 'Tư vấn xe khác', action: 'GET_RECOMMENDATION' },
              { label: 'Đặt trước', action: 'PRE_ORDER' },
            ],
          };
        }

        return {
          reply: `⚠️ Rất tiếc, ${bookingInfo.vehicleModel} đã hết tại đại lý bạn chọn.\n\nNhưng còn sẵn tại các đại lý sau:`,
          dealers: alternativeDealers,
          suggestedActions: alternativeDealers.map((d) => ({
            label: `${d.name} - ${d.city} (${d.inventories[0]?.available} xe)`,
            action: 'SELECT_DEALER',
            dealerId: d.id,
          })),
        };
      }

          bookingInfo.dealerName = inventory.dealer.name;
          bookingInfo.dealerCity = inventory.dealer.city;
          bookingInfo.dealerPhone = inventory.dealer.phone;
          
          (session.userPreferences as any).bookingInfo = bookingInfo;

      // ✅ ALL GOOD - Show confirmation
      const dateStr = new Date(bookingInfo.preferredDate).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      return {
        reply: `✅ Thông tin đặt lịch:\n\n Xe: ${bookingInfo.vehicleModel}\n Họ tên: ${bookingInfo.contactInfo.name}\n SĐT: ${bookingInfo.contactInfo.phone}\n Email: ${bookingInfo.contactInfo.email}\n Thời gian: ${dateStr} lúc ${bookingInfo.preferredTime || 'theo lịch đại lý'}\n Đại lý: ${inventory.dealer.name} - ${inventory.dealer.city}\n\n Xác nhận đặt lịch?`,
        bookingInfo: {
          ...bookingInfo,
          dealerName: inventory.dealer.name,
          dealerCity: inventory.dealer.city,
          dealerPhone: inventory.dealer.phone,
        },
        suggestedActions: [
          {
            label: '✅ Xác nhận đặt lịch ngay',
            action: 'CONFIRM_FINAL',
            bookingData: bookingInfo,
          },
          { label: '✏️ Chỉnh sửa thông tin', action: 'EDIT_BOOKING' },
        ],
      };
    }

    return {
      reply: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      suggestedActions: [{ label: 'Bắt đầu lại', action: 'RESTART_BOOKING' }],
    };
  }

  /**
   * ✅ NEW: Extract booking info from message
   */
  private async extractBookingInfo(message: string, session: ChatContext) {
    const conversationHistory = session.messages
      .slice(-3)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `
Trích xuất thông tin đặt lịch từ tin nhắn sau.

Hội thoại gần đây:
${conversationHistory}

Tin nhắn mới: "${message}"

Trả về JSON:
{
  "vehicleId": "id xe nếu có" hoặc null,
  "vehicleModel": "tên xe đầy đủ" hoặc null,
  "contactInfo": {
    "name": "họ tên đầy đủ" hoặc null,
    "phone": "số điện thoại (10-11 số)" hoặc null,
    "email": "email hợp lệ" hoặc null
  },
  "preferredDate": "YYYY-MM-DD" hoặc null,
  "preferredTime": "HH:MM" hoặc null,
  "selectedDealerId": "id đại lý nếu có" hoặc null
}

Lưu ý:
- Nếu user nói "ngày mai", tính từ hôm nay: ${new Date().toISOString().split('T')[0]}
- Nếu user nói "cuối tuần", lấy thứ 7 tuần này
- Phone phải có 10-11 số
- Email phải có @ và domain
`;

    try {
      const result = await GeminiClient.generateJSON(prompt, { useCache: false });
      return result;
    } catch (error) {
      console.error('Extract booking info failed:', error);
      return {};
    }
  }

  /**
   * ✅ NEW: Determine next action based on booking info
   */
  private determineBookingNextAction(bookingInfo: any): string {
    if (!bookingInfo.vehicleId) return 'ASK_VEHICLE';
    if (!bookingInfo.contactInfo?.name || !bookingInfo.contactInfo?.phone) return 'ASK_CONTACT';
    if (!bookingInfo.preferredDate) return 'ASK_DATE';
    if (!bookingInfo.selectedDealerId) return 'ASK_DEALER';
    return 'CONFIRM_BOOKING';
  }

  /**
   * Handle vehicle comparison
   */
  private async handleVehicleComparison(message: string, session: ChatContext) {
    // ✅ Initialize comparison state
    if (!session.userPreferences) {
      session.userPreferences = {};
    }
    const comparisonState = (session.userPreferences as any).comparisonState || {
      selectedVehicles: [],
    };

    // ✅ Extract vehicle from message
    const extractedVehicle = await this.extractVehicleFromMessage(message);

    if (extractedVehicle) {
      // ✅ Add to selected vehicles (avoid duplicates)
      const existingIds = comparisonState.selectedVehicles.map((v: any) => v.id);
      if (!existingIds.includes(extractedVehicle.id)) {
        comparisonState.selectedVehicles.push(extractedVehicle);
      }
    }

    // ✅ Save state
    (session.userPreferences as any).comparisonState = comparisonState;

    console.log('📊 Comparison State:', comparisonState);

    // ✅ Need at least 2 vehicles
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
      
      // Get other vehicles for comparison
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

    // ✅ Have 2+ vehicles - Do comparison
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
          { label: 'Bắt đầu lại', action: 'RESTART_COMPARISON' },
        ],
      };
    }

    // ✅ AI comparison
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

    // ✅ Clear comparison state after done
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
          label: 'So sánh xe khác',
          action: 'RESTART_COMPARISON',
        },
        {
          label: 'Đặt lịch lái thử',
          action: 'BOOK_TEST_DRIVE',
        },
      ],
    };
  }

  /**
   * ✅ NEW: Extract vehicle from message
   */
  private async extractVehicleFromMessage(message: string) {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'ACTIVE' },
      include: { manufacturer: true },
    });

    // Simple pattern matching
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
        { label: 'Xem chi tiết', action: 'VIEW_VEHICLES' },
        { label: 'Tư vấn xe phù hợp', action: 'GET_RECOMMENDATION' },
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
Nếu câu hỏi về kỹ thuật, hãy giải thích đơn giản.
Nếu không liên quan đến xe điện, hãy lịch sự chuyển hướng về sản phẩm.

Trả về JSON:
{
  "reply": "Câu trả lời",
  "suggestedActions": [
    { "label": "Xem xe điện", "action": "VIEW_VEHICLES" },
    { "label": "Tư vấn xe", "action": "GET_RECOMMENDATION" }
  ]
}
`;

    const response = await GeminiClient.generateJSON(prompt, {
      useCache: false,
    });

    return response;
  }

  /**
   * Helper: Get next weekend date
   */
  private getNextWeekendDate(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;

    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);

    return saturday.toISOString().split('T')[0];
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