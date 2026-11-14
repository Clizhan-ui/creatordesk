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
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // 4. Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // 5. Insert new creator user (default role is creator for self-registration)
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'creator', 'active')
    `).run(name.trim(), cleanEmail, passwordHash);

    const userId = Number(result.lastInsertRowid);

    // 6. Log audit event
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (?, 'USER_REGISTERED', ?, ?)
    `).run(
      userId,
      `New user registered: ${cleanEmail}`,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

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
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
