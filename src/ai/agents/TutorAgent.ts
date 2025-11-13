/**
 * TutorAgent.ts
 * 
 * Primary teaching agent
 * Implements diagnostic flows, conversation engine, teaching loop, confusion detection
 */

import type { AgentRequest, AgentResponse } from '../schemas';
import { ConversationEngine } from '../logic/ConversationEngine';
import { getSystemInstruction } from '../config/IdentityRules';
import type { WorkersAIProvider } from '../providers/WorkersAIProvider';
import type { ShortTermMemory } from '../memory/ShortTermMemory';

export class TutorAgent {
  private aiProvider: WorkersAIProvider;
  private conversationEngine: ConversationEngine;
  private shortTermMemory: ShortTermMemory;

  constructor(aiProvider: WorkersAIProvider, shortTermMemory: ShortTermMemory) {
    this.aiProvider = aiProvider;
    this.shortTermMemory = shortTermMemory;
    this.conversationEngine = new ConversationEngine(aiProvider, shortTermMemory);
  }

  /**
   * Run the tutor agent
   */
  async run(request: AgentRequest): Promise<AgentResponse> {
    const { message, conversationHistory, studentProfile } = request.input;

    if (!message) {
      return this.createErrorResponse('No message provided');
    }

    // Determine conversation phase
    const phase = this.determinePhase(conversationHistory || [], studentProfile);

    // Route to appropriate handler
    switch (phase) {
      case 'diagnostic':
        return await this.handleDiagnostic(message, conversationHistory || []);
      case 'teaching':
        return await this.handleTeaching(message, conversationHistory || []);
      case 'practice':
        return await this.handlePractice(message, conversationHistory || []);
      default:
        return await this.handleGeneral(message, conversationHistory || []);
    }
  }

  /**
   * Determine conversation phase
   */
  private determinePhase(
    history: any[],
    profile?: any
  ): 'diagnostic' | 'teaching' | 'practice' | 'general' {
    if (!profile || !profile.level) {
      return 'diagnostic';
    }

    if (history.length < 3) {
      return 'diagnostic';
    }

    // Check if in practice mode (recent exercise)
    const recentMessages = history.slice(-3);
    const hasExercise = recentMessages.some((m: any) =>
      m.content?.toLowerCase().includes('exercise') ||
      m.content?.toLowerCase().includes('question')
    );

    if (hasExercise) {
      return 'practice';
    }

    return 'teaching';
  }

  /**
   * Handle diagnostic phase
   */
  private async handleDiagnostic(
    message: string,
    history: any[]
  ): Promise<AgentResponse> {
    const systemInstruction = `${getSystemInstruction()}

You are in the diagnostic phase. Ask friendly questions to understand:
- Subject/topic they want to learn
- Their current level (beginner/intermediate/advanced)
- Their goals (exam prep, homework help, etc.)
- Exam timeline if applicable
- Available study time
- Any difficulties they're facing
- Preferred learning pace

Keep questions short and ask one at a time.`;

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
        phase: 'diagnostic',
        modelUsed: aiResponse.model,
      },
    };
  }

  /**
   * Handle teaching phase
   */
  private async handleTeaching(
    message: string,
    history: any[]
  ): Promise<AgentResponse> {
    return await this.conversationEngine.teach(message, history);
  }

  /**
   * Handle practice phase
   */
  private async handlePractice(
    message: string,
    history: any[]
  ): Promise<AgentResponse> {
    // Check if this is an answer to an exercise
    const isAnswer = this.looksLikeAnswer(message);

    if (isAnswer) {
      // This should be handled by EvaluationAgent, but Tutor can provide feedback
      return await this.providePracticeFeedback(message, history);
    }

    // Otherwise, continue teaching
    return await this.handleTeaching(message, history);
  }

  /**
   * Handle general conversation
   */
  private async handleGeneral(
    message: string,
    history: any[]
  ): Promise<AgentResponse> {
    const systemInstruction = getSystemInstruction();

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
        modelUsed: aiResponse.model,
      },
    };
  }

  /**
   * Check if message looks like an answer
   */
  private looksLikeAnswer(message: string): boolean {
    const answerPatterns = [
      /^(the answer is|it's|it is|i think|i believe|my answer is)/i,
      /^(a\)|b\)|c\)|d\)|true|false)$/i,
      /^[a-d]\)/i,
    ];

    return answerPatterns.some((pattern) => pattern.test(message.trim()));
  }

  /**
   * Provide practice feedback
   */
  private async providePracticeFeedback(
    message: string,
    history: any[]
  ): Promise<AgentResponse> {
    const systemInstruction = `${getSystemInstruction()}

The student has submitted an answer. Provide gentle, encouraging feedback.
- Start with positive reinforcement
- If incorrect, explain gently what went wrong
- Provide a simpler example if needed
- Offer to try another question
- Keep it encouraging and supportive`;

    const messages = [
      ...history.map((m: any) => ({
        role: m.role || 'user',
        content: m.content || m.message || '',
      })),
      {
        role: 'user' as const,
        content: `My answer: ${message}`,
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
        phase: 'practice',
        modelUsed: aiResponse.model,
      },
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(message: string): AgentResponse {
    return {
      agent: 'Tutor',
      task: 'teach',
      output: {
        message: `I apologize, but I encountered an issue: ${message}. Let's try again!`,
        content: `I apologize, but I encountered an issue: ${message}. Let's try again!`,
        success: false,
      },
      metadata: {
        timestamp: Date.now(),
        error: message,
      },
    };
  }
}



