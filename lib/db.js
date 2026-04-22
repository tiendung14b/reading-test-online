import { createClient } from '@libsql/client';

let client;
let initialized = false;

function getClient() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL || 'file:database.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  client = createClient({ url, authToken });
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
