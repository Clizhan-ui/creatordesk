import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, validatePasswordStrength, createSessionToken, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // 1. Basic validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Password complexity validation
    const passwordCheck = validatePasswordStrength(password || '');
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    const db = getDb();

    // 3. Check duplicate email
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // 4. Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // 5. Insert new creator user (auto-advancing ID to guarantee no sequence collision in PostgreSQL)
    await db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, status)
      VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM users), ?, ?, ?, 'creator', 'active')
    `).run(name.trim(), cleanEmail, passwordHash);

    const newUser = (await db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) as { id: number };
    const userId = Number(newUser.id);

    // 6. Log audit event (non-blocking)
    try {
      await db.prepare(`
        INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, 'USER_REGISTERED', 'USER', ?, ?, ?)
      `).run(
        userId,
        userId,
        `New user registered: ${cleanEmail}`,
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      );
    } catch (auditErr) {
      console.warn('Audit log write warning:', auditErr);
    }

    // 7. Auto-login by generating session token and setting cookie
    const sessionUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role: 'creator' as const,
      status: 'active' as const,
    };

    const token = await createSessionToken(sessionUser);
    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Registration successful',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
