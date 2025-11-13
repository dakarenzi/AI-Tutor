/**
 * ContentAgent.ts
 * 
 * Content generation agent (stub implementation)
 */

import type { AgentRequest, AgentResponse } from '../schemas';
import { getSystemInstruction } from '../config/IdentityRules';
import type { WorkersAIProvider } from '../providers/WorkersAIProvider';

export class ContentAgent {
  private aiProvider: WorkersAIProvider;

  constructor(aiProvider: WorkersAIProvider) {
    this.aiProvider = aiProvider;
  }

  async run(request: AgentRequest): Promise<AgentResponse> {
    const { topic, level, context } = request.input;

    const systemInstruction = `${getSystemInstruction()}

You are the Content Agent. Your role is to generate clear, structured lesson content.
- Explain topics simply and clearly
- Provide relevant examples and analogies
- Break content into digestible chunks
- Align with curriculum when specified
- Keep explanations mobile-friendly and concise`;

    const prompt = `Generate content for:
Topic: ${topic || 'general topic'}
Level: ${level || 'intermediate'}
Context: ${context || 'general learning'}

Please provide a clear explanation with examples.`;

    const aiResponse = await this.aiProvider.generate({
      messages: [{ role: 'user', content: prompt }],
      systemInstruction,
    });

    return {
      agent: 'Content',
      task: request.task,
      output: {
        content: aiResponse.text,
        message: aiResponse.text,
        success: true,
        keyPoints: this.extractKeyPoints(aiResponse.text),
      },
      metadata: {
        timestamp: Date.now(),
        modelUsed: aiResponse.model,
      },
    };
  }

  private extractKeyPoints(text: string): string[] {
    // Simple extraction (can be enhanced)
    const lines = text.split('\n').filter((line) => line.trim().length > 0);
    return lines.slice(0, 5); // Return first 5 lines as key points
  }
}



