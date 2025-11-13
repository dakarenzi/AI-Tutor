/**
 * LongTermMemory.ts
 * 
 * Interface for Durable Object storage
 */

import type { MemoryData } from './MemorySchema';
import type { Message } from '../schemas/AgentRequest';

export interface LongTermMemory {
  /**
   * Load memory data for a session
   */
  load(sessionId: string): Promise<MemoryData | null>;

  /**
   * Save memory data for a session
   */
  save(sessionId: string, data: MemoryData): Promise<void>;

  /**
   * Update specific fields
   */
  update(sessionId: string, updates: Partial<MemoryData>): Promise<void>;

  /**
   * Add a message to conversation history
   */
  addMessage(sessionId: string, message: Message): Promise<void>;

  /**
   * Get conversation history
   */
  getHistory(sessionId: string, limit?: number): Promise<Message[]>;

  /**
   * Clear memory for a session
   */
  clear(sessionId: string): Promise<void>;
}



