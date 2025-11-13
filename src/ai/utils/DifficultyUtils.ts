/**
 * DifficultyUtils.ts
 * 
 * Difficulty calculations
 */

import type { DifficultyLevel } from '../schemas/ExerciseSchema';

export class DifficultyUtils {
  /**
   * Calculate difficulty from performance
   */
  static calculateDifficulty(
    accuracy: number,
    currentLevel: DifficultyLevel
  ): DifficultyLevel {
    if (accuracy >= 0.9) {
      return this.increaseLevel(currentLevel);
    } else if (accuracy < 0.5) {
      return this.decreaseLevel(currentLevel);
    }
    return currentLevel;
  }

  /**
   * Increase difficulty level
   */
  static increaseLevel(level: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'challenge'];
    const index = levels.indexOf(level);
    return levels[Math.min(index + 1, levels.length - 1)];
  }

  /**
   * Decrease difficulty level
   */
  static decreaseLevel(level: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'challenge'];
    const index = levels.indexOf(level);
    return levels[Math.max(index - 1, 0)];
  }

  /**
   * Get difficulty weight for scoring
   */
  static getWeight(level: DifficultyLevel): number {
    const weights: Record<DifficultyLevel, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
      challenge: 4,
    };
    return weights[level];
  }
}



