import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: { id: string };
}

// DELETE /api/analytics/[id]
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const logId = Number(params.id);
  if (isNaN(logId)) {
    return NextResponse.json({ error: 'Invalid log ID' }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id, user_id FROM content_analytics WHERE id = ?').get(logId) as
      | { id: number; user_id: number }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this analytics log' }, { status: 403 });
    }

    db.prepare('DELETE FROM content_analytics WHERE id = ? AND user_id = ?').run(logId, session.id);

    return NextResponse.json({ success: true, message: 'Analytics log deleted' });
  } catch (error: any) {
    console.error('Error deleting analytics log:', error);
    return NextResponse.json({ error: 'Failed to delete analytics log' }, { status: 500 });
  }
}
