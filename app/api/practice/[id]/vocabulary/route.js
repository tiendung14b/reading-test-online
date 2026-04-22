import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = await getDb();
    const { id } = await params;

    const result = await db.execute({
      sql: `
        SELECT v.* 
        FROM vocabularies v
        JOIN exercise_vocabularies ev ON v.id = ev.vocabulary_id
        WHERE ev.exercise_id = ?
      `,
      args: [id],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch vocabulary error:', error);
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 });
  }
}
