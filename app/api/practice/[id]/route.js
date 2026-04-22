import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = await getDb();
    const { id } = await params;

    const exResult = await db.execute({
      sql: 'SELECT * FROM exercises WHERE id = ?',
      args: [id],
    });

    const exercise = exResult.rows[0];

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    const qResult = await db.execute({
      sql: 'SELECT id, exercise_id, question_text, options, correct_answer, order_index FROM questions WHERE exercise_id = ? ORDER BY order_index ASC',
      args: [id],
    });

    const parsedQuestions = qResult.rows.map(q => ({
      ...q,
      options: JSON.parse(q.options),
    }));

    // Fetch vocabulary
    const vResult = await db.execute({
      sql: `
        SELECT v.* 
        FROM vocabularies v
        JOIN exercise_vocabularies ev ON v.id = ev.vocabulary_id
        WHERE ev.exercise_id = ?
      `,
      args: [id],
    });

    return NextResponse.json({ ...exercise, questions: parsedQuestions, vocabulary: vResult.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const db = await getDb();
    const { id } = await params;
    const { title, content, type, questions, vocabulary } = await request.json();

    // Update exercise
    await db.execute({
      sql: 'UPDATE exercises SET title = ?, content = ?, type = ? WHERE id = ?',
      args: [title, content, type, id],
    });

    // Delete old questions and insert new ones
    await db.execute({ sql: 'DELETE FROM questions WHERE exercise_id = ?', args: [id] });
    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      await db.execute({
        sql: 'INSERT INTO questions (exercise_id, question_text, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?)',
        args: [id, q.question_text || null, JSON.stringify(q.options), q.correct_answer, index],
      });
    }

    // Update Vocabulary links
    await db.execute({ sql: 'DELETE FROM exercise_vocabularies WHERE exercise_id = ?', args: [id] });
    if (vocabulary && Array.isArray(vocabulary)) {
      for (const v of vocabulary) {
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

        await db.execute({
          sql: 'INSERT OR IGNORE INTO exercise_vocabularies (exercise_id, vocabulary_id) VALUES (?, ?)',
          args: [id, vocabId]
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const db = await getDb();
    const { id } = await params;

    await db.execute({ sql: 'DELETE FROM exercises WHERE id = ?', args: [id] });
    // Cascade should handle questions, results, and exercise_vocabularies if FK is set correctly
    // But let's be explicit if needed. FKs in SCHEMA are set with ON DELETE CASCADE.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

