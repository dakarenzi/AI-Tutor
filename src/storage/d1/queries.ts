/**
 * queries.ts
 * 
 * D1 query functions
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { SessionState } from '../../ai/schemas/SessionSchema';
import type { Message } from '../../ai/schemas/AgentRequest';
import type { ProgressEntry } from '../../ai/memory/MemorySchema';

export class D1Queries {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Create a new session
   */
  async createSession(session: SessionState): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO sessions (session_id, user_id, created_at, updated_at, last_activity_at, current_topic, current_difficulty, conversation_phase, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        session.sessionId,
        session.userId,
        session.createdAt,
        session.updatedAt,
        session.lastActivityAt,
        session.currentTopic || null,
        session.currentDifficulty || null,
        session.conversationPhase || null,
        JSON.stringify(session.metadata || {})
      )
      .run();
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionState | null> {
    const result = await this.db
      .prepare('SELECT * FROM sessions WHERE session_id = ?')
      .bind(sessionId)
      .first();

    if (!result) return null;

    return {
      sessionId: result.session_id as string,
      userId: result.user_id as string,
      createdAt: result.created_at as number,
      updatedAt: result.updated_at as number,
      lastActivityAt: result.last_activity_at as number,
      currentTopic: result.current_topic as string | undefined,
      currentDifficulty: result.current_difficulty as any,
      conversationPhase: result.conversation_phase as any,
      shortTermMemory: [],
      conversationHistory: [],
      progress: {
        topicsCovered: [],
        exercisesCompleted: 0,
        exercisesCorrect: 0,
        currentStreak: 0,
        confusionSignals: 0,
      },
      metadata: result.metadata ? JSON.parse(result.metadata as string) : {},
    };
  }

  /**
   * Add a message
   */
  async addMessage(message: Message & { messageId: string; sessionId: string }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO messages (message_id, session_id, role, content, timestamp)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        message.messageId,
        message.sessionId,
        message.role,
        message.content,
        message.timestamp || Date.now()
      )
      .run();
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string, limit?: number): Promise<Message[]> {
    const query = limit
      ? `SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC`;

    const stmt = limit
      ? this.db.prepare(query).bind(sessionId, limit)
      : this.db.prepare(query).bind(sessionId);

    const results = await stmt.all();

    return (results.results || []).map((row: any) => ({
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content as string,
      timestamp: row.timestamp as number,
    }));
  }

  /**
   * Add a progress entry
   */
  async addProgressEntry(entry: ProgressEntry & { entryId: string; sessionId: string; userId: string }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO progress_entries (entry_id, session_id, user_id, timestamp, topic, exercise_id, correct, difficulty, time_spent, errors)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        entry.entryId,
        entry.sessionId,
        entry.userId,
        entry.timestamp,
        entry.topic,
        entry.exerciseId || null,
        entry.correct ? 1 : 0,
        entry.difficulty,
        entry.timeSpent || null,
        entry.errors ? JSON.stringify(entry.errors) : null
      )
      .run();
  }

  /**
   * Get progress entries for a user
   */
  async getProgressEntries(userId: string, limit?: number): Promise<ProgressEntry[]> {
    const query = limit
      ? `SELECT * FROM progress_entries WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM progress_entries WHERE user_id = ? ORDER BY timestamp DESC`;

    const stmt = limit
      ? this.db.prepare(query).bind(userId, limit)
      : this.db.prepare(query).bind(userId);

    const results = await stmt.all();

    return (results.results || []).map((row: any) => ({
      timestamp: row.timestamp as number,
      topic: row.topic as string,
      exerciseId: row.exercise_id as string | undefined,
      correct: (row.correct as number) === 1,
      difficulty: row.difficulty as any,
      timeSpent: row.time_spent as number | undefined,
      errors: row.errors ? JSON.parse(row.errors) : undefined,
    }));
  }
}



