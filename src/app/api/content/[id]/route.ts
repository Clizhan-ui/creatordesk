import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: { id: string };
}

// PUT /api/content/[id] - Update content
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentId = Number(params.id);
  if (isNaN(contentId)) {
    return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id, user_id FROM contents WHERE id = ?').get(contentId) as
      | { id: number; user_id: number }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this content' }, { status: 403 });
    }

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

    db.prepare(`
      UPDATE contents
      SET title = ?, description = ?, thumbnail_url = ?, platform = ?, category = ?, content_url = ?, published_at = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      cleanTitle,
      description?.trim() || null,
      thumbnail_url?.trim() || null,
      cleanPlatform,
      cleanCategory,
      content_url?.trim() || null,
      published_at || null,
      cleanStatus,
      contentId,
      session.id
    );

    const updated = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId);

    return NextResponse.json({ content: updated, message: 'Content updated successfully' });
  } catch (error: any) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

// DELETE /api/content/[id] - Delete content
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentId = Number(params.id);
  if (isNaN(contentId)) {
    return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id, user_id FROM contents WHERE id = ?').get(contentId) as
      | { id: number; user_id: number }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this content' }, { status: 403 });
    }

    db.prepare('DELETE FROM contents WHERE id = ? AND user_id = ?').run(contentId, session.id);

    return NextResponse.json({ success: true, message: 'Content deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
  }
}
