import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;

    const exResult = await db.execute({
      sql: 'SELECT * FROM exercises WHERE id = ?',
      args: [id],
    });

    const exercise = exResult.rows[0];

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const qResult = await db.execute({
      sql: 'SELECT id, exercise_id, question_text, options, order_index FROM questions WHERE exercise_id = ? ORDER BY order_index ASC',
      args: [id],
    });

    const parsedQuestions = qResult.rows.map(q => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    return NextResponse.json({ ...exercise, questions: parsedQuestions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch exercise' }, { status: 500 });
  }
}
