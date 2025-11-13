/**
 * validateRequest.ts
 * 
 * Request validation middleware
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateChatRequest(body: any): ValidationResult {
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  if (!body.message || typeof body.message !== 'string') {
    errors.push('Message is required and must be a string');
  }

  if (body.message && body.message.length > 2000) {
    errors.push('Message is too long (max 2000 characters)');
  }

  if (body.sessionId && typeof body.sessionId !== 'string') {
    errors.push('sessionId must be a string');
  }

  if (body.userId && typeof body.userId !== 'string') {
    errors.push('userId must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}



