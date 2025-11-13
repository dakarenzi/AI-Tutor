/**
 * CoordinatorAgent.ts
 * 
 * Master controller for all agents
 * Routes tasks, enforces IdentityRules, runs SafetyEngine, synthesizes outputs
 */

import type { AgentRequest, AgentResponse } from '../schemas';
import { RoutingEngine, type RoutingDecision } from '../logic/RoutingEngine';
import { SafetyEngine } from '../logic/SafetyEngine';
import { IDENTITY_RULES, getSystemInstruction, validateResponse } from '../config/IdentityRules';
import type { LongTermMemory } from '../memory/LongTermMemory';
import type { ShortTermMemory } from '../memory/ShortTermMemory';
import type { WorkersAIProvider } from '../providers/WorkersAIProvider';

// Import agent interfaces (will be implemented)
import type { TutorAgent } from '../agents/TutorAgent';
import type { ContentAgent } from '../agents/ContentAgent';
import type { EvaluationAgent } from '../agents/EvaluationAgent';
import type { DifficultyAgent } from '../agents/DifficultyAgent';
import type { EngagementAgent } from '../agents/EngagementAgent';
import type { AnalyticsAgent } from '../agents/AnalyticsAgent';
import type { PlannerAgent } from '../agents/PlannerAgent';

export interface CoordinatorContext {
  sessionId: string;
  userId: string;
  shortTermMemory: ShortTermMemory;
  longTermMemory: LongTermMemory;
  aiProvider: WorkersAIProvider;
  agents: {
    tutor: TutorAgent;
    content: ContentAgent;
    evaluation: EvaluationAgent;
    difficulty: DifficultyAgent;
    engagement: EngagementAgent;
    analytics: AnalyticsAgent;
    planner: PlannerAgent;
  };
}

export class CoordinatorAgent {
  private routingEngine: RoutingEngine;
  private safetyEngine: SafetyEngine;
  private context: CoordinatorContext;

  constructor(context: CoordinatorContext) {
    this.context = context;
    this.routingEngine = new RoutingEngine();
    this.safetyEngine = new SafetyEngine();
  }

  /**
   * Process a user message and coordinate agent responses
   */
  async process(userMessage: string, metadata?: any): Promise<AgentResponse> {
    const { sessionId, shortTermMemory, longTermMemory } = this.context;

    // 1. Route the message
    const routingDecision = this.routingEngine.route(userMessage, metadata);

    // 2. Load context from memory
    const memoryData = await longTermMemory.load(sessionId);
    const recentMessages = shortTermMemory.getMessages();

    // 3. Create agent request
    const agentRequest: AgentRequest = {
      agent: routingDecision.agent,
      task: routingDecision.task,
      input: {
        message: userMessage,
        sessionId,
        userId: this.context.userId,
        topic: routingDecision.entities.topic,
        level: routingDecision.entities.level as any,
        context: JSON.stringify({
          recentMessages,
          memoryData,
          routingDecision,
        }),
        conversationHistory: recentMessages,
        studentProfile: memoryData?.studentProfile,
      },
      metadata: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
        ...metadata,
      },
    };

    // 4. Route to appropriate agent
    let agentResponse: AgentResponse;
    try {
      agentResponse = await this.routeToAgent(agentRequest, routingDecision);
    } catch (error) {
      console.error('Agent error:', error);
      // Fallback to Tutor Agent
      agentResponse = await this.fallbackToTutor(userMessage, error as Error);
    }

    // 5. Run safety checks
    const safetyCheck = this.safetyEngine.checkResponse(agentResponse, sessionId);
    if (!safetyCheck.safe) {
      console.warn('Safety issues detected:', safetyCheck.issues);
      // Fix or reject unsafe responses
      agentResponse = await this.fixUnsafeResponse(agentResponse, safetyCheck);
    }

    // 6. Enforce IdentityRules
    agentResponse = await this.enforceIdentityRules(agentResponse);

    // 7. Synthesize final response
    const finalResponse = await this.synthesizeResponse(agentResponse, userMessage);

    // 8. Save to memory
    await this.saveToMemory(userMessage, finalResponse);

    return finalResponse;
  }

  /**
   * Route request to appropriate agent
   */
  private async routeToAgent(
    request: AgentRequest,
    routing: RoutingDecision
  ): Promise<AgentResponse> {
    const { agents } = this.context;

    switch (routing.agent) {
      case 'Tutor':
        return await agents.tutor.run(request);
      case 'Content':
        return await agents.content.run(request);
      case 'Evaluation':
        return await agents.evaluation.run(request);
      case 'Difficulty':
        return await agents.difficulty.run(request);
      case 'Engagement':
        return await agents.engagement.run(request);
      case 'Analytics':
        return await agents.analytics.run(request);
      case 'Planner':
        return await agents.planner.run(request);
      default:
        return await agents.tutor.run(request);
    }
  }

  /**
   * Fallback to Tutor Agent on error
   */
  private async fallbackToTutor(
    userMessage: string,
    error: Error
  ): Promise<AgentResponse> {
    const request: AgentRequest = {
      agent: 'Tutor',
      task: 'teach',
      input: {
        message: `I encountered an issue. Let me help you with: ${userMessage}`,
        sessionId: this.context.sessionId,
        userId: this.context.userId,
      },
      metadata: {
        timestamp: Date.now(),
        error: error.message,
      },
    };

    return await this.context.agents.tutor.run(request);
  }

  /**
   * Fix unsafe responses
   */
  private async fixUnsafeResponse(
    response: AgentResponse,
    safetyCheck: any
  ): Promise<AgentResponse> {
    // If response is unsafe, ask Tutor Agent to reformat it
    const request: AgentRequest = {
      agent: 'Tutor',
      task: 'teach',
      input: {
        message: `Please reformat this response to be safe and follow our identity rules: ${response.output.message || response.output.content}`,
        sessionId: this.context.sessionId,
        userId: this.context.userId,
      },
      metadata: {
        timestamp: Date.now(),
        safetyIssues: safetyCheck.issues,
      },
    };

    return await this.context.agents.tutor.run(request);
  }

  /**
   * Enforce IdentityRules on response
   */
  private async enforceIdentityRules(response: AgentResponse): Promise<AgentResponse> {
    const responseText = response.output.message || response.output.content || '';
    const validation = validateResponse(responseText);

    if (!validation.valid) {
      // Fix validation issues
      const fixedText = await this.fixResponseText(responseText, validation.issues);
      return {
        ...response,
        output: {
          ...response.output,
          message: fixedText,
          content: fixedText,
        },
      };
    }

    return response;
  }

  /**
   * Fix response text to meet identity rules
   */
  private async fixResponseText(
    text: string,
    issues: string[]
  ): Promise<string> {
    // Simple fixes (can be enhanced with AI)
    let fixed = text;

    // Ensure it ends with a question if needed
    if (issues.some((i) => i.includes('should end with a question'))) {
      if (!fixed.trim().endsWith('?') && !fixed.trim().endsWith('!')) {
        fixed += ' Does that make sense?';
      }
    }

    // Remove forbidden phrases
    for (const phrase of IDENTITY_RULES.ERROR_CORRECTION.language.never) {
      fixed = fixed.replace(new RegExp(phrase, 'gi'), "that's a great attempt");
    }

    return fixed;
  }

  /**
   * Synthesize final response from agent outputs
   */
  private async synthesizeResponse(
    agentResponse: AgentResponse,
    userMessage: string
  ): Promise<AgentResponse> {
    // Ensure Tutor Agent finalizes all responses
    if (agentResponse.agent !== 'Tutor') {
      // Let Tutor Agent format the response
      const request: AgentRequest = {
        agent: 'Tutor',
        task: 'teach',
        input: {
          message: `Format this agent response for the student: ${agentResponse.output.message || agentResponse.output.content}`,
          sessionId: this.context.sessionId,
          userId: this.context.userId,
        },
        metadata: {
          timestamp: Date.now(),
          originalAgent: agentResponse.agent,
        },
      };

      const tutorResponse = await this.context.agents.tutor.run(request);
      return {
        ...tutorResponse,
        metadata: {
          ...tutorResponse.metadata,
          synthesizedFrom: agentResponse.agent,
        },
      };
    }

    return agentResponse;
  }

  /**
   * Save conversation to memory
   */
  private async saveToMemory(
    userMessage: string,
    response: AgentResponse
  ): Promise<void> {
    const { sessionId, shortTermMemory, longTermMemory } = this.context;

    // Add to short-term memory
    shortTermMemory.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    shortTermMemory.addMessage({
      role: 'assistant',
      content: response.output.message || response.output.content || '',
      timestamp: Date.now(),
    });

    // Save to long-term memory
    await longTermMemory.addMessage(sessionId, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    await longTermMemory.addMessage(sessionId, {
      role: 'assistant',
      content: response.output.message || response.output.content || '',
      timestamp: Date.now(),
    });
  }
}



