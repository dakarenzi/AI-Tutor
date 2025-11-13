/**
 * RateLimiter.ts
 * 
 * IP-based, user-based, and session-based rate limiting
 * KV-backed counters for edge-safe implementation
 */

import type { Env } from '../../config/env';
import { SETTINGS } from '../../config/settings';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export class RateLimiter {
  private env: Env;
  private perMinute: number;
  private perHour: number;
  private perDay: number;

  constructor(env: Env) {
    this.env = env;
    this.perMinute = SETTINGS.RATE_LIMIT.PER_MINUTE;
    this.perHour = SETTINGS.RATE_LIMIT.PER_HOUR;
    this.perDay = SETTINGS.RATE_LIMIT.PER_DAY;
  }

  /**
   * Check rate limit for an identifier (IP, user, or session)
   */
  async checkLimit(
    identifier: string,
    type: 'ip' | 'user' | 'session' = 'ip'
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const minuteKey = `${type}:${identifier}:minute:${Math.floor(now / 60000)}`;
    const hourKey = `${type}:${identifier}:hour:${Math.floor(now / 3600000)}`;
    const dayKey = `${type}:${identifier}:day:${Math.floor(now / 86400000)}`;

    // Check all limits
    const [minuteCount, hourCount, dayCount] = await Promise.all([
      this.getCount(minuteKey),
      this.getCount(hourKey),
      this.getCount(dayKey),
    ]);

    // Determine which limit is most restrictive
    const limits = [
      { count: minuteCount, limit: this.perMinute, window: 60000 },
      { count: hourCount, limit: this.perHour, window: 3600000 },
      { count: dayCount, limit: this.perDay, window: 86400000 },
    ];

    const mostRestrictive = limits.reduce((prev, curr) => {
      const prevRatio = prev.count / prev.limit;
      const currRatio = curr.count / curr.limit;
      return currRatio > prevRatio ? curr : prev;
    });

    const allowed = mostRestrictive.count < mostRestrictive.limit;

    if (allowed) {
      // Increment counters
      await Promise.all([
        this.incrementCount(minuteKey, 60),
        this.incrementCount(hourKey, 3600),
        this.incrementCount(dayKey, 86400),
      ]);
    }

    return {
      allowed,
      remaining: Math.max(0, mostRestrictive.limit - mostRestrictive.count - (allowed ? 1 : 0)),
      resetAt: now + mostRestrictive.window,
      limit: mostRestrictive.limit,
    };
  }

  /**
   * Get count from KV
   */
  private async getCount(key: string): Promise<number> {
    try {
      const value = await this.env.SESSION_KV.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Error reading rate limit from KV:', error);
      return 0; // Fail open
    }
  }

  /**
   * Increment count in KV with expiration
   */
  private async incrementCount(key: string, ttlSeconds: number): Promise<void> {
    try {
      const current = await this.getCount(key);
      await this.env.SESSION_KV.put(key, String(current + 1), {
        expirationTtl: ttlSeconds,
      });
    } catch (error) {
      console.error('Error incrementing rate limit in KV:', error);
      // Fail silently to avoid breaking the request
    }
  }

  /**
   * Get client IP from request
   */
  static getClientIP(request: Request): string {
    // Try CF-Connecting-IP header (Cloudflare)
    const cfIP = request.headers.get('CF-Connecting-IP');
    if (cfIP) return cfIP;

    // Fallback to X-Forwarded-For
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    // Last resort
    return 'unknown';
  }
}



