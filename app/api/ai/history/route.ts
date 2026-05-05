import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute(`
      SELECT h.*, e.title as exercise_title 
      FROM ai_chat_histories h 
      LEFT JOIN exercises e ON h.exercise_id = e.id 
      ORDER BY h.created_at DESC
    `);
    
    const items = result.rows.map((row: any) => ({
      ...row,
      messages: JSON.parse(row.messages as string)
    }));
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('[AI_HISTORY_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { exercise_id, title, context, messages, user_answer, ai_feedback } = await req.json();
    
    if (!title || !messages) {
      return NextResponse.json({ error: 'Title and messages are required' }, { status: 400 });
    }
    
    const db = await getDb();
    await db.execute({
      sql: 'INSERT INTO ai_chat_histories (exercise_id, title, context, messages, user_answer, ai_feedback) VALUES (?, ?, ?, ?, ?, ?)',
      args: [exercise_id || null, title, context || null, JSON.stringify(messages), user_answer || null, ai_feedback || null]
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AI_HISTORY_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
