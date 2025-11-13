/**
 * DifficultyAgent.ts
 * 
 * Difficulty adjustment agent (stub implementation)
 */

import type { AgentRequest, AgentResponse } from '../schemas';
import type { DifficultyLevel } from '../schemas/ExerciseSchema';

export class DifficultyAgent {
  async run(request: AgentRequest): Promise<AgentResponse> {
    const { performanceHistory, currentLevel } = request.input;

    if (!performanceHistory || !Array.isArray(performanceHistory)) {
      return {
        agent: 'Difficulty',
        task: 'adjust',
        output: {
          success: false,
          recommendation: 'maintain',
          newLevel: currentLevel || 'medium',
        },
        metadata: {
          timestamp: Date.now(),
        },
      };
    }

    // Analyze performance
    const recent = performanceHistory.slice(-5);
    const correctCount = recent.filter((p: any) => p.correct).length;
    const accuracy = recent.length > 0 ? correctCount / recent.length : 0.5;

    // Determine recommendation
    let recommendation: 'increase' | 'decrease' | 'maintain' = 'maintain';
    let newLevel: DifficultyLevel = (currentLevel as DifficultyLevel) || 'medium';
    let reason = '';

    if (accuracy >= 0.9 && recent.length >= 3) {
      recommendation = 'increase';
      reason = 'Student answered 3+ consecutive questions correctly';
      newLevel = this.increaseLevel(newLevel);
    } else if (accuracy < 0.5 && recent.length >= 2) {
      recommendation = 'decrease';
      reason = 'Student struggling with current difficulty';
      newLevel = this.decreaseLevel(newLevel);
    } else {
      recommendation = 'maintain';
      reason = 'Performance is appropriate for current level';
    }

    return {
      agent: 'Difficulty',
      task: 'adjust',
      output: {
        recommendation,
        newLevel,
        reason,
        success: true,
      },
      metadata: {
        timestamp: Date.now(),
        accuracy,
        recentCount: recent.length,
      },
    };
  }

  private increaseLevel(level: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'challenge'];
    const currentIndex = levels.indexOf(level);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  private decreaseLevel(level: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'challenge'];
    const currentIndex = levels.indexOf(level);
    return levels[Math.max(currentIndex - 1, 0)];
  }
}



