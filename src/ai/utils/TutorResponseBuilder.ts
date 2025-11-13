/**
 * TutorResponseBuilder.ts
 * 
 * IMPORTANT: Build tutor responses with proper tone and formatting
 */

import { IDENTITY_RULES } from '../config/IdentityRules';

export class TutorResponseBuilder {
  /**
   * Build a tutor response with proper formatting
   */
  static build(content: string, options?: {
    includeQuestion?: boolean;
    addEncouragement?: boolean;
    formatForMobile?: boolean;
  }): string {
    let response = content.trim();

    // Ensure it follows identity rules
    response = this.enforceTone(response);
    response = this.enforceLength(response);
    
    if (options?.formatForMobile !== false) {
      response = this.formatForMobile(response);
    }

    if (options?.includeQuestion !== false) {
      response = this.ensureQuestion(response);
    }

    if (options?.addEncouragement) {
      response = this.addEncouragement(response);
    }

    return response;
  }

  /**
   * Enforce tone rules
   */
  private static enforceTone(text: string): string {
    let result = text;

    // Replace negative phrases
    for (const phrase of IDENTITY_RULES.ERROR_CORRECTION.language.never) {
      const regex = new RegExp(phrase, 'gi');
      result = result.replace(regex, "that's a great attempt");
    }

    return result;
  }

  /**
   * Enforce length limits
   */
  private static enforceLength(text: string): string {
    const maxLength = IDENTITY_RULES.SAFETY.maxResponseLength;
    if (text.length > maxLength) {
      // Truncate at sentence boundary
      const truncated = text.substring(0, maxLength);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastQuestion = truncated.lastIndexOf('?');
      const lastExclamation = truncated.lastIndexOf('!');
      const lastBreak = Math.max(lastPeriod, lastQuestion, lastExclamation);
      
      if (lastBreak > maxLength * 0.7) {
        return truncated.substring(0, lastBreak + 1) + ' Does that make sense?';
      }
      
      return truncated + '...';
    }
    return text;
  }

  /**
   * Format for mobile
   */
  private static formatForMobile(text: string): string {
    // Break long paragraphs
    const sentences = text.split(/(?<=[.!?])\s+/);
    const formatted: string[] = [];
    let currentParagraph = '';

    for (const sentence of sentences) {
      if ((currentParagraph + sentence).length > 150) {
        if (currentParagraph) {
          formatted.push(currentParagraph.trim());
        }
        currentParagraph = sentence;
      } else {
        currentParagraph += ' ' + sentence;
      }
    }

    if (currentParagraph) {
      formatted.push(currentParagraph.trim());
    }

    return formatted.join('\n\n');
  }

  /**
   * Ensure response ends with a question
   */
  private static ensureQuestion(text: string): string {
    const trimmed = text.trim();
    if (trimmed.endsWith('?') || trimmed.endsWith('!')) {
      return text;
    }

    // Add appropriate question
    const questionEndings = [
      'Does that make sense?',
      'Ready to continue?',
      'Any questions?',
      'Want to try another one?',
    ];

    // Use a simple heuristic to choose question
    const randomQuestion = questionEndings[Math.floor(Math.random() * questionEndings.length)];
    return trimmed + ' ' + randomQuestion;
  }

  /**
   * Add encouragement
   */
  private static addEncouragement(text: string): string {
    const encouragements = [
      'Great question!',
      "You're doing great!",
      'Keep it up!',
      'Nice work!',
    ];

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    return randomEncouragement + ' ' + text;
  }
}



