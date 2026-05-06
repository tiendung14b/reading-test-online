import { NextResponse } from 'next/server';
import { AIService } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { topic, lessonType, difficulty, instructions, language } = await req.json();

    if (!topic || !lessonType) {
      return NextResponse.json({ error: 'Topic and Lesson Type are required' }, { status: 400 });
    }

    const lesson = await AIService.generateLessonContent(topic, lessonType, difficulty, instructions, language);

    return NextResponse.json({ success: true, lesson });
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.message === 'NO_TOKENS_AVAILABLE') {
      return NextResponse.json({ error: 'AI service is temporarily unavailable (no tokens)' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to generate lesson content' }, { status: 500 });
  }
}
