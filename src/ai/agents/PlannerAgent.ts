/**
 * PlannerAgent.ts
 * 
 * Learning plan generation agent (stub implementation)
 */

import type { AgentRequest, AgentResponse } from '../schemas';
import { getSystemInstruction } from '../config/IdentityRules';
import type { WorkersAIProvider } from '../providers/WorkersAIProvider';

export class PlannerAgent {
  private aiProvider: WorkersAIProvider;

  constructor(aiProvider: WorkersAIProvider) {
    this.aiProvider = aiProvider;
  }

  async run(request: AgentRequest): Promise<AgentResponse> {
    const { studentProfile } = request.input;
    const planType = (request.metadata as any)?.planType || 'weekly';

    const systemInstruction = `${getSystemInstruction()}

You are the Planner Agent. Your role is to create personalized learning plans.
- Build realistic, achievable plans
- Consider student's goals, timeline, and available time
- Sequence topics logically
- Include exercises and checkpoints
- Adapt difficulty based on student level`;

    const prompt = `Create a ${planType || 'weekly'} learning plan for:
${JSON.stringify(studentProfile || {})}

Provide a structured plan with clear goals and timeline.`;

    const aiResponse = await this.aiProvider.generate({
      messages: [{ role: 'user', content: prompt }],
      systemInstruction,
    });

    return {
      agent: 'Planner',
      task: 'plan',
      output: {
        message: aiResponse.text,
        success: true,
        action: 'plan_created',
      },
      metadata: {
        timestamp: Date.now(),
        planType,
        modelUsed: aiResponse.model,
      },
    };
  }
}



