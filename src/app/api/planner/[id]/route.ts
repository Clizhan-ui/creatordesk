import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: { id: string };
}

// PUT /api/planner/[id] - Update plan
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const planId = Number(params.id);
  if (isNaN(planId)) {
    return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = (await db.prepare('SELECT * FROM content_plans WHERE id = ?').get(planId)) as any;

    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this plan' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, platform, category, scheduled_at, status, notes } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanPlatform = (platform || existing.platform).trim();
    const cleanCategory = (category || existing.category).trim();
    const cleanScheduledAt = scheduled_at || existing.scheduled_at;
    const cleanStatus = ['Planned', 'In Production', 'Ready', 'Published'].includes(status)
      ? status
      : existing.status;

    await db.prepare(`
      UPDATE content_plans
      SET title = ?, description = ?, platform = ?, category = ?, scheduled_at = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      cleanTitle,
      description !== undefined ? (description?.trim() || null) : existing.description,
      cleanPlatform,
      cleanCategory,
      cleanScheduledAt,
      cleanStatus,
      notes !== undefined ? (notes?.trim() || null) : existing.notes,
      planId,
      session.id
    );

    // If transitioned to 'Published' from another status, auto-create in contents table if not already existing
    if (existing.status !== 'Published' && cleanStatus === 'Published') {
      const alreadyInContent = await db.prepare('SELECT id FROM contents WHERE user_id = ? AND title = ?').get(session.id, cleanTitle);
      if (!alreadyInContent) {
        await db.prepare(`
          INSERT INTO contents (user_id, title, description, platform, category, published_at, status)
          VALUES (?, ?, ?, ?, ?, ?, 'Published')
        `).run(session.id, cleanTitle, description?.trim() || existing.description, cleanPlatform, cleanCategory, cleanScheduledAt);
      }
    }

    const updated = await db.prepare('SELECT * FROM content_plans WHERE id = ?').get(planId);

    return NextResponse.json({ plan: updated, message: 'Plan updated successfully' });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE /api/planner/[id] - Delete plan
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const planId = Number(params.id);
  if (isNaN(planId)) {
    return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = (await db.prepare('SELECT id, user_id FROM content_plans WHERE id = ?').get(planId)) as
      | { id: number; user_id: number }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this plan' }, { status: 403 });
    }

    await db.prepare('DELETE FROM content_plans WHERE id = ? AND user_id = ?').run(planId, session.id);

    return NextResponse.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
