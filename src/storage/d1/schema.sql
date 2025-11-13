-- D1 Database Schema for Analytics

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  current_topic TEXT,
  current_difficulty TEXT,
  conversation_phase TEXT,
  metadata TEXT -- JSON string
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Progress entries table
CREATE TABLE IF NOT EXISTS progress_entries (
  entry_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  topic TEXT NOT NULL,
  exercise_id TEXT,
  correct INTEGER NOT NULL, -- 0 or 1
  difficulty TEXT NOT NULL,
  time_spent INTEGER,
  errors TEXT, -- JSON array string
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id TEXT PRIMARY KEY,
  level TEXT, -- 'beginner' | 'intermediate' | 'advanced'
  goals TEXT, -- JSON array string
  exam_date TEXT,
  time_per_day INTEGER,
  strengths TEXT, -- JSON array string
  weaknesses TEXT, -- JSON array string
  learning_style TEXT,
  curriculum TEXT,
  language TEXT,
  subjects TEXT, -- JSON array string
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Analytics summary table
CREATE TABLE IF NOT EXISTS analytics_summary (
  user_id TEXT PRIMARY KEY,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  correct_exercises INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0.0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  topics_covered TEXT, -- JSON array string
  last_updated INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_timestamp ON progress_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);



