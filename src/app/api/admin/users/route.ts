import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Strict RBAC enforcement
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const db = getDb();

  // Aggregate user statistics
  const users = db.prepare(`
    SELECT 
      u.id, u.name, u.email, u.role, u.status, u.created_at,
      COUNT(DISTINCT c.id) as content_count,
      COUNT(DISTINCT i.id) as ideas_count,
      COALESCE(SUM(a.views), 0) as total_views
    FROM users u
    LEFT JOIN contents c ON u.id = c.user_id
    LEFT JOIN content_ideas i ON u.id = i.user_id
    LEFT JOIN content_analytics a ON c.id = a.content_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();

  // System KPI metrics
  const kpis = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE status = 'active' AND role = 'creator') as active_creators,
      (SELECT COUNT(*) FROM users WHERE status = 'suspended') as suspended_users,
      (SELECT COUNT(*) FROM contents) as total_contents,
      (SELECT COALESCE(SUM(views), 0) FROM content_analytics) as total_system_views
  `).get() as any;

  return NextResponse.json({ users, kpis });
}
