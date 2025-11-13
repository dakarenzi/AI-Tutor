/**
 * sessionKV.ts
 * 
 * KV operations for session metadata
 */

import type { Env } from '../../config/env';
import type { SessionMetadata } from '../../ai/schemas/SessionSchema';

export class SessionKV {
  private kv: KVNamespace;

  constructor(env: Env) {
    this.kv = env.SESSION_KV;
  }

  /**
   * Get session metadata
   */
  async get(sessionId: string): Promise<SessionMetadata | null> {
    try {
      const value = await this.kv.get(`session:${sessionId}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting session from KV:', error);
      return null;
    }
  }

  /**
   * Set session metadata
   */
  async set(sessionId: string, metadata: SessionMetadata, ttl?: number): Promise<void> {
    try {
      const options: KVNamespacePutOptions = {};
      if (ttl) {
        options.expirationTtl = ttl;
      }
      await this.kv.put(`session:${sessionId}`, JSON.stringify(metadata), options);
    } catch (error) {
      console.error('Error setting session in KV:', error);
      throw error;
    }
  }

  /**
   * Update session metadata
   */
  async update(sessionId: string, updates: Partial<SessionMetadata>): Promise<void> {
    const current = await this.get(sessionId);
    if (current) {
      await this.set(sessionId, { ...current, ...updates, lastUpdated: Date.now() });
    }
  }

  /**
   * Delete session metadata
   */
  async delete(sessionId: string): Promise<void> {
    try {
      await this.kv.delete(`session:${sessionId}`);
    } catch (error) {
      console.error('Error deleting session from KV:', error);
      throw error;
    }
  }
}



