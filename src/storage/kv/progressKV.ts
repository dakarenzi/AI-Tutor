/**
 * progressKV.ts
 * 
 * KV operations for progress data
 */

import type { Env } from '../../config/env';
import type { ProgressEntry } from '../../ai/memory/MemorySchema';

export interface ProgressData {
  userId: string;
  entries: ProgressEntry[];
  lastUpdated: number;
}

export class ProgressKV {
  private kv: KVNamespace;

  constructor(env: Env) {
    this.kv = env.PROGRESS_KV;
  }

  /**
   * Get progress data for a user
   */
  async get(userId: string): Promise<ProgressData | null> {
    try {
      const value = await this.kv.get(`progress:${userId}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting progress from KV:', error);
      return null;
    }
  }

  /**
   * Set progress data for a user
   */
  async set(userId: string, data: ProgressData): Promise<void> {
    try {
      await this.kv.put(
        `progress:${userId}`,
        JSON.stringify({ ...data, lastUpdated: Date.now() })
      );
    } catch (error) {
      console.error('Error setting progress in KV:', error);
      throw error;
    }
  }

  /**
   * Add a progress entry
   */
  async addEntry(userId: string, entry: ProgressEntry): Promise<void> {
    const current = await this.get(userId);
    const updated: ProgressData = {
      userId,
      entries: current ? [...current.entries, entry] : [entry],
      lastUpdated: Date.now(),
    };
    await this.set(userId, updated);
  }

  /**
   * Get recent entries
   */
  async getRecentEntries(userId: string, limit: number = 10): Promise<ProgressEntry[]> {
    const data = await this.get(userId);
    if (!data) return [];
    return data.entries.slice(-limit);
  }
}



