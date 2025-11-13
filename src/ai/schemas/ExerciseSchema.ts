/**
 * ExerciseSchema.ts
 * 
 * Exercise type definitions
 */

export type ExerciseType =
  | 'MCQ'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'FILL_IN_THE_BLANK'
  | 'STEP_BY_STEP_REASONING'
  | 'EXPLAIN_THINKING'
  | 'MATCHING';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'challenge';

export interface Exercise {
  id: string;
  type: ExerciseType;
  questionText: string;
  options?: string[]; // For MCQ
  answer: string;
  difficulty: DifficultyLevel;
  topic?: string;
  curriculum?: string;
  hints?: string[];
  explanation?: string;
  metadata?: {
    createdAt?: number;
    tags?: string[];
    [key: string]: any;
  };
}

export interface MCQExercise extends Exercise {
  type: 'MCQ';
  options: string[];
  correctOptionIndex: number;
}

export interface TrueFalseExercise extends Exercise {
  type: 'TRUE_FALSE';
  answer: 'true' | 'false';
}

export interface ShortAnswerExercise extends Exercise {
  type: 'SHORT_ANSWER';
  expectedKeywords?: string[];
  semanticMatch?: boolean;
}

export interface FillInTheBlankExercise extends Exercise {
  type: 'FILL_IN_THE_BLANK';
  blankPosition: number;
  acceptableAnswers?: string[];
}

export interface StepByStepExercise extends Exercise {
  type: 'STEP_BY_STEP_REASONING';
  steps: Step[];
  expectedSteps?: string[];
}

export interface Step {
  number: number;
  description: string;
  expectedResult?: string;
}

export interface MatchingExercise extends Exercise {
  type: 'MATCHING';
  leftColumn: string[];
  rightColumn: string[];
  correctPairs: Array<{ left: number; right: number }>;
}



