/**
 * attachSession.ts
 * 
 * Session attachment middleware
 */

import type { Env } from '../config/env';
import { SessionKV } from '../storage/kv/sessionKV';
import type { SessionMetadata } from '../ai/schemas/SessionSchema';

export interface SessionContext {
  sessionId: string;
  userId: string;
  metadata?: SessionMetadata;
}

export async function attachSession(
  request: Request,
  env: Env,
  sessionId?: string,
  userId?: string
): Promise<SessionContext> {
  const sessionKV = new SessionKV(env);
  
  const finalSessionId = sessionId || crypto.randomUUID();
  const finalUserId = userId || request.headers.get('CF-Connecting-IP') || 'unknown';

  // Try to load existing session
  const metadata = await sessionKV.get(finalSessionId);

  return {
    sessionId: finalSessionId,
    userId: finalUserId,
    metadata: metadata || undefined,
  };
}



