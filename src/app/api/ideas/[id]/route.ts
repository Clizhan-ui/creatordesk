import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: { id: string };
}

// PUT /api/ideas/[id] - Update idea
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ideaId = Number(params.id);
  if (isNaN(ideaId)) {
    return NextResponse.json({ error: 'Invalid idea ID' }, { status: 400 });
  }

  try {
    const db = getDb();

    // Verify ownership
    const existing = (await db.prepare('SELECT id, user_id FROM content_ideas WHERE id = ?').get(ideaId)) as
      | { id: number; user_id: number }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this content idea' }, { status: 403 });
    }

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

    await db.prepare(`
      UPDATE content_ideas
      SET title = ?, description = ?, category = ?, platform = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(cleanTitle, description?.trim() || null, cleanCategory, cleanPlatform, cleanStatus, ideaId, session.id);

    const updated = await db.prepare('SELECT * FROM content_ideas WHERE id = ?').get(ideaId);

    return NextResponse.json({ idea: updated, message: 'Idea updated successfully' });
  } catch (error: any) {
    console.error('Error updating idea:', error);
    return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

// DELETE /api/ideas/[id] - Delete idea
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ideaId = Number(params.id);
  if (isNaN(ideaId)) {
    return NextResponse.json({ error: 'Invalid idea ID' }, { status: 400 });
  }

  try {
    const db = getDb();

    // Verify ownership
    const existing = (await db.prepare('SELECT id, user_id FROM content_ideas WHERE id = ?').get(ideaId)) as
      | { id: number; user_id: number }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this content idea' }, { status: 403 });
    }

    await db.prepare('DELETE FROM content_ideas WHERE id = ? AND user_id = ?').run(ideaId, session.id);

    return NextResponse.json({ success: true, message: 'Idea deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting idea:', error);
    return NextResponse.json({ error: 'Failed to delete idea' }, { status: 500 });
  }
}
