import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Strict RBAC enforcement
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const targetUserId = Number(params.id);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  // Admin cannot suspend own account
  if (targetUserId === session.id) {
    return NextResponse.json({ error: 'Cannot modify your own administrator account status' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be active or suspended' }, { status: 400 });
    }

    const db = getDb();
    const existing = (await db.prepare('SELECT id, email FROM users WHERE id = ?').get(targetUserId)) as
      | { id: number; email: string }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, targetUserId);

    // Audit log (non-blocking)
    try {
      await db.prepare(`
        INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, 'ADMIN_USER_STATUS_CHANGE', 'USER', ?, ?, ?)
      `).run(
        session.id,
        targetUserId,
        `Changed status of ${existing.email} (ID #${targetUserId}) to ${status}`,
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      );
    } catch (auditErr) {
      console.warn('Audit log write warning:', auditErr);
    }

    return NextResponse.json({ success: true, message: `User status changed to ${status}` });
  } catch (error: any) {
    console.error('Admin status update error:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
