import { NextRequest, NextResponse } from 'next/server';
import { getSession, comparePassword, hashPassword, validatePasswordStrength } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { User } from '@/types';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    const db = getDb();
    const user = (await db.prepare('SELECT id, password_hash, email FROM users WHERE id = ?').get(session.id)) as
      | User
      | undefined;

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    // Verify old password
    const matches = await comparePassword(currentPassword, user.password_hash);
    if (!matches) {
      return NextResponse.json({ error: 'Current password does not match' }, { status: 400 });
    }

    // Validate new password strength
    const check = validatePasswordStrength(newPassword);
    if (!check.valid) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    await db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newHash, session.id);

    // Audit log (non-blocking)
    try {
      await db.prepare(`
        INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, 'PASSWORD_CHANGED', 'USER', ?, 'User successfully updated password', ?)
      `).run(session.id, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');
    } catch (auditErr) {
      console.warn('Audit log write warning:', auditErr);
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
