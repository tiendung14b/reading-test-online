import Database from 'better-sqlite3';

let db;

if (!global.db) {
  // Connect to the database file in the project root
  global.db = new Database('database.db');
  
  // Initialize Schema
  global.db.exec(`
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
      options TEXT NOT NULL, -- JSON string
      correct_answer TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      user_answers TEXT NOT NULL, -- JSON string
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `);
}

db = global.db;

export default db;
