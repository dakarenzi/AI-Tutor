/**
 * SessionSchema.ts
 * 
 * Session state schemas
 */

import type { Message } from './AgentRequest';
import type { DifficultyLevel } from './ExerciseSchema';

export interface SessionState {
  sessionId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  
  // Current state
  currentTopic?: string;
  currentDifficulty?: DifficultyLevel;
  currentExerciseId?: string;
  conversationPhase?: 'diagnostic' | 'teaching' | 'practice' | 'review';
  
  // Memory
  shortTermMemory: Message[]; // Last 5 messages
  conversationHistory: Message[]; // Full history
  
  // Student profile (from diagnostic)
  studentProfile?: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    goals?: string[];
    examDate?: string;
    timePerDay?: number;
    strengths?: string[];
    weaknesses?: string[];
    learningStyle?: string;
    curriculum?: string;
    language?: string;
    subjects?: string[];
  };
  
  // Progress tracking
  progress: {
    topicsCovered: string[];
    exercisesCompleted: number;
    exercisesCorrect: number;
    currentStreak: number;
    confusionSignals: number;
    lastConfusionAt?: number;
  };
  
  // Metadata
  metadata?: {
    [key: string]: any;
  };
}

export interface SessionMetadata {
  sessionId: string;
  userId: string;
  lastTopic?: string;
  lastDifficulty?: DifficultyLevel;
  lastErrors?: string[];
  lastUpdated: number;
}



