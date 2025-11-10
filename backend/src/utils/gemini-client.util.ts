import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import crypto from "crypto";

interface KeyStats {
  keyId: string;
  failCount: number;
  lastUsed: number;
  quotaExceeded: boolean;
}

interface ModelStats {
  modelName: string;
  failCount: number;
  quotaExceeded: boolean;
}

export class GeminiClient {
  // ===============================
  // Instances & Stats
  // ===============================
  private static instances: Map<string, GoogleGenerativeAI> = new Map();
  private static keyStats: Map<string, KeyStats> = new Map();
  private static modelStats: Map<string, ModelStats> = new Map();
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private static lastKeyUsed = "PRIMARY";

  private static readonly apiKeys = {
    PRIMARY: process.env.GEMINI_API_KEY_PRIMARY,
    SECONDARY: process.env.GEMINI_API_KEY_SECONDARY,
  };

  private static readonly models = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-exp	",
  ];

  static {
    // Initialize key stats
    this.keyStats.set("PRIMARY", { keyId: "PRIMARY", failCount: 0, lastUsed: 0, quotaExceeded: false });
    this.keyStats.set("SECONDARY", { keyId: "SECONDARY", failCount: 0, lastUsed: 0, quotaExceeded: false });

    // Initialize model stats
    this.models.forEach((m) => this.modelStats.set(m, { modelName: m, failCount: 0, quotaExceeded: false }));

    if (!this.apiKeys.PRIMARY && !this.apiKeys.SECONDARY) {
      console.warn("  Gemini API keys not found! Running in limited mode.");
    }
  }

  // ===============================
  // Key & Model Selection
  // ===============================
  private static hasValidKeys(): boolean {
    return !!(this.apiKeys.PRIMARY || this.apiKeys.SECONDARY);
  }

  private static selectBestKey(): string {
    if (!this.hasValidKeys()) return "PRIMARY";

    const primary = this.keyStats.get("PRIMARY");
    const secondary = this.keyStats.get("SECONDARY");

    if (primary?.quotaExceeded && !secondary?.quotaExceeded) return "SECONDARY";
    if (secondary?.quotaExceeded && !primary?.quotaExceeded) return "PRIMARY";

    const primaryFails = primary?.failCount || 0;
    const secondaryFails = secondary?.failCount || 0;

    if (primaryFails < secondaryFails) return "PRIMARY";
    if (secondaryFails < primaryFails) return "SECONDARY";

    return this.lastKeyUsed === "PRIMARY" ? "SECONDARY" : "PRIMARY";
  }

  private static selectBestModel(): string {
    for (const m of this.models) {
      const stats = this.modelStats.get(m);
      if (stats && !stats.quotaExceeded) return m;
    }
    return this.models[0]; // fallback
  }

  // ===============================
  // Gemini Instance
  // ===============================
  static getInstance(keyId?: string): GoogleGenerativeAI {
    if (!this.hasValidKeys()) return new GoogleGenerativeAI("mock-key-for-fallback");

    const selectedKey = keyId || this.selectBestKey();
    const apiKey = this.apiKeys[selectedKey as keyof typeof this.apiKeys];
    if (!apiKey) throw new Error(`API key not found for ${selectedKey}`);

    if (!this.instances.has(selectedKey)) {
      this.instances.set(selectedKey, new GoogleGenerativeAI(apiKey));
      console.log(` Initialized Gemini instance: ${selectedKey}`);
    }

    this.lastKeyUsed = selectedKey;
    const stats = this.keyStats.get(selectedKey);
    if (stats) stats.lastUsed = Date.now();

    return this.instances.get(selectedKey)!;
  }

  // ===============================
  // Model
  // ===============================
  static getModel(modelName?: string) {
    const name = modelName || this.selectBestModel();
    const genAI = this.getInstance();

    return genAI.getGenerativeModel({
      model: name,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });
  }

  // ===============================
  // Smart Cache
  // ===============================
  private static getCacheKey(prompt: string, systemInstruction?: string, periodKey?: string): string {
    const baseKey = periodKey ? `${systemInstruction || ""}:${periodKey}` : `${systemInstruction || ""}:${prompt}`;
    return crypto.createHash("sha256").update(baseKey).digest("hex");
  }

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
    if (this.cache.size > 300) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  // ===============================
  // Fallback
  // ===============================
  private static getFallbackResponse(prompt: string): any {
    console.warn("🔧 Gemini AI: Running in fallback mode (no API keys/models)");
    return { message: "Tính năng AI tạm thời không khả dụng", status: "fallback_mode" };
  }

  // ===============================
  // Generate JSON with retry model + key
  // ===============================
  static async generateJSON(prompt: string, options?: { systemInstruction?: string; useCache?: boolean; periodKey?: string }): Promise<any> {
    const { systemInstruction, useCache = true, periodKey } = options || {};
    if (!this.hasValidKeys()) return this.getFallbackResponse(prompt);

    const cacheKey = this.getCacheKey(prompt, systemInstruction, periodKey);
    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const triedModels: string[] = [];
    let lastError: any;

    while (triedModels.length < this.models.length) {
      const modelName = this.selectBestModel();
      if (triedModels.includes(modelName)) break;
      triedModels.push(modelName);

      try {
        const model = this.getModel(modelName);
        const fullPrompt = systemInstruction
          ? `${systemInstruction}\n\n${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`
          : `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanations.`;

        const result = await model.generateContent(fullPrompt);
        let text = result.response.text().replace(/```json\n?|```\n?/g, "").trim();
        const jsonData = JSON.parse(text);

        if (useCache) this.setCache(cacheKey, jsonData);
        this.modelStats.get(modelName)!.failCount = 0;
        return jsonData;
      } catch (error: any) {
        const stats = this.modelStats.get(modelName);
        if (stats) {
          stats.failCount++;
          if (error.message.includes("quota")) stats.quotaExceeded = true;
        }
        lastError = error;
      }
    }

    return this.getFallbackResponse(prompt);
  }

  // ===============================
  // Simple text
  // ===============================
  static async generateText(prompt: string): Promise<string> {
    if (!this.hasValidKeys()) return "Tính năng AI tạm thời không khả dụng.";

    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error(" Gemini text generation failed:", error.message);
      return "Lỗi khi tạo phản hồi AI. Vui lòng thử lại sau.";
    }
  }

  // ===============================
  // Utilities
  // ===============================
  static clearCache(): void { this.cache.clear(); }
  static resetKeyStats(): void {
    this.keyStats.forEach((s) => { s.failCount = 0; s.quotaExceeded = false; });
    this.modelStats.forEach((s) => { s.failCount = 0; s.quotaExceeded = false; });
  }
  static getStatus() {
    const primary = this.keyStats.get("PRIMARY");
    const secondary = this.keyStats.get("SECONDARY");
    return {
      primary: { available: !!this.apiKeys.PRIMARY, failCount: primary?.failCount || 0, quotaExceeded: primary?.quotaExceeded || false },
      secondary: { available: !!this.apiKeys.SECONDARY, failCount: secondary?.failCount || 0, quotaExceeded: secondary?.quotaExceeded || false },
      models: Array.from(this.modelStats.values()),
      cacheSize: this.cache.size,
      lastKeyUsed: this.lastKeyUsed,
      hasValidKeys: this.hasValidKeys(),
      mode: this.hasValidKeys() ? "full" : "fallback",
    };
  }
}
