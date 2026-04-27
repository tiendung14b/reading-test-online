import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const { id } = await params;
    const result = await db.execute({
      sql: 'SELECT * FROM lessons WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const { id } = await params;
    
    // Check if exists
    const existing = await db.execute({
      sql: 'SELECT id FROM lessons WHERE id = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    await db.execute({
      sql: 'DELETE FROM lessons WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const { id } = await params;
    const { title, topic, content } = await request.json();

    if (!title || !topic || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM lessons WHERE id = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    await db.execute({
      sql: 'UPDATE lessons SET title = ?, topic = ?, content = ? WHERE id = ?',
      args: [title, topic, content, id],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


