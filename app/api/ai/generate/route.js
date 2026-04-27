import { NextResponse } from 'next/server';
import { AIService } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { topic, difficulty, exerciseType, numberOfQuestions } = await request.json();

    if (!topic || !difficulty || !exerciseType || !numberOfQuestions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const aiResult = await AIService.generateExercises(topic, difficulty, exerciseType, numberOfQuestions);

    return NextResponse.json({ success: true, data: aiResult });
  } catch (error) {
    console.error('AI Generate Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate exercises' }, { status: 500 });
  }
}
