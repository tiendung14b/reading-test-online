import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute('SELECT * FROM api_keys');
    return NextResponse.json({ success: true, tokens: result.rows });
  } catch (error) {
    console.error('Fetch tokens error:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { token, daily_limit } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    const limit = parseInt(daily_limit) || 15;
    const db = await getDb();
    
    await db.execute({
      sql: 'INSERT INTO api_keys (token, daily_limit) VALUES (?, ?)',
      args: [token, limit]
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add token error:', error);
    return NextResponse.json({ error: 'Failed to add token. It may already exist.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, daily_limit } = await request.json();
    if (!id || daily_limit === undefined) {
      return NextResponse.json({ error: 'ID and daily_limit are required' }, { status: 400 });
    }

    const limit = parseInt(daily_limit);
    if (isNaN(limit) || limit < 0) {
      return NextResponse.json({ error: 'Invalid daily_limit' }, { status: 400 });
    }

    const db = await getDb();
    await db.execute({
      sql: 'UPDATE api_keys SET daily_limit = ? WHERE id = ?',
      args: [limit, id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update token error:', error);
    return NextResponse.json({ error: 'Failed to update token limit' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const db = await getDb();
    await db.execute({
      sql: 'DELETE FROM api_keys WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete token error:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}
