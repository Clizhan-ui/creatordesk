import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ContentItem } from '@/types';

// GET /api/content - List content items with aggregated analytics
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
  let query = `
    SELECT 
      c.*,
      COALESCE(a.views, 0) as views,
      COALESCE(a.likes, 0) as likes,
      COALESCE(a.comments, 0) as comments,
      COALESCE(a.shares, 0) as shares
    FROM contents c
    LEFT JOIN (
      SELECT 
        content_id,
        SUM(views) as views,
        SUM(likes) as likes,
        SUM(comments) as comments,
        SUM(shares) as shares
      FROM content_analytics
      GROUP BY content_id
    ) a ON c.id = a.content_id
    WHERE c.user_id = ?
  `;
  const params: any[] = [session.id];

  if (status && status !== 'all') {
    query += ' AND c.status = ?';
    params.push(status);
  }

  if (platform && platform !== 'all') {
    query += ' AND c.platform = ?';
    params.push(platform);
  }

  if (search) {
    query += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY c.created_at DESC';

  const contents = db.prepare(query).all(...params) as ContentItem[];

  return NextResponse.json({ contents });
}

// POST /api/content - Create new content item
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, thumbnail_url, platform, category, content_url, published_at, status } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanPlatform = (platform || 'YouTube').trim();
    const cleanCategory = (category || 'Tech').trim();
    const cleanStatus = ['Draft', 'In Production', 'Scheduled', 'Published'].includes(status)
      ? status
      : 'Draft';

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO contents (user_id, title, description, thumbnail_url, platform, category, content_url, published_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      cleanTitle,
      description?.trim() || null,
      thumbnail_url?.trim() || null,
      cleanPlatform,
      cleanCategory,
      content_url?.trim() || null,
      published_at || null,
      cleanStatus
    );

    const createdContent = db.prepare('SELECT * FROM contents WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ content: createdContent, message: 'Content created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating content:', error);
    return NextResponse.json({ error: 'Failed to create content item' }, { status: 500 });
  }
}
