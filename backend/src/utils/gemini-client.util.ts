// src/utils/gemini-client.util.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Gemini AI Client Utility
 * Wrapper for Google Gemini with error handling
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
   * Generate JSON response
   */
  static async generateJSON(
    prompt: string,
    options?: {
      systemInstruction?: string;
      useCache?: boolean;
    }
  ): Promise<any> {
    const { systemInstruction, useCache = true } = options || {};

    // Check cache
    if (useCache) {
      const cacheKey = this.getCacheKey(prompt, systemInstruction);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('✅ Gemini cache hit');
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
        const cacheKey = this.getCacheKey(prompt, systemInstruction);
        this.setCache(cacheKey, jsonData);
      }

      return jsonData;
    } catch (error: any) {
      console.error('Gemini API Error:', error.message);
      
      // Provide fallback for common errors
      if (error.message.includes('quota')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      }
      
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Cache management
   */
  private static getCacheKey(prompt: string, systemInstruction?: string): string {
    const combined = `${systemInstruction || ''}:${prompt}`;
    return Buffer.from(combined).toString('base64').slice(0, 50);
  }

  private static getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}