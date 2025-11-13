/**
 * chat.ts
 * 
 * Main chat endpoint
 * Flow: validate → attach session → rate limit → CoordinatorAgent → format → save memory → return
 */

import type { Env } from '../config/env';
import { CoordinatorAgent, type CoordinatorContext } from '../ai/coordinator/CoordinatorAgent';
import { WorkersAIProvider } from '../ai/providers/WorkersAIProvider';
import { RateLimiter } from '../ai/providers/RateLimiter';
import { ShortTermMemory } from '../ai/memory/ShortTermMemory';
import { DurableObjectMemory } from '../ai/memory/DurableObjectMemory';
import { TutorAgent } from '../ai/agents/TutorAgent';
import { ContentAgent } from '../ai/agents/ContentAgent';
import { EvaluationAgent } from '../ai/agents/EvaluationAgent';
import { DifficultyAgent } from '../ai/agents/DifficultyAgent';
import { EngagementAgent } from '../ai/agents/EngagementAgent';
import { AnalyticsAgent } from '../ai/agents/AnalyticsAgent';
import { PlannerAgent } from '../ai/agents/PlannerAgent';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  metadata?: any;
}

export async function handleChat(request: Request, env: Env): Promise<Response> {
  try {
    // 1. Validate request
    const body = await request.json<ChatRequest>();
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get or create session ID
    const sessionId = body.sessionId || crypto.randomUUID();
    const userId = body.userId || RateLimiter.getClientIP(request);

    // 3. Apply rate limits
    const rateLimiter = new RateLimiter(env);
    const rateLimit = await rateLimiter.checkLimit(userId, 'user');
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetAt: rateLimit.resetAt,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // 4. Initialize components
    const aiProvider = new WorkersAIProvider(env);
    const shortTermMemory = new ShortTermMemory();
    const longTermMemory = new DurableObjectMemory(env);

    // Load existing memory
    const memoryData = await longTermMemory.load(sessionId);
    if (memoryData) {
      memoryData.recentMessages.forEach((msg) => {
        shortTermMemory.addMessage(msg);
      });
    }

    // 5. Initialize agents
    const agents = {
      tutor: new TutorAgent(aiProvider, shortTermMemory),
      content: new ContentAgent(aiProvider),
      evaluation: new EvaluationAgent(aiProvider),
      difficulty: new DifficultyAgent(),
      engagement: new EngagementAgent(aiProvider),
      analytics: new AnalyticsAgent(),
      planner: new PlannerAgent(aiProvider),
    };

    // 6. Create coordinator context
    const context: CoordinatorContext = {
      sessionId,
      userId,
      shortTermMemory,
      longTermMemory,
      aiProvider,
      agents,
    };

    // 7. Process with CoordinatorAgent
    const coordinator = new CoordinatorAgent(context);
    const response = await coordinator.process(body.message, {
      requestId: crypto.randomUUID(),
    });

    // 8. Format response
    const chatResponse: ChatResponse = {
      message: response.output.message || response.output.content || '',
      sessionId,
      metadata: {
        agent: response.agent,
        task: response.task,
        timestamp: response.metadata.timestamp,
      },
    };

    return new Response(JSON.stringify(chatResponse), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}



