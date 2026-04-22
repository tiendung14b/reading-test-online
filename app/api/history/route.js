import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute(`
      SELECT 
        r.id,
        r.exercise_id,
        r.score,
        r.completed_at,
        e.title,
        e.type
      FROM results r
      JOIN exercises e ON r.exercise_id = e.id
      ORDER BY r.completed_at DESC
    `);

    return Response.json(result.rows);
  } catch (error) {
    console.error('Fetch history error:', error);
    return Response.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
