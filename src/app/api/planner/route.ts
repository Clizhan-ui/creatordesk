import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ContentPlan } from '@/types';

// GET /api/planner - List content plans
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const platform = searchParams.get('platform')?.trim() || '';
  const month = searchParams.get('month'); // optional 'YYYY-MM'

  const db = getDb();
  let query = 'SELECT * FROM content_plans WHERE user_id = ?';
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

  if (month) {
    query += " AND strftime('%Y-%m', scheduled_at) = ?";
    params.push(month);
  }

  query += ' ORDER BY scheduled_at ASC';

  const plans = db.prepare(query).all(...params) as ContentPlan[];

  return NextResponse.json({ plans });
}

// POST /api/planner - Create new plan
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, platform, category, scheduled_at, status, notes } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!scheduled_at) {
      return NextResponse.json({ error: 'Scheduled publication date is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanPlatform = (platform || 'YouTube').trim();
    const cleanCategory = (category || 'Tech').trim();
    const cleanStatus = ['Planned', 'In Production', 'Ready', 'Published'].includes(status)
      ? status
      : 'Planned';

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO content_plans (user_id, title, description, platform, category, scheduled_at, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      cleanTitle,
      description?.trim() || null,
      cleanPlatform,
      cleanCategory,
      scheduled_at,
      cleanStatus,
      notes?.trim() || null
    );

    const planId = Number(result.lastInsertRowid);

    // If status is immediately set to 'Published', also auto-sync to contents inventory if requested
    if (cleanStatus === 'Published') {
      db.prepare(`
        INSERT INTO contents (user_id, title, description, platform, category, published_at, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Published')
      `).run(session.id, cleanTitle, description?.trim() || null, cleanPlatform, cleanCategory, scheduled_at);
    }

    const createdPlan = db.prepare('SELECT * FROM content_plans WHERE id = ?').get(planId);

    return NextResponse.json({ plan: createdPlan, message: 'Plan created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: 'Failed to create content plan' }, { status: 500 });
  }
}
