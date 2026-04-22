import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getDb();

    const result = await db.execute(`
      SELECT e.*,
             (SELECT score FROM results r WHERE r.exercise_id = e.id ORDER BY score DESC LIMIT 1) as highest_score,
             (SELECT completed_at FROM results r WHERE r.exercise_id = e.id ORDER BY completed_at DESC LIMIT 1) as last_attempt
      FROM exercises e
      ORDER BY e.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDb();

    const body = await request.json();
    const { title, content, type, questions, vocabulary } = body;

    if (!title || !content || !type || !questions) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    // Insert exercise
    const exResult = await db.execute({
      sql: 'INSERT INTO exercises (title, content, type) VALUES (?, ?, ?)',
      args: [title, content, type],
    });
    const exerciseId = Number(exResult.lastInsertRowid);

    // Insert questions
    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      await db.execute({
        sql: 'INSERT INTO questions (exercise_id, question_text, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?)',
        args: [
          exerciseId,
          q.question_text || null,
          JSON.stringify(q.options),
          q.correct_answer,
          index,
        ],
      });
    }

    // Insert/Link Vocabulary
    if (vocabulary && Array.isArray(vocabulary)) {
      for (const v of vocabulary) {
        // Find or Create vocabulary
        let vocabId;
        const existing = await db.execute({
          sql: 'SELECT id FROM vocabularies WHERE word = ? AND meaning = ?',
          args: [v.word, v.meaning]
        });

        if (existing.rows.length > 0) {
          vocabId = existing.rows[0].id;
        } else {
          const vResult = await db.execute({
            sql: 'INSERT INTO vocabularies (word, meaning, phonetic, example) VALUES (?, ?, ?, ?)',
            args: [v.word, v.meaning, v.phonetic || '', v.example || '']
          });
          vocabId = vResult.lastInsertRowid;
        }

        // Link to exercise
        await db.execute({
          sql: 'INSERT OR IGNORE INTO exercise_vocabularies (exercise_id, vocabulary_id) VALUES (?, ?)',
          args: [exerciseId, vocabId]
        });
      }
    }

    return NextResponse.json({ id: exerciseId, success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
