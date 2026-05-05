import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.execute({
      sql: 'SELECT * FROM ai_chat_histories WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'History not found' }, { status: 404 });
    }
    
    const row = result.rows[0] as any;
    const item = {
      ...row,
      messages: JSON.parse(row.messages as string)
    };
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('[AI_HISTORY_ID_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.execute({
      sql: 'DELETE FROM ai_chat_histories WHERE id = ?',
      args: [id]
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AI_HISTORY_ID_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
