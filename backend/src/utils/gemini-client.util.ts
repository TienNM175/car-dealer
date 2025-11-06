import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import crypto from 'crypto';

interface KeyStats {
  keyId: string;
  failCount: number;
  lastUsed: number;
  quotaExceeded: boolean;
}

/**
 * Gemini AI Client - Dual Account Support
 * Tự động balance giữa 2 API keys từ 2 accounts khác nhau
 */
export class GeminiClient {
  private static instances: Map<string, GoogleGenerativeAI> = new Map();
  private static keyStats: Map<string, KeyStats> = new Map();
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private static lastKeyUsed = 'PRIMARY';

  private static readonly apiKeys = {
    PRIMARY: process.env.GEMINI_API_KEY_PRIMARY,
    SECONDARY: process.env.GEMINI_API_KEY_SECONDARY,
  };

  static {
    // Initialize key stats
    this.keyStats.set('PRIMARY', {
      keyId: 'PRIMARY',
      failCount: 0,
      lastUsed: 0,
      quotaExceeded: false,
    });
    this.keyStats.set('SECONDARY', {
      keyId: 'SECONDARY',
      failCount: 0,
      lastUsed: 0,
      quotaExceeded: false,
    });

    // Validate keys on startup
    if (!this.apiKeys.PRIMARY && !this.apiKeys.SECONDARY) {
      throw new Error(
        'Missing Gemini API keys! Set GEMINI_API_KEY_PRIMARY and GEMINI_API_KEY_SECONDARY in .env'
      );
    }

    if (!this.apiKeys.PRIMARY) {
      console.warn(' GEMINI_API_KEY_PRIMARY not found, using SECONDARY only');
    }
    if (!this.apiKeys.SECONDARY) {
      console.warn(' GEMINI_API_KEY_SECONDARY not found, using PRIMARY only');
    }

    console.log(' GeminiClient initialized with dual-account support');
  }

  /**
   * Chọn key tốt nhất (health check)
   */
  private static selectBestKey(): string {
    const primary = this.keyStats.get('PRIMARY');
    const secondary = this.keyStats.get('SECONDARY');

    // Nếu 1 trong 2 hết quota, dùng cái còn lại
    if (primary?.quotaExceeded && !secondary?.quotaExceeded) {
      console.log(' PRIMARY quota exceeded, switching to SECONDARY');
      return 'SECONDARY';
    }
    if (secondary?.quotaExceeded && !primary?.quotaExceeded) {
      console.log(' SECONDARY quota exceeded, switching to PRIMARY');
      return 'PRIMARY';
    }

    // Cả 2 ok -> chọn cái có ít lỗi hơn
    const primaryFails = primary?.failCount || 0;
    const secondaryFails = secondary?.failCount || 0;

    if (primaryFails < secondaryFails) {
      return 'PRIMARY';
    } else if (secondaryFails < primaryFails) {
      return 'SECONDARY';
    }

    // Nếu bằng nhau -> alternate
    return this.lastKeyUsed === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
  }

  /**
   * Get Gemini instance với key được chọn
   */
  static getInstance(keyId?: string): GoogleGenerativeAI {
    const selectedKey = keyId || this.selectBestKey();
    const apiKey = this.apiKeys[selectedKey as keyof typeof this.apiKeys];

    if (!apiKey) {
      throw new Error(`API key not found for ${selectedKey}`);
    }

    if (!this.instances.has(selectedKey)) {
      this.instances.set(selectedKey, new GoogleGenerativeAI(apiKey));
      console.log(`🔑 Initialized Gemini instance: ${selectedKey}`);
    }

    this.lastKeyUsed = selectedKey;
    const stats = this.keyStats.get(selectedKey);
    if (stats) {
      stats.lastUsed = Date.now();
    }

    return this.instances.get(selectedKey)!;
  }

  /**
   * Get model với safety settings
   */
  static getModel(modelName: 'gemini-2.0-flash-exp' | 'gemini-1.5-flash' = 'gemini-2.0-flash-exp') {
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
   * Generate JSON response với Smart Cache + Retry logic
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

    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(prompt, systemInstruction, periodKey);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(' Cache hit:', cacheKey.slice(0, 8) + '...');
        return cached;
      }
    }

    let lastError: any;

    // Try with PRIMARY key first
    try {
      return await this.attemptGenerateJSON(
        prompt,
        systemInstruction,
        useCache,
        periodKey,
        'PRIMARY'
      );
    } catch (error: any) {
      console.warn('⚠️ PRIMARY key failed:', error.message);
      lastError = error;

      // Mark PRIMARY as failed
      const primaryStats = this.keyStats.get('PRIMARY');
      if (primaryStats) {
        primaryStats.failCount++;
        if (error.message.includes('quota')) {
          primaryStats.quotaExceeded = true;
          console.error(' PRIMARY key quota exceeded!');
        }
      }

      // Retry với SECONDARY
      try {
        console.log('🔄 Retrying with SECONDARY key...');
        return await this.attemptGenerateJSON(
          prompt,
          systemInstruction,
          useCache,
          periodKey,
          'SECONDARY'
        );
      } catch (secondaryError: any) {
        console.error(' SECONDARY key also failed:', secondaryError.message);

        const secondaryStats = this.keyStats.get('SECONDARY');
        if (secondaryStats) {
          secondaryStats.failCount++;
          if (secondaryError.message.includes('quota')) {
            secondaryStats.quotaExceeded = true;
          }
        }

        throw new Error(
          `Both API keys failed:\nPRIMARY: ${lastError.message}\nSECONDARY: ${secondaryError.message}`
        );
      }
    }
  }

  /**
   * Attempt to generate JSON with specific key
   */
  private static async attemptGenerateJSON(
    prompt: string,
    systemInstruction: string | undefined,
    useCache: boolean,
    periodKey: string | undefined,
    keyId: string
  ): Promise<any> {
    try {
      const model = this.getModel();

      const fullPrompt = systemInstruction
        ? `${systemInstruction}\n\n${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`
        : `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      let text = response.text();

      // Clean response
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const jsonData = JSON.parse(text);

      // Cache result
      if (useCache) {
        const cacheKey = this.getCacheKey(prompt, systemInstruction, periodKey);
        this.setCache(cacheKey, jsonData);
        console.log(` Cached (${keyId}):`, cacheKey.slice(0, 8) + '...');
      }

      // Reset fail count on success
      const stats = this.keyStats.get(keyId);
      if (stats && stats.failCount > 0) {
        console.log(` ${keyId} recovered! Fail count reset.`);
        stats.failCount = 0;
      }

      return jsonData;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Smart Cache Key Builder (SHA256)
   */
  private static getCacheKey(
    prompt: string,
    systemInstruction?: string,
    periodKey?: string
  ): string {
    const baseKey = periodKey
      ? `${systemInstruction || ''}:${periodKey}`
      : `${systemInstruction || ''}:${prompt}`;

    return crypto.createHash('sha256').update(baseKey).digest('hex');
  }

  /**
   * Cache management
   */
  private static getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Prevent memory leaks
    if (this.cache.size > 300) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Get status của cả 2 keys
   */
  static getStatus() {
    const primary = this.keyStats.get('PRIMARY');
    const secondary = this.keyStats.get('SECONDARY');

    return {
      primary: {
        available: !!this.apiKeys.PRIMARY,
        failCount: primary?.failCount || 0,
        quotaExceeded: primary?.quotaExceeded || false,
        lastUsed: primary?.lastUsed ? new Date(primary.lastUsed).toISOString() : null,
      },
      secondary: {
        available: !!this.apiKeys.SECONDARY,
        failCount: secondary?.failCount || 0,
        quotaExceeded: secondary?.quotaExceeded || false,
        lastUsed: secondary?.lastUsed ? new Date(secondary.lastUsed).toISOString() : null,
      },
      cacheSize: this.cache.size,
      lastKeyUsed: this.lastKeyUsed,
    };
  }

  /**
   * Reset key stats (dùng sau khi quota reset)
   */
  static resetKeyStats(): void {
    this.keyStats.forEach((stats) => {
      stats.failCount = 0;
      stats.quotaExceeded = false;
    });
    console.log('🔄 Key stats reset');
  }
}