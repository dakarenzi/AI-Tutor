/**
 * plan.ts
 * 
 * Learning plan generation endpoint (placeholder)
 */

import type { Env } from '../config/env';

export async function handlePlan(request: Request, env: Env): Promise<Response> {
  return new Response(
    JSON.stringify({ message: 'Plan endpoint - coming soon' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}



