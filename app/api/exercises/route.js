import { getDb, initDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getDb();

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
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    await initDb();

    const body = await request.json();
    const { title, content, type, questions } = body;

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

    return NextResponse.json({ id: exerciseId, success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
