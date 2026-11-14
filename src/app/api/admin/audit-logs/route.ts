import { NextResponse } from 'next/server';
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
  const logs = db.prepare(`
    SELECT 
      l.*,
      u.name as user_name,
      u.email as user_email
    FROM audit_logs l
    LEFT JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC
    LIMIT 50
  `).all();

  return NextResponse.json({ logs });
}
