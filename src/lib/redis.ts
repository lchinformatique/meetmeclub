// src/lib/redis.ts
// Redis client using Upstash REST API (edge-compatible)
// Falls back to an in-memory cache for local dev if Upstash is not configured

import { Redis } from "@upstash/redis";

const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export { redis };

// ── In-Memory Dev Store ─────────────────────────────────────────

interface MemoryEntry {
  val: any;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function getMemory(key: string): any | null {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.val;
}

function setMemory(key: string, val: any, ttlSeconds: number): void {
  memoryStore.set(key, {
    val,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

// ── Helpers ────────────────────────────────────────────────────

/** Store OTP in Redis/Memory with TTL */
export async function storeOtp(
  target: string,
  purpose: string,
  codeHash: string,
  ttlSeconds: number
) {
  const key = `otp:${purpose}:${target}`;
  if (redis) {
    await redis.setex(key, ttlSeconds, codeHash);
  } else {
    setMemory(key, codeHash, ttlSeconds);
  }
}

/** Get stored OTP hash */
export async function getOtp(
  target: string,
  purpose: string
): Promise<string | null> {
  const key = `otp:${purpose}:${target}`;
  if (redis) {
    return await redis.get<string>(key);
  } else {
    return getMemory(key);
  }
}

/** Delete OTP after use */
export async function deleteOtp(target: string, purpose: string) {
  const key = `otp:${purpose}:${target}`;
  if (redis) {
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

/** Rate limiting: increment a counter with TTL */
export async function rateLimitIncr(
  key: string,
  ttlSeconds: number
): Promise<number> {
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return count;
  } else {
    const current = getMemory(key) || 0;
    const next = current + 1;
    setMemory(key, next, ttlSeconds);
    return next;
  }
}

/** Rate limit check key for OTP send */
export function otpRateLimitKey(target: string) {
  return `ratelimit:otp:${target}`;
}
