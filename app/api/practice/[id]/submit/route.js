import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { answers } = await request.json(); // { [question_id]: "A", ... }

    // Fetch the correct answers from the database
    const questions = db.prepare('SELECT id, correct_answer FROM questions WHERE exercise_id = ?').all(id);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
    }

    let score = 0;
    const total = questions.length;
    const resultDetails = [];

    for (const q of questions) {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score += 1;

      resultDetails.push({
        question_id: q.id,
        user_answer: userAnswer,
        correct_answer: q.correct_answer,
        isCorrect
      });
    }

    // Save the result to the database
    const insertResult = db.prepare('INSERT INTO results (exercise_id, score, user_answers) VALUES (?, ?, ?)');
    const result = insertResult.run(id, Math.round((score / total) * 100), JSON.stringify(answers));

    return NextResponse.json({
      success: true,
      result_id: result.lastInsertRowid,
      score,
      total,
      details: resultDetails
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit answers' }, { status: 500 });
  }
}
