import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const db = await getDb();
    const { id } = await params;
    const { answers } = await request.json();

    const exResult = await db.execute({ sql: 'SELECT type FROM exercises WHERE id = ?', args: [id] });
    const exerciseType = exResult.rows[0]?.type;

    const qResult = await db.execute({
      sql: 'SELECT id, correct_answer, options FROM questions WHERE exercise_id = ?',
      args: [id],
    });

    const questions = qResult.rows;

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
    }

    let score = 0;
    const total = questions.length;
    const resultDetails = [];

    for (const q of questions) {
      const userAnswer = answers[q.id];
      let isCorrect = false;
      let returnedCorrectAnswer = q.correct_answer;

      if (exerciseType === 'rewriting') {
        isCorrect = true;
        try {
          const opts = JSON.parse(q.options);
          const firstValid = Object.values(opts).find(val => val && String(val).trim() !== '');
          returnedCorrectAnswer = firstValid || '';
        } catch { returnedCorrectAnswer = ''; }
      } else {
        isCorrect = userAnswer === q.correct_answer;
      }

      if (isCorrect) score += 1;

      resultDetails.push({
        question_id: Number(q.id),
        user_answer: userAnswer,
        correct_answer: returnedCorrectAnswer,
        isCorrect,
      });
    }

    const pctScore = Math.round((score / total) * 100);

    const insertResult = await db.execute({
      sql: 'INSERT INTO results (exercise_id, score, user_answers) VALUES (?, ?, ?)',
      args: [id, pctScore, JSON.stringify(answers)],
    });

    return NextResponse.json({
      success: true,
      result_id: Number(insertResult.lastInsertRowid),
      score,
      total,
      details: resultDetails,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
