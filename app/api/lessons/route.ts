import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT id, title, topic, created_at FROM lessons ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const { title, topic, content } = await request.json();

    if (!title || !topic || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'INSERT INTO lessons (title, topic, content) VALUES (?, ?, ?)',
      args: [title, topic, content],
    });

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
