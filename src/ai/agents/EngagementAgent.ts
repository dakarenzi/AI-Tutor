/**
 * EngagementAgent.ts
 * 
 * Motivation and engagement agent (stub implementation)
 */

import type { AgentRequest, AgentResponse } from '../schemas';
import { getSystemInstruction } from '../config/IdentityRules';
import type { WorkersAIProvider } from '../providers/WorkersAIProvider';

export class EngagementAgent {
  private aiProvider: WorkersAIProvider;

  constructor(aiProvider: WorkersAIProvider) {
    this.aiProvider = aiProvider;
  }

  async run(request: AgentRequest): Promise<AgentResponse> {
    const { trigger, studentName } = request.input;

    const systemInstruction = `${getSystemInstruction()}

You are the Engagement Agent. Your role is to motivate and encourage students.
- Celebrate achievements and progress
- Use positive, uplifting language
- Be genuine and specific
- Keep messages short and impactful
- Time your messages appropriately`;

    const prompts: Record<string, string> = {
      correct_answer_hard_question: `Generate an encouraging message for ${studentName || 'the student'} who just solved a hard question.`,
      completed_session: `Generate a motivational message celebrating ${studentName || 'the student'}'s completed study session.`,
      streak_milestone: `Generate a celebration message for ${studentName || 'the student'} who reached a study streak milestone.`,
      default: `Generate a motivational message to encourage ${studentName || 'the student'}.`,
    };

    const prompt = prompts[trigger as string] || prompts.default;

    const aiResponse = await this.aiProvider.generate({
      messages: [{ role: 'user', content: prompt }],
      systemInstruction,
    });

    return {
      agent: 'Engagement',
      task: 'motivate',
      output: {
        message: aiResponse.text,
        success: true,
      },
      metadata: {
        timestamp: Date.now(),
        trigger,
        modelUsed: aiResponse.model,
      },
    };
  }
}



