/**
 * EvaluationSchema.ts
 * 
 * Evaluation result schemas
 */

import type { Exercise, DifficultyLevel } from './ExerciseSchema';

export type EvaluationDiagnosis =
  | 'fully_understood'
  | 'partially_understood'
  | 'misunderstood'
  | 'careless_mistake'
  | 'confused';

export interface EvaluationResult {
  exerciseId: string;
  exercise: Exercise;
  userAnswer: string;
  isCorrect: boolean;
  diagnosis: EvaluationDiagnosis;
  confidenceScore: number; // 0-1
  feedback: string;
  correctAnswer?: string;
  explanation?: string;
  hints?: string[];
  nextDifficulty?: DifficultyLevel;
  shouldRetry?: boolean;
  retryExerciseId?: string;
  metadata?: {
    evaluationTime?: number;
    evaluationMethod?: 'exact_match' | 'semantic_similarity' | 'step_by_step';
    [key: string]: any;
  };
}

export interface EvaluationRequest {
  exercise: Exercise;
  userAnswer: string;
  studentLevel?: 'beginner' | 'intermediate' | 'advanced';
  previousAttempts?: number;
  context?: {
    topic?: string;
    curriculum?: string;
    conversationHistory?: any[];
  };
}



