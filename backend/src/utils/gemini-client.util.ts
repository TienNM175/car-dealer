import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import crypto from 'crypto';

/**
 * Gemini AI Client Utility
 * Wrapper for Google Gemini with error handling + Smart Cache 2.2 (SHA256 key)
 */
export class GeminiClient {
  private static instance: GoogleGenerativeAI;
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get Gemini AI instance
   */
  static getInstance(): GoogleGenerativeAI {
    if (!this.instance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }
      this.instance = new GoogleGenerativeAI(apiKey);
    }
    return this.instance;
  }

  /**
   * Get model with safety settings
   */
  static getModel(
    modelName: 'gemini-2.0-flash-exp' | 'gemini-1.5-flash' = 'gemini-2.0-flash-exp'
  ) {
    const genAI = this.getInstance();

    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  /**
   * Generate JSON response with Smart Cache
   */
  static async generateJSON(
    prompt: string,
    options?: {
      systemInstruction?: string;
      useCache?: boolean;
      periodKey?: string; 
    }
  ): Promise<any> {
    const { systemInstruction, useCache = true, periodKey } = options || {};

    // ✅ Smart cache key: phân biệt period, date range, systemInstruction
    if (useCache) {
      const cacheKey = this.getCacheKey(prompt, systemInstruction, periodKey);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('✅ Gemini smart cache hit:', cacheKey);
        return cached;
      }
    }

    try {
      const model = this.getModel();

      // Build full prompt
      const fullPrompt = systemInstruction
        ? `${systemInstruction}\n\n${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`
        : `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      let text = response.text();

      // Clean response - remove markdown code blocks if present
      text = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse JSON
      const jsonData = JSON.parse(text);

      // Cache result
      if (useCache) {
        const cacheKey = this.getCacheKey(prompt, systemInstruction, periodKey);
        this.setCache(cacheKey, jsonData);
        console.log('💾 Gemini cache stored:', cacheKey);
      }

      return jsonData;
    } catch (error: any) {
      console.error('Gemini API Error:', error.message);

      if (error.message.includes('quota')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      }

      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * 🧠 Smart Cache Key Builder (SHA256 Hash)
   * → Phân biệt dữ liệu theo periodKey, systemInstruction, prompt
   */
  private static getCacheKey(
    prompt: string,
    systemInstruction?: string,
    periodKey?: string
  ): string {
    // Ưu tiên periodKey (nếu có), fallback sang prompt
    const baseKey = periodKey
      ? `${systemInstruction || ''}:${periodKey}`
      : `${systemInstruction || ''}:${prompt}`;

    // ⚙️ Hash SHA256 đảm bảo duy nhất tuyệt đối
    const hash = crypto.createHash('sha256').update(baseKey).digest('hex');
    return hash;
  }

  /**
   * Cache management
   */
  private static getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check expiration
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Prevent memory leaks
    if (this.cache.size > 200) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * Manual cache clear
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🧹 Gemini cache cleared.');
  }
}
