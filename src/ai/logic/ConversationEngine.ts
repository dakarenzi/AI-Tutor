/**
 * ConversationEngine.ts
 * 
 * Teaching conversation logic
 * Step-by-step teaching flow, understanding checks, adaptive explanations
 */

import type { AgentResponse } from '../schemas/AgentResponse';
import { getSystemInstruction } from '../config/IdentityRules';
import type { WorkersAIProvider } from '../providers/WorkersAIProvider';
import type { ShortTermMemory } from '../memory/ShortTermMemory';

export class ConversationEngine {
  private aiProvider: WorkersAIProvider;
  private shortTermMemory: ShortTermMemory;

  constructor(aiProvider: WorkersAIProvider, shortTermMemory: ShortTermMemory) {
    this.aiProvider = aiProvider;
    this.shortTermMemory = shortTermMemory;
  }

  /**
   * Teach a concept using step-by-step approach
   */
  async teach(message: string, history: any[]): Promise<AgentResponse> {
    const systemInstruction = `${getSystemInstruction()}

Teaching Flow:
1. Start simple - introduce the concept with a concise definition
2. Break into small steps - explain one piece at a time
3. Use examples - provide relatable examples for each step
4. Check understanding - ask a quick question after each piece
5. Adapt based on response - simplify if confused, deepen if understanding
6. Summarize - recap key points at the end
7. Ask if ready to continue - always end with a question

Keep each message short (2-3 sentences max). Use bullet points for clarity.`;

    const messages = [
      ...history.map((m: any) => ({
        role: m.role || 'user',
        content: m.content || m.message || '',
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Detect confusion signals
    const isConfused = this.detectConfusion(message, history);

    if (isConfused) {
      return await this.handleConfusion(message, history);
    }

    const aiResponse = await this.aiProvider.generate({
      messages,
      systemInstruction,
    });

    return {
      agent: 'Tutor',
      task: 'teach',
      output: {
        message: aiResponse.text,
        content: aiResponse.text,
        success: true,
        steps: this.extractSteps(aiResponse.text),
      },
      metadata: {
        timestamp: Date.now(),
        modelUsed: aiResponse.model,
      },
    };
  }

  /**
   * Detect confusion signals
   */
  private detectConfusion(message: string, history: any[]): boolean {
    const confusionSignals = [
      /(i don't? (understand|get it)|confused|not sure|unclear|help)/i,
      /(what\?|huh\?|i'm lost|doesn't make sense)/i,
    ];

    const messageLower = message.toLowerCase();
    if (confusionSignals.some((pattern) => pattern.test(messageLower))) {
      return true;
    }

    // Check for repeated errors in history
    const recentMessages = history.slice(-3);
    const errorCount = recentMessages.filter((m: any) => {
      const content = (m.content || m.message || '').toLowerCase();
      return content.includes('wrong') || content.includes('incorrect');
    }).length;

    return errorCount >= 2;
  }

  /**
   * Handle confusion with re-explanation
   */
  private async handleConfusion(
    message: string,
    history: any[]
  ): Promise<AgentResponse> {
    const systemInstruction = `${getSystemInstruction()}

The student is confused. Use re-explanation strategy:
1. Start with encouragement ("No problem! This can be tricky. Let's try another angle.")
2. Use simpler language - rephrase with basic vocabulary
3. Provide a new analogy - different from before
4. Use a real-world example - something tangible
5. Break into even smaller steps
6. Ask guiding questions to lead them to understanding

Be extra patient and supportive.`;

    const messages = [
      ...history.map((m: any) => ({
        role: m.role || 'user',
        content: m.content || m.message || '',
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    const aiResponse = await this.aiProvider.generate({
      messages,
      systemInstruction,
    });

    return {
      agent: 'Tutor',
      task: 'teach',
      output: {
        message: aiResponse.text,
        content: aiResponse.text,
        success: true,
      },
      metadata: {
        timestamp: Date.now(),
        phase: 're-explanation',
        confusionDetected: true,
        modelUsed: aiResponse.model,
      },
    };
  }

  /**
   * Extract steps from response text
   */
  private extractSteps(text: string): string[] {
    const steps: string[] = [];
    const stepPatterns = [
      /^\d+\.\s+(.+)$/gm,
      /^[-•]\s+(.+)$/gm,
      /^Step \d+:\s+(.+)$/gmi,
    ];

    for (const pattern of stepPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          steps.push(match[1].trim());
        }
      }
    }

    return steps.length > 0 ? steps : [];
  }
}



