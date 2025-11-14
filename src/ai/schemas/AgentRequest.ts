/**
 * AgentRequest.ts
 * 
 * Request schema for agent communication
 */

export type AgentType =
  | 'Tutor'
  | 'Content'
  | 'Evaluation'
  | 'Difficulty'
  | 'Engagement'
  | 'Analytics'
  | 'Planner';

export type TaskType =
  | 'teach'
  | 'explain'
  | 'evaluate'
  | 'generate'
  | 'adjust'
  | 'motivate'
  | 'analyze'
  | 'plan';

export interface AgentRequest {
  agent: AgentType;
  task: TaskType;
  input: {
    // Common fields
    message?: string;
    sessionId?: string;
    userId?: string;
    
    // Task-specific fields
    topic?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    context?: string;
    exercise?: any; // ExerciseSchema
    userAnswer?: string;
    performanceHistory?: any[];
    currentLevel?: string;
    studentProfile?: StudentProfile;
    trigger?: string;
    studentName?: string;
    
    // Context
    conversationHistory?: Message[];
  };
  metadata?: {
    timestamp?: number;
    requestId?: string;
    [key: string]: any;
  };
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface StudentProfile {
  level?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  examDate?: string;
  timePerDay?: number;
  strengths?: string[];
  weaknesses?: string[];
  learningStyle?: string;
  progressHistory?: any[];
  curriculum?: string;
  language?: string;
  subjects?: string[];
}



