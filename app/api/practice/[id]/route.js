import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const questions = db.prepare('SELECT id, exercise_id, question_text, options, order_index FROM questions WHERE exercise_id = ? ORDER BY order_index ASC').all(id);

    // Parse options for convenience on the frontend
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    return NextResponse.json({ ...exercise, questions: parsedQuestions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch exercise' }, { status: 500 });
  }
}
