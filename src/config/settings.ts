/**
 * Application settings and configuration
 */

export const SETTINGS = {
  // Rate limiting
  RATE_LIMIT: {
    PER_MINUTE: 30,
    PER_HOUR: 500,
    PER_DAY: 5000,
  },

  // AI Model settings
  AI: {
    DEFAULT_MODEL: '@cf/meta/llama-3.1-8b-instruct',
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.7,
    TIMEOUT_MS: 30000,
    MAX_RETRIES: 3,
  },

  // Memory settings
  MEMORY: {
    SHORT_TERM_MESSAGE_COUNT: 5,
    SESSION_TIMEOUT_MINUTES: 30,
  },

  // Exercise settings
  EXERCISE: {
    DEFAULT_DIFFICULTY: 'medium',
    MIN_DIFFICULTY: 'easy',
    MAX_DIFFICULTY: 'challenge',
  },

  // Safety settings
  SAFETY: {
    MAX_MESSAGE_LENGTH: 2000,
    MAX_RESPONSE_LENGTH: 1000,
  },
} as const;

export type Settings = typeof SETTINGS;



