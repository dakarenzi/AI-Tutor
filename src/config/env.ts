/**
 * Environment variable management for Cloudflare Workers
 */

export interface Env {
  // Cloudflare bindings
  AI: any; // Workers AI binding
  SESSION_KV: KVNamespace;
  PROGRESS_KV: KVNamespace;
  ANALYTICS_KV: KVNamespace;
  ANALYTICS_DB: D1Database;
  SESSION_MANAGER: DurableObjectNamespace;

  // Environment variables
  ENVIRONMENT?: string;
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key: string, defaultValue?: string): string {
  // In Cloudflare Workers, env vars are passed via the Env interface
  // This is a helper for accessing them
  return defaultValue || '';
}

/**
 * Check if running in production
 */
export function isProduction(env: Env): boolean {
  return env.ENVIRONMENT === 'production';
}



