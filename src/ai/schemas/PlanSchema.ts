/**
 * PlanSchema.ts
 * 
 * Learning plan schemas
 */

export type PlanType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'exam_prep'
  | 'quick_revision'
  | 'weakness_remediation'
  | 'crash_course';

export type SessionStatus = 'pending' | 'completed' | 'skipped' | 'in_progress';

export interface LearningPlan {
  planId: string;
  planType: PlanType;
  studentId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  status: SessionStatus;
  sessions: PlanSession[];
  metadata?: {
    createdAt?: number;
    updatedAt?: number;
    curriculum?: string;
    examDate?: string;
    [key: string]: any;
  };
}

export interface PlanSession {
  sessionId: string;
  date: string; // ISO date string
  status: SessionStatus;
  topic: string;
  objective: string;
  activities: Activity[];
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  completedAt?: number;
}

export interface Activity {
  type: 'concept_review' | 'exercise_set' | 'assessment' | 'warm_up' | 'summary';
  durationMinutes: number;
  exerciseIds?: string[];
  assessmentId?: string;
  content?: string;
  order: number;
}

export interface PlanRequest {
  studentId: string;
  planType: PlanType;
  studentProfile: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    goals?: string[];
    examDate?: string;
    timePerDay?: number;
    strengths?: string[];
    weaknesses?: string[];
    learningStyle?: string;
    curriculum?: string;
    subjects?: string[];
  };
  startDate?: string;
  endDate?: string;
}



