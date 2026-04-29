import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const db = await getDb();
    
    // Get total count
    const countResult = await db.execute(`SELECT COUNT(*) as count FROM results`);
    const totalItems = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Get overall stats
    const statsResult = await db.execute(`
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(DISTINCT exercise_id) as exercises_done,
        AVG(score) as average_score,
        MAX(score) as highest_score
      FROM results
    `);

    const stats = {
      totalAttempts: Number(statsResult.rows[0].total_attempts || 0),
      exercisesDone: Number(statsResult.rows[0].exercises_done || 0),
      averageScore: Math.round(Number(statsResult.rows[0].average_score || 0)),
      highestScore: Number(statsResult.rows[0].highest_score || 0)
    };

    const result = await db.execute({
      sql: `
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
        LIMIT ? OFFSET ?
      `,
      args: [limit, offset]
    });

    return Response.json({
      items: result.rows,
      stats,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Fetch history error:', error);
    return Response.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
