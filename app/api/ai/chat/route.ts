import { AIService } from '@/lib/gemini';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { exerciseContext, history, message } = await req.json();

    if (!message || !exerciseContext) {
      return NextResponse.json({ error: 'Missing message or exercise context' }, { status: 400 });
    }

    const aiResponse = await AIService.chatWithExerciseContext(exerciseContext, history || [], message);
    
    return NextResponse.json({ text: aiResponse });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: 'Failed to communicate with AI' }, { status: 500 });
  }
}
