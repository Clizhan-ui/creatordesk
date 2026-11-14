import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ContentIdea } from '@/types';

// GET /api/ideas - List ideas for authenticated creator
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const platform = searchParams.get('platform')?.trim() || '';

  const db = getDb();

  let query = 'SELECT * FROM content_ideas WHERE user_id = ?';
  const params: any[] = [session.id];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (platform && platform !== 'all') {
    query += ' AND platform = ?';
    params.push(platform);
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY created_at DESC';

  const ideas = db.prepare(query).all(...params) as ContentIdea[];

  return NextResponse.json({ ideas });
}

// POST /api/ideas - Create new idea
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, platform, status } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanCategory = (category || 'General').trim();
    const cleanPlatform = (platform || 'YouTube').trim();
    const cleanStatus = ['New Idea', 'Planned', 'In Production', 'Completed'].includes(status)
      ? status
      : 'New Idea';

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO content_ideas (user_id, title, description, category, platform, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(session.id, cleanTitle, description?.trim() || null, cleanCategory, cleanPlatform, cleanStatus);

    const createdIdea = db.prepare('SELECT * FROM content_ideas WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ idea: createdIdea, message: 'Idea created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: 'Failed to create content idea' }, { status: 500 });
  }
}
