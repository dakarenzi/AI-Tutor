/**
 * RoutingEngine.ts
 * 
 * Intent detection and agent routing logic
 */

import type { AgentType, TaskType } from '../schemas/AgentRequest';

export type Intent =
  | 'ask_question'
  | 'submit_answer'
  | 'signal_confusion'
  | 'request_exercise'
  | 'request_plan'
  | 'review_mistake'
  | 'general_chat'
  | 'diagnostic';

export interface RoutingDecision {
  intent: Intent;
  agent: AgentType;
  task: TaskType;
  confidence: number;
  entities: {
    topic?: string;
    request?: string;
    level?: string;
    [key: string]: any;
  };
}

export class RoutingEngine {
  /**
   * Detect intent and route to appropriate agent
   */
  route(userMessage: string, context?: any): RoutingDecision {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Intent detection patterns
    const intentPatterns: Array<{ intent: Intent; patterns: RegExp[]; agent: AgentType; task: TaskType }> = [
      {
        intent: 'submit_answer',
        patterns: [
          /^(the answer is|it's|it is|i think|i believe|my answer is)/i,
          /^(a\)|b\)|c\)|d\)|true|false)/i,
        ],
        agent: 'Evaluation',
        task: 'evaluate',
      },
      {
        intent: 'signal_confusion',
        patterns: [
          /(i don't? (understand|get it)|confused|not sure|unclear|help)/i,
          /(what\?|huh\?|i'm lost)/i,
        ],
        agent: 'Tutor',
        task: 'teach',
      },
      {
        intent: 'request_exercise',
        patterns: [
          /(give me|can i have|i want|generate|create).*(exercise|question|problem|practice)/i,
          /(test|quiz|practice).*(me|my understanding)/i,
        ],
        agent: 'Content',
        task: 'generate',
      },
      {
        intent: 'request_plan',
        patterns: [
          /(create|make|generate|give me).*(plan|schedule|study plan|learning plan)/i,
          /(plan|schedule).*(for|to study)/i,
        ],
        agent: 'Planner',
        task: 'plan',
      },
      {
        intent: 'review_mistake',
        patterns: [
          /(explain|why|how).*(wrong|mistake|error|incorrect)/i,
          /(what did i do wrong|why was that wrong)/i,
        ],
        agent: 'Tutor',
        task: 'teach',
      },
      {
        intent: 'diagnostic',
        patterns: [
          /(start|begin|new|first time|first session)/i,
          /(i want to learn|i'm studying|i need help with)/i,
        ],
        agent: 'Tutor',
        task: 'teach',
      },
      {
        intent: 'ask_question',
        patterns: [
          /^(what|how|why|when|where|can you|explain|tell me)/i,
          /\?$/,
        ],
        agent: 'Tutor',
        task: 'teach',
      },
    ];

    // Find matching intent
    for (const pattern of intentPatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(userMessage)) {
          return {
            intent: pattern.intent,
            agent: pattern.agent,
            task: pattern.task,
            confidence: 0.8,
            entities: this.extractEntities(userMessage),
          };
        }
      }
    }

    // Default to general chat -> Tutor Agent
    return {
      intent: 'general_chat',
      agent: 'Tutor',
      task: 'teach',
      confidence: 0.5,
      entities: this.extractEntities(userMessage),
    };
  }

  /**
   * Extract entities from message
   */
  private extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract topic (simple keyword detection)
    const topicPatterns = [
      /(about|on|regarding|topic|subject).*?([a-z]+(?:\s+[a-z]+)*)/i,
      /(learn|study|teach|explain).*?([a-z]+(?:\s+[a-z]+)*)/i,
    ];

    for (const pattern of topicPatterns) {
      const match = message.match(pattern);
      if (match && match[2]) {
        entities.topic = match[2].trim();
        break;
      }
    }

    // Extract level
    const levelPattern = /(beginner|intermediate|advanced|easy|medium|hard)/i;
    const levelMatch = message.match(levelPattern);
    if (levelMatch) {
      entities.level = levelMatch[1].toLowerCase();
    }

    return entities;
  }

  /**
   * Get agent for a specific task
   */
  getAgentForTask(task: TaskType): AgentType {
    const taskToAgent: Record<TaskType, AgentType> = {
      teach: 'Tutor',
      explain: 'Content',
      evaluate: 'Evaluation',
      generate: 'Content',
      adjust: 'Difficulty',
      motivate: 'Engagement',
      analyze: 'Analytics',
      plan: 'Planner',
    };

    return taskToAgent[task] || 'Tutor';
  }
}



