/**
 * ProgressTracker.ts
 * 
 * Progress tracking logic
 */

import type { ProgressEntry } from './MemorySchema';
import type { DifficultyLevel } from '../schemas/ExerciseSchema';

export interface ProgressStats {
  totalExercises: number;
  correctExercises: number;
  accuracy: number;
  averageDifficulty: DifficultyLevel;
  topicsCovered: string[];
  currentStreak: number;
  longestStreak: number;
  confusionSignals: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

export class ProgressTracker {
  private entries: ProgressEntry[] = [];

  /**
   * Add a progress entry
   */
  addEntry(entry: ProgressEntry): void {
    this.entries.push(entry);
  }

  /**
   * Get all entries
   */
  getEntries(): ProgressEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries for a specific topic
   */
  getEntriesForTopic(topic: string): ProgressEntry[] {
    return this.entries.filter((e) => e.topic === topic);
  }

  /**
   * Calculate progress statistics
   */
  getStats(): ProgressStats {
    const total = this.entries.length;
    const correct = this.entries.filter((e) => e.correct).length;
    const accuracy = total > 0 ? correct / total : 0;

    // Calculate average difficulty
    const difficulties = this.entries.map((e) => e.difficulty);
    const difficultyCounts: Record<string, number> = {};
    difficulties.forEach((d) => {
      difficultyCounts[d] = (difficultyCounts[d] || 0) + 1;
    });
    const averageDifficulty = Object.entries(difficultyCounts).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ['medium', 0]
    )[0] as DifficultyLevel;

    // Get unique topics
    const topicsCovered = Array.from(
      new Set(this.entries.map((e) => e.topic))
    );

    // Calculate current streak
    let currentStreak = 0;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    this.entries.forEach((e) => {
      if (e.correct) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    // Count confusion signals
    const confusionSignals = this.entries.filter(
      (e) => e.errors && e.errors.length > 0
    ).length;

    // Determine improvement trend (last 10 vs previous 10)
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (this.entries.length >= 20) {
      const recent = this.entries.slice(-10);
      const previous = this.entries.slice(-20, -10);
      const recentAccuracy =
        recent.filter((e) => e.correct).length / recent.length;
      const previousAccuracy =
        previous.filter((e) => e.correct).length / previous.length;

      if (recentAccuracy > previousAccuracy + 0.1) {
        improvementTrend = 'improving';
      } else if (recentAccuracy < previousAccuracy - 0.1) {
        improvementTrend = 'declining';
      }
    }

    return {
      totalExercises: total,
      correctExercises: correct,
      accuracy,
      averageDifficulty,
      topicsCovered,
      currentStreak,
      longestStreak,
      confusionSignals,
      improvementTrend,
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }
}



