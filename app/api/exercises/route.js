import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const exercises = db.prepare(`
      SELECT e.*, 
             (SELECT score FROM results r WHERE r.exercise_id = e.id ORDER BY score DESC LIMIT 1) as highest_score,
             (SELECT completed_at FROM results r WHERE r.exercise_id = e.id ORDER BY completed_at DESC LIMIT 1) as last_attempt
      FROM exercises e
      ORDER BY e.created_at DESC
    `).all();

    return NextResponse.json(exercises);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, content, type, questions } = body;

    if (!title || !content || !type || !questions) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    const insertExercise = db.prepare('INSERT INTO exercises (title, content, type) VALUES (?, ?, ?)');
    const insertQuestion = db.prepare('INSERT INTO questions (exercise_id, question_text, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?)');

    const tx = db.transaction((title, content, type, questions) => {
      const result = insertExercise.run(title, content, type);
      const exerciseId = result.lastInsertRowid;

      questions.forEach((q, index) => {
        insertQuestion.run(
          exerciseId,
          q.question_text || null,
          JSON.stringify(q.options),
          q.correct_answer,
          index
        );
      });

      return exerciseId;
    });

    const newExerciseId = tx(title, content, type, questions);

    return NextResponse.json({ id: newExerciseId, success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
}
