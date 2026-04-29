import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    
    const offset = (page - 1) * limit;
    
    const db = await getDb();
    
    // Build where clause
    let whereClauses = [];
    let args = [];
    
    if (search) {
      whereClauses.push('e.title LIKE ?');
      args.push(`%${search}%`);
    }
    
    if (type !== 'all') {
      whereClauses.push('e.type = ?');
      args.push(type);
    }
    
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Count total items
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM exercises e ${whereString}`,
      args: args
    });
    const totalItems = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);
    
    // Fetch paginated items
    const itemsResult = await db.execute({
      sql: `
        SELECT e.*,
               (SELECT score FROM results r WHERE r.exercise_id = e.id ORDER BY score DESC LIMIT 1) as highest_score,
               (SELECT completed_at FROM results r WHERE r.exercise_id = e.id ORDER BY completed_at DESC LIMIT 1) as last_attempt
        FROM exercises e
        ${whereString}
        ORDER BY e.created_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset]
    });
    
    return NextResponse.json({
      items: itemsResult.rows,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getDb();

    const body = await request.json();
    const { title, content, type, questions, vocabulary } = body;

    if (!title || !content || !type || !questions) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    // Insert exercise
    const exResult = await db.execute({
      sql: 'INSERT INTO exercises (title, content, type) VALUES (?, ?, ?)',
      args: [title, content, type],
    });
    const exerciseId = Number(exResult.lastInsertRowid);

    // Insert questions
    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      await db.execute({
        sql: 'INSERT INTO questions (exercise_id, question_text, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?)',
        args: [
          exerciseId,
          q.question_text || null,
          JSON.stringify(q.options),
          q.correct_answer,
          index,
        ],
      });
    }

    // Insert/Link Vocabulary
    if (vocabulary && Array.isArray(vocabulary)) {
      for (const v of vocabulary) {
        // Find or Create vocabulary
        let vocabId;
        const existing = await db.execute({
          sql: 'SELECT id FROM vocabularies WHERE word = ? AND meaning = ?',
          args: [v.word, v.meaning]
        });

        if (existing.rows.length > 0) {
          vocabId = existing.rows[0].id;
        } else {
          const vResult = await db.execute({
            sql: 'INSERT INTO vocabularies (word, meaning, phonetic, example) VALUES (?, ?, ?, ?)',
            args: [v.word, v.meaning, v.phonetic || '', v.example || '']
          });
          vocabId = vResult.lastInsertRowid;
        }

        // Link to exercise
        await db.execute({
          sql: 'INSERT OR IGNORE INTO exercise_vocabularies (exercise_id, vocabulary_id) VALUES (?, ?)',
          args: [exerciseId, vocabId]
        });
      }
    }

    return NextResponse.json({ id: exerciseId, success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
