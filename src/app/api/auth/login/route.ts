import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { comparePassword, createSessionToken, setSessionCookie, checkRateLimit, resetRateLimit } from '@/lib/auth';
import { User } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    // Rate Limiting check based on IP and email
    const rateLimitKey = `${ip}:${cleanEmail || 'unknown'}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 min

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again after ${rateLimit.retryAfterSec} seconds.`,
          retryAfterSec: rateLimit.retryAfterSec,
        },
        { status: 429 }
      );
    }

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = (await db.prepare(`
      SELECT id, name, email, password_hash, role, status, avatar_url
      FROM users WHERE email = ?
    `).get(cleanEmail)) as User | undefined;

    if (!user || !user.password_hash) {
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          remainingAttempts: rateLimit.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // Verify password hash
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          remainingAttempts: rateLimit.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Successful login: reset rate limit attempts
    resetRateLimit(rateLimitKey);

    // Audit log (non-blocking)
    try {
      await db.prepare(`
        INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address)
        VALUES (?, 'USER_LOGIN', 'USER', ?, 'User logged in successfully', ?)
      `).run(user.id, user.id, ip);
    } catch (auditErr) {
      console.warn('Audit log write warning:', auditErr);
    }

    // Session token
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar_url: user.avatar_url,
    };

    const token = await createSessionToken(sessionUser);
    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during login' },
      { status: 500 }
    );
  }
}
