/**
 * DurableObjectSessions.ts
 * 
 * Durable Object class for session management
 */

import type { MemoryData } from '../ai/memory/MemorySchema';
import type { Message } from '../ai/schemas/AgentRequest';

export class SessionManager implements DurableObject {
  private state: DurableObjectState;
  private memory: MemoryData | null = null;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/memory/load' && request.method === 'GET') {
        return this.handleLoad();
      } else if (path === '/memory/save' && request.method === 'POST') {
        return this.handleSave(request);
      } else if (path === '/memory/update' && request.method === 'PATCH') {
        return this.handleUpdate(request);
      } else if (path === '/memory/message' && request.method === 'POST') {
        return this.handleAddMessage(request);
      } else if (path === '/memory/history' && request.method === 'GET') {
        return this.handleGetHistory(request);
      } else if (path === '/memory/clear' && request.method === 'DELETE') {
        return this.handleClear();
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Durable Object error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  private async handleLoad(): Promise<Response> {
    if (!this.memory) {
      // Try to load from storage
      const stored = await this.state.storage.get<MemoryData>('memory');
      if (stored) {
        this.memory = stored;
      } else {
        return new Response('Not Found', { status: 404 });
      }
    }

    return new Response(JSON.stringify(this.memory), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleSave(request: Request): Promise<Response> {
    const data = await request.json<MemoryData>();
    this.memory = {
      ...data,
      lastUpdated: Date.now(),
      createdAt: data.createdAt || Date.now(),
    };

    await this.state.storage.put('memory', this.memory);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleUpdate(request: Request): Promise<Response> {
    if (!this.memory) {
      const stored = await this.state.storage.get<MemoryData>('memory');
      this.memory = stored || this.getDefaultMemory();
    }

    const updates = await request.json<Partial<MemoryData>>();
    this.memory = {
      ...this.memory,
      ...updates,
      lastUpdated: Date.now(),
    };

    await this.state.storage.put('memory', this.memory);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleAddMessage(request: Request): Promise<Response> {
    if (!this.memory) {
      const stored = await this.state.storage.get<MemoryData>('memory');
      this.memory = stored || this.getDefaultMemory();
    }

    const message = await request.json<Message>();
    this.memory.recentMessages.push({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });

    // Keep only last 5 messages
    if (this.memory.recentMessages.length > 5) {
      this.memory.recentMessages = this.memory.recentMessages.slice(-5);
    }

    await this.state.storage.put('memory', this.memory);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleGetHistory(request: Request): Promise<Response> {
    if (!this.memory) {
      const stored = await this.state.storage.get<MemoryData>('memory');
      if (!stored) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      this.memory = stored;
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const messages = limit
      ? this.memory.recentMessages.slice(-parseInt(limit))
      : this.memory.recentMessages;

    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleClear(): Promise<Response> {
    this.memory = this.getDefaultMemory();
    await this.state.storage.deleteAll();
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private getDefaultMemory(): MemoryData {
    return {
      recentMessages: [],
      strengths: [],
      weaknesses: [],
      progressHistory: [],
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    };
  }
}

