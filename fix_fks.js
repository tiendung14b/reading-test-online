const { createClient } = require('@libsql/client');
const client = createClient({ url: 'libsql://reading-test-online-tiendung14b.aws-ap-northeast-1.turso.io', authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY4MzgwNDYsImlkIjoiMDE5ZGIzNGYtYWQwMS03NDk3LTgyYmUtOTExNmMwZjUyMWI1IiwicmlkIjoiOWI5NTA5YzItZjk3Mi00ZjZmLTllMmItOGE5YjY0YWVkOWFiIn0.B7TvWkCTlm7yOfpo4L99w5mGiEgJb5EL10Lx7SCA7fX1ssFZCTMNHDBY4Mbg_UhARsg6IhR_TXQN7ycF9v25Dg' });

async function fix() {
  console.log('Starting FK fix...');
  try {
    // 1. Rename tables
    await client.execute('ALTER TABLE questions RENAME TO questions_old');
    await client.execute('ALTER TABLE results RENAME TO results_old');
    await client.execute('ALTER TABLE exercise_vocabularies RENAME TO ev_old');

    // 2. Create new tables with correct FKs
    await client.execute(`
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL,
        question_text TEXT,
        options TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );
    `);

    await client.execute(`
      CREATE TABLE results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        user_answers TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );
    `);

    await client.execute(`
      CREATE TABLE exercise_vocabularies (
        exercise_id INTEGER NOT NULL,
        vocabulary_id INTEGER NOT NULL,
        PRIMARY KEY(exercise_id, vocabulary_id),
        FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
        FOREIGN KEY(vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
      );
    `);

    // 3. Copy data
    await client.execute(`
      INSERT INTO questions (id, exercise_id, question_text, options, correct_answer, order_index)
      SELECT id, exercise_id, question_text, options, correct_answer, order_index FROM questions_old
    `);

    await client.execute(`
      INSERT INTO results (id, exercise_id, score, user_answers, completed_at)
      SELECT id, exercise_id, score, user_answers, completed_at FROM results_old
    `);

    await client.execute(`
      INSERT INTO exercise_vocabularies (exercise_id, vocabulary_id)
      SELECT exercise_id, vocabulary_id FROM ev_old
    `);

    // 4. Drop old tables
    await client.execute('DROP TABLE questions_old');
    await client.execute('DROP TABLE results_old');
    await client.execute('DROP TABLE ev_old');
    await client.execute('DROP TABLE IF EXISTS exercises_old'); // We don't need it anymore

    console.log('Fixed FKs!');
  } catch (err) {
    console.error('Error:', err);
  }
}

fix();
