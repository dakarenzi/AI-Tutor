/**
 * applySafety.ts
 * 
 * Safety checks middleware
 */

import { SafetyEngine } from '../ai/logic/SafetyEngine';
import type { AgentResponse } from '../ai/schemas/AgentResponse';

export function applySafetyChecks(
  response: AgentResponse,
  sessionId: string
): ReturnType<SafetyEngine['checkResponse']> {
  const safetyEngine = new SafetyEngine();
  return safetyEngine.checkResponse(response, sessionId);
}



