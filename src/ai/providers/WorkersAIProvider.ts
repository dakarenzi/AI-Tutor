/**
 * WorkersAIProvider.ts
 * 
 * Wrapper for Cloudflare Workers AI
 * Handles AI model calls, errors, retries, and response formatting
 */

import type { Env } from '../../config/env';
import { SETTINGS } from '../../config/settings';

export interface AIRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
}

export class WorkersAIProvider {
  private env: Env;
  private defaultModel: string;
  private maxTokens: number;
  private temperature: number;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(env: Env) {
    this.env = env;
    this.defaultModel = SETTINGS.AI.DEFAULT_MODEL;
    this.maxTokens = SETTINGS.AI.MAX_TOKENS;
    this.temperature = SETTINGS.AI.TEMPERATURE;
    this.timeoutMs = SETTINGS.AI.TIMEOUT_MS;
    this.maxRetries = SETTINGS.AI.MAX_RETRIES;
  }

  /**
   * Generate a response using Workers AI
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callAI(request);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error && error.message.includes('timeout')) {
          throw new Error(`AI request timed out after ${this.timeoutMs}ms`);
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          await this.sleep(Math.min(1000 * Math.pow(2, attempt), 5000));
        }
      }
    }

    throw new Error(`AI request failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Call Workers AI API
   */
  private async callAI(request: AIRequest): Promise<AIResponse> {
    if (!this.env.AI) {
      throw new Error('Workers AI binding not available');
    }

    const model = this.defaultModel;
    const messages = request.messages || [];
    const systemInstruction = request.systemInstruction || '';
    const maxTokens = request.maxTokens || this.maxTokens;
    const temperature = request.temperature ?? this.temperature;

    // Prepare the request
    const aiRequest: any = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    if (systemInstruction) {
      aiRequest.system = systemInstruction;
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, this.timeoutMs);
    });

    // Race between AI call and timeout
    const aiCallPromise = this.env.AI.run(model, {
      messages,
      system: systemInstruction,
      max_tokens: maxTokens,
      temperature,
    });

    const response = await Promise.race([aiCallPromise, timeoutPromise]);

    // Extract text from response
    // Workers AI response format may vary, adjust based on actual API
    let text = '';
    if (response && typeof response === 'object') {
      // Handle different response formats
      if ('response' in response && typeof response.response === 'string') {
        text = response.response;
      } else if ('text' in response && typeof response.text === 'string') {
        text = response.text;
      } else if (Array.isArray(response) && response.length > 0) {
        text = String(response[0]);
      } else {
        text = JSON.stringify(response);
      }
    } else if (typeof response === 'string') {
      text = response;
    } else {
      throw new Error('Unexpected response format from Workers AI');
    }

    return {
      text: text.trim(),
      model,
      finishReason: 'stop',
    };
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set model
   */
  setModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Set temperature
   */
  setTemperature(temperature: number): void {
    this.temperature = temperature;
  }
}



