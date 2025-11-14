/**
 * EvaluationAgent.ts
 * 
 * Answer evaluation agent (stub implementation)
 */

import type { AgentRequest, AgentResponse } from '../schemas';
import { getSystemInstruction } from '../config/IdentityRules';
import type { WorkersAIProvider } from '../providers/WorkersAIProvider';

export class EvaluationAgent {
  private aiProvider: WorkersAIProvider;

  constructor(aiProvider: WorkersAIProvider) {
    this.aiProvider = aiProvider;
  }

  async run(request: AgentRequest): Promise<AgentResponse> {
    const { exercise, userAnswer, studentProfile } = request.input;
    const studentLevel = studentProfile?.level;

    if (!exercise || !userAnswer) {
      return {
        agent: 'Evaluation',
        task: 'evaluate',
        output: {
          success: false,
          message: 'Missing exercise or user answer',
        },
        metadata: {
          timestamp: Date.now(),
        },
      };
    }

    const systemInstruction = `${getSystemInstruction()}

You are the Evaluation Agent. Your role is to assess student answers.
- Be gentle and encouraging
- Diagnose understanding level (fully_understood, partially_understood, misunderstood, careless_mistake, confused)
- Provide constructive feedback
- Explain what went wrong if incorrect
- Offer simpler examples if needed
- Always start with positive reinforcement`;

    const prompt = `Evaluate this answer:

Exercise: ${JSON.stringify(exercise)}
Student Answer: ${userAnswer}
Student Level: ${studentLevel || 'intermediate'}

Provide evaluation with diagnosis and feedback.`;

    const aiResponse = await this.aiProvider.generate({
      messages: [{ role: 'user', content: prompt }],
      systemInstruction,
    });

    // Simple correctness check (can be enhanced with semantic analysis)
    const isCorrect = this.checkCorrectness(exercise, userAnswer);

    return {
      agent: 'Evaluation',
      task: 'evaluate',
      output: {
        isCorrect,
        diagnosis: isCorrect ? 'fully_understood' : 'partially_understood',
        feedback: aiResponse.text,
        message: aiResponse.text,
        success: true,
        confidenceScore: isCorrect ? 0.9 : 0.6,
      },
      metadata: {
        timestamp: Date.now(),
        modelUsed: aiResponse.model,
      },
    };
  }

  private checkCorrectness(exercise: any, userAnswer: string): boolean {
    if (!exercise.answer) return false;
    const correctAnswer = exercise.answer.toLowerCase().trim();
    const answer = userAnswer.toLowerCase().trim();
    return answer === correctAnswer || answer.includes(correctAnswer);
  }
}



