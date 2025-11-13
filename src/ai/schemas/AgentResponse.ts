/**
 * AgentResponse.ts
 * 
 * Response schema with agent metadata
 */

import type { AgentType, TaskType } from './AgentRequest';

export interface AgentResponse {
  agent: AgentType;
  task: TaskType;
  output: {
    // Common response fields
    message?: string;
    content?: string;
    success: boolean;
    
    // Task-specific outputs
    explanation?: string;
    keyPoints?: string[];
    isCorrect?: boolean;
    diagnosis?: 'fully_understood' | 'partially_understood' | 'misunderstood' | 'careless_mistake' | 'confused';
    feedback?: string;
    confidenceScore?: number;
    recommendation?: 'increase' | 'decrease' | 'maintain';
    newLevel?: string;
    reason?: string;
    action?: string;
    sessionDetails?: any;
    
    // Structured data
    steps?: string[];
    examples?: string[];
    analogies?: string[];
  };
  metadata: {
    timestamp: number;
    processingTimeMs?: number;
    modelUsed?: string;
    tokensUsed?: number;
    [key: string]: any;
  };
}



