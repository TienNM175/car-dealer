import { Redis } from "@upstash/redis";

// For development, we'll use a simple in-memory store
// In production, you should use actual Redis
let redisStore: Map<string, string> = new Map();

export const redis = {
  async get(key: string): Promise<string | null> {
    return redisStore.get(key) || null;
  },

  async set(
    key: string,
    value: string,
    options?: { ex?: number }
  ): Promise<string> {
    redisStore.set(key, value);
    return "OK";
  },

  async exists(key: string): Promise<number> {
    return redisStore.has(key) ? 1 : 0;
  },

  async del(key: string): Promise<number> {
    return redisStore.delete(key) ? 1 : 0;
  },
};
