/**
 * MemorySchema.ts
 * 
 * Memory data structures
 */

import type { Message } from '../schemas/AgentRequest';
import type { DifficultyLevel } from '../schemas/ExerciseSchema';

export interface MemoryData {
  // Short-term
  recentMessages: Message[];
  
  // Current state
  currentTopic?: string;
  currentDifficulty?: DifficultyLevel;
  currentExerciseId?: string;
  
  // Long-term
  strengths: string[];
  weaknesses: string[];
  progressHistory: ProgressEntry[];
  learningStyle?: string;
  goals?: string[];
  examDate?: string;
  
  // Metadata
  lastUpdated: number;
  createdAt: number;
}

export interface ProgressEntry {
  timestamp: number;
  topic: string;
  exerciseId?: string;
  correct: boolean;
  difficulty: DifficultyLevel;
  timeSpent?: number;
  errors?: string[];
}



