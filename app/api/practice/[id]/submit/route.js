import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { AIService } from '@/lib/gemini';

export async function POST(request, { params }) {
  try {
    const db = await getDb();
    const { id } = await params;
    const { answers } = await request.json();

    const exResult = await db.execute({ sql: 'SELECT type FROM exercises WHERE id = ?', args: [id] });
    const exerciseType = exResult.rows[0]?.type;

    const qResult = await db.execute({
      sql: 'SELECT id, question_text, correct_answer, options FROM questions WHERE exercise_id = ? ORDER BY order_index',
      args: [id],
    });

    const questions = qResult.rows;

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
    }

    let score = 0;
    const total = questions.length;
    const resultDetails = [];

    // Nếu là bài tập viết lại câu, gọi AI để chấm điểm hàng loạt
    let aiResults = [];
    if (exerciseType === 'rewriting') {
      const submissions = questions.map(q => {
        const userAnswer = answers[q.id];
        let referenceAnswer = q.correct_answer;
        try {
          const opts = JSON.parse(q.options);
          const firstValid = Object.values(opts).find(val => val && String(val).trim() !== '');
          if (firstValid) referenceAnswer = firstValid;
        } catch { }
        
        return {
          question: q.question_text || '',
          studentAnswer: userAnswer || '',
          referenceAnswer: referenceAnswer
        };
      });

      try {
        aiResults = await AIService.gradeExercises(submissions);
        if (!Array.isArray(aiResults) || aiResults.length === 0) {
          throw new Error('AI returned an empty or invalid response.');
        }
      } catch (aiError) {
        console.error("AI Grading failed:", aiError);
        return NextResponse.json(
          { error: 'Hệ thống AI hiện đang bận hoặc gặp lỗi khi chấm bài. Vui lòng nộp lại sau.' }, 
          { status: 503 }
        );
      }
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAnswer = answers[q.id];
      let isCorrect = false;
      let correction = null;
      let returnedCorrectAnswer = q.correct_answer;

      if (exerciseType === 'rewriting') {
        const aiRes = aiResults[i];
        isCorrect = aiRes?.score || false;
        correction = aiRes?.correction || null;

        try {
          const opts = JSON.parse(q.options);
          const firstValid = Object.values(opts).find(val => val && String(val).trim() !== '');
          returnedCorrectAnswer = firstValid || q.correct_answer;
        } catch { }
      } else {
        isCorrect = String(userAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
      }

      if (isCorrect) score += 1;

      resultDetails.push({
        question_id: Number(q.id),
        user_answer: userAnswer,
        correct_answer: returnedCorrectAnswer,
        isCorrect,
        correction, // Thêm correction từ AI
      });
    }

    const pctScore = Math.round((score / total) * 100);

    const insertResult = await db.execute({
      sql: 'INSERT INTO results (exercise_id, score, user_answers, ai_evaluation) VALUES (?, ?, ?, ?)',
      args: [id, pctScore, JSON.stringify(answers), JSON.stringify(resultDetails)],
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
