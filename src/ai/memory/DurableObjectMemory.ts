/**
 * DurableObjectMemory.ts
 * 
 * Durable Object implementation for long-term memory
 */

import type { LongTermMemory } from './LongTermMemory';
import type { MemoryData } from './MemorySchema';
import type { Message } from '../schemas/AgentRequest';
import type { Env } from '../../config/env';

export class DurableObjectMemory implements LongTermMemory {
  private env: Env;
  private namespace: DurableObjectNamespace;

  constructor(env: Env) {
    this.env = env;
    this.namespace = env.SESSION_MANAGER;
  }

  /**
   * Get Durable Object stub for a session
   */
  private getStub(sessionId: string): DurableObjectStub {
    const id = this.namespace.idFromName(sessionId);
    return this.namespace.get(id);
  }

  async load(sessionId: string): Promise<MemoryData | null> {
    try {
      const stub = this.getStub(sessionId);
      const response = await stub.fetch('http://memory/load', {
        method: 'GET',
      });
      
      if (response.status === 404) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading memory:', error);
      return null;
    }
  }

  async save(sessionId: string, data: MemoryData): Promise<void> {
    try {
      const stub = this.getStub(sessionId);
      await stub.fetch('http://memory/save', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error saving memory:', error);
      throw error;
    }
  }

  async update(sessionId: string, updates: Partial<MemoryData>): Promise<void> {
    try {
      const stub = this.getStub(sessionId);
      await stub.fetch('http://memory/update', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Error updating memory:', error);
      throw error;
    }
  }

  async addMessage(sessionId: string, message: Message): Promise<void> {
    try {
      const stub = this.getStub(sessionId);
      await stub.fetch('http://memory/message', {
        method: 'POST',
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    try {
      const stub = this.getStub(sessionId);
      const url = limit
        ? `http://memory/history?limit=${limit}`
        : 'http://memory/history';
      const response = await stub.fetch(url, {
        method: 'GET',
      });

      if (response.status === 404) {
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  async clear(sessionId: string): Promise<void> {
    try {
      const stub = this.getStub(sessionId);
      await stub.fetch('http://memory/clear', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error clearing memory:', error);
      throw error;
    }
  }
}



