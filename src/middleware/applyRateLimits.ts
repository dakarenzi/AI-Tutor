/**
 * applyRateLimits.ts
 * 
 * Rate limiting middleware
 */

import type { Env } from '../config/env';
import { RateLimiter, type RateLimitResult } from '../ai/providers/RateLimiter';

export async function applyRateLimits(
  request: Request,
  env: Env,
  identifier: string,
  type: 'ip' | 'user' | 'session' = 'ip'
): Promise<RateLimitResult> {
  const rateLimiter = new RateLimiter(env);
  return await rateLimiter.checkLimit(identifier, type);
}



