import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = await getDb();
    const { id } = await params;

    // Fetch result and exercise info
    const resResult = await db.execute({
      sql: `
        SELECT 
          r.id as result_id,
          r.score,
          r.user_answers,
          r.ai_evaluation,
          r.completed_at,
          e.id as exercise_id,
          e.title,
          e.content,
          e.type
        FROM results r
        JOIN exercises e ON r.exercise_id = e.id
        WHERE r.id = ?
      `,
      args: [id],
    });

    if (resResult.rows.length === 0) {
      return NextResponse.json({ error: 'History item not found' }, { status: 404 });
    }

    const result = resResult.rows[0];

    // Fetch all questions for this exercise
    const qResult = await db.execute({
      sql: 'SELECT id, question_text, options, correct_answer, order_index FROM questions WHERE exercise_id = ? ORDER BY order_index ASC',
      args: [result.exercise_id],
    });

    return NextResponse.json({
      ...result,
      user_answers: JSON.parse(result.user_answers),
      ai_evaluation: result.ai_evaluation ? JSON.parse(result.ai_evaluation) : null,
      questions: qResult.rows.map(q => ({
        ...q,
        options: JSON.parse(q.options)
      }))
    });
  } catch (error) {
    console.error('Fetch history detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch history details' }, { status: 500 });
  }
}
