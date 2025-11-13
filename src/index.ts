/**
 * index.ts
 * 
 * Cloudflare Worker entry point
 * Route handling, middleware chaining, CORS, global error wrapper
 */

import type { Env } from './config/env';
import { handleChat } from './api/chat';
import { handleEvaluate } from './api/evaluate';
import { handlePlan } from './api/plan';
import { handleContent } from './api/content';
import { handleSession } from './api/session';
import { handleAnalytics } from './api/analytics';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Route handling
      if (path.startsWith('/api/tutor/chat') || path === '/api/chat') {
        return await handleChat(request, env);
      } else if (path.startsWith('/api/tutor/evaluate') || path === '/api/evaluate') {
        return await handleEvaluate(request, env);
      } else if (path.startsWith('/api/tutor/plan') || path === '/api/plan') {
        return await handlePlan(request, env);
      } else if (path.startsWith('/api/tutor/content') || path === '/api/content') {
        return await handleContent(request, env);
      } else if (path.startsWith('/api/tutor/session') || path === '/api/session') {
        return await handleSession(request, env);
      } else if (path.startsWith('/api/tutor/analytics') || path === '/api/analytics') {
        return await handleAnalytics(request, env);
      } else if (path === '/health' || path === '/') {
        return new Response(
          JSON.stringify({
            status: 'ok',
            service: 'AI Tutor Backend',
            timestamp: Date.now(),
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Not Found' }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    } catch (error) {
      // Global error handler
      console.error('Unhandled error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};

// Export Durable Object class
export { SessionManager } from './storage/DurableObjectSessions';



