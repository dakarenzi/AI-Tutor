/**
 * ShortTermMemory.ts
 * 
 * Store last ~5 messages in memory
 */

import type { Message } from '../schemas/AgentRequest';
import { SETTINGS } from '../../config/settings';

export class ShortTermMemory {
  private messages: Message[] = [];
  private maxMessages: number;

  constructor(maxMessages: number = SETTINGS.MEMORY.SHORT_TERM_MESSAGE_COUNT) {
    this.maxMessages = maxMessages;
  }

  /**
   * Add a message to short-term memory
   */
  addMessage(message: Message): void {
    this.messages.push({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });

    // Keep only the last N messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * Get recent messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get last N messages
   */
  getLastMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }

  /**
   * Clear memory
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Get message count
   */
  getCount(): number {
    return this.messages.length;
  }
}



