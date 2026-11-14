import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT id, name, email, role, bio, avatar_url, status, created_at, updated_at
    FROM users WHERE id = ?
  `).get(session.id);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, bio, avatar_url } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE users
      SET name = ?, bio = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name.trim(), bio?.trim() || null, avatar_url?.trim() || null, session.id);

    const updated = db.prepare(`
      SELECT id, name, email, role, bio, avatar_url, status, created_at, updated_at
      FROM users WHERE id = ?
    `).get(session.id);

    return NextResponse.json({ user: updated, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
