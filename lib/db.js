import { createClient } from '@libsql/client';

let client;
let initialized = false;

function getClient() {
  if (client) return client;

  const isProd = process.env.NODE_ENV === 'production';
  const url = "libsql://reading-test-online-tiendung14b.aws-ap-northeast-1.turso.io"

  if (!url) {
    if (isProd) {
      throw new Error('[DB] TURSO_DATABASE_URL is not set. Add it to Vercel Environment Variables.');
    }
    // Local dev fallback
    const { createClient: createLocalClient } = require('@libsql/client');
    client = createLocalClient({ url: 'file:database.db' });
    return client;
  }

  client = createClient({ url, authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MzgwNDYsImlkIjoiMDE5ZGIzNGYtYWQwMS03NDk3LTgyYmUtOTExNmMwZjUyMWI1IiwicmlkIjoiOWI5NTA5YzItZjk3Mi00ZjZmLTllMmItOGE5YjY0YWVkOWFiIn0.B7TvWkCTlm7yOfpo4L99w5mGiEgJb5EL10Lx7SCA7fX1ssFZCTMNHDBY4Mbg_UhARsg6IhR_TXQN7ycF9v25Dg" });
  return client;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('reading', 'cloze')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    question_text TEXT,
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    user_answers TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );
`;

export async function getDb() {
  const db = getClient();

  if (!initialized) {
    await db.executeMultiple(SCHEMA);
    initialized = true;
  }

  return db;
}

// kept for backwards compat
export { getDb as initDb };
