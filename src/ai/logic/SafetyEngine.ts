/**
 * SafetyEngine.ts
 * 
 * Multi-agent safety checks
 */

import type { AgentResponse } from '../schemas/AgentResponse';
import { IDENTITY_RULES } from '../config/IdentityRules';

export interface SafetyCheckResult {
  safe: boolean;
  issues: string[];
  warnings: string[];
}

export class SafetyEngine {
  private sessionFacts: Map<string, any> = new Map();

  /**
   * Check agent response for safety issues
   */
  checkResponse(response: AgentResponse, sessionId: string): SafetyCheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for contradictions
    const contradictionCheck = this.checkContradictions(response, sessionId);
    if (!contradictionCheck.safe) {
      issues.push(...contradictionCheck.issues);
    }

    // Check tone safety
    const toneCheck = this.checkTone(response);
    if (!toneCheck.safe) {
      issues.push(...toneCheck.issues);
    }

    // Check length
    const lengthCheck = this.checkLength(response);
    if (!lengthCheck.safe) {
      warnings.push(...lengthCheck.issues);
    }

    // Check for forbidden phrases
    const phraseCheck = this.checkForbiddenPhrases(response);
    if (!phraseCheck.safe) {
      issues.push(...phraseCheck.issues);
    }

    return {
      safe: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Check for contradictions with previous facts
   */
  private checkContradictions(
    response: AgentResponse,
    sessionId: string
  ): SafetyCheckResult {
    const issues: string[] = [];
    const facts = this.sessionFacts.get(sessionId) || [];

    // Simple contradiction detection (can be enhanced)
    const responseText = response.output.message || response.output.content || '';
    const lowerText = responseText.toLowerCase();

    // Check against known facts (simplified - would need more sophisticated logic)
    for (const fact of facts) {
      if (this.isContradictory(lowerText, fact)) {
        issues.push(`Contradicts previous fact: ${fact}`);
      }
    }

    return {
      safe: issues.length === 0,
      issues,
      warnings: [],
    };
  }

  /**
   * Simple contradiction detection (placeholder - needs enhancement)
   */
  private isContradictory(text: string, fact: string): boolean {
    // Very basic check - would need more sophisticated NLP
    const factLower = fact.toLowerCase();
    const contradictions: Record<string, string[]> = {
      'is true': ['is false', 'is not true', 'is incorrect'],
      'is false': ['is true', 'is correct'],
    };

    for (const [key, values] of Object.entries(contradictions)) {
      if (factLower.includes(key)) {
        return values.some((val) => text.includes(val));
      }
    }

    return false;
  }

  /**
   * Check tone safety
   */
  private checkTone(response: AgentResponse): SafetyCheckResult {
    const issues: string[] = [];
    const responseText = response.output.message || response.output.content || '';
    const lowerText = responseText.toLowerCase();

    // Check for condescending language
    const condescendingPatterns = [
      /obviously/i,
      /clearly/i,
      /you should know/i,
      /everyone knows/i,
    ];

    for (const pattern of condescendingPatterns) {
      if (pattern.test(lowerText)) {
        issues.push('Contains potentially condescending language');
        break;
      }
    }

    // Check for negative framing
    const negativePatterns = [
      /you are wrong/i,
      /that's incorrect/i,
      /you failed/i,
      /you can't/i,
    ];

    for (const pattern of negativePatterns) {
      if (pattern.test(lowerText)) {
        issues.push('Contains negative framing - should use positive language');
        break;
      }
    }

    return {
      safe: issues.length === 0,
      issues,
      warnings: [],
    };
  }

  /**
   * Check response length
   */
  private checkLength(response: AgentResponse): SafetyCheckResult {
    const issues: string[] = [];
    const responseText = response.output.message || response.output.content || '';

    if (responseText.length > IDENTITY_RULES.SAFETY.maxResponseLength) {
      issues.push(
        `Response too long (${responseText.length} chars, max ${IDENTITY_RULES.SAFETY.maxResponseLength})`
      );
    }

    return {
      safe: issues.length === 0,
      issues,
      warnings: [],
    };
  }

  /**
   * Check for forbidden phrases
   */
  private checkForbiddenPhrases(response: AgentResponse): SafetyCheckResult {
    const issues: string[] = [];
    const responseText = response.output.message || response.output.content || '';
    const lowerText = responseText.toLowerCase();

    for (const phrase of IDENTITY_RULES.ERROR_CORRECTION.language.never) {
      if (lowerText.includes(phrase.toLowerCase())) {
        issues.push(`Contains forbidden phrase: "${phrase}"`);
      }
    }

    return {
      safe: issues.length === 0,
      issues,
      warnings: [],
    };
  }

  /**
   * Record a fact for contradiction checking
   */
  recordFact(sessionId: string, fact: string): void {
    if (!this.sessionFacts.has(sessionId)) {
      this.sessionFacts.set(sessionId, []);
    }
    this.sessionFacts.get(sessionId)!.push(fact);
  }

  /**
   * Clear facts for a session
   */
  clearFacts(sessionId: string): void {
    this.sessionFacts.delete(sessionId);
  }
}



