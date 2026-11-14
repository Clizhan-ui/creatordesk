import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { SessionUser, User } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'creatordesk-super-secret-development-fallback-key-32chars'
);

const COOKIE_NAME = 'creatordesk_token';
const TOKEN_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar_url: user.avatar_url,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: Number(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as SessionUser['role'],
      status: payload.status as SessionUser['status'],
      avatar_url: payload.avatar_url ? String(payload.avatar_url) : null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const user = await verifySessionToken(token);
    if (!user) return null;

    // Verify account is still active in database
    const db = getDb();
    const row = db.prepare('SELECT id, status, role FROM users WHERE id = ?').get(user.id) as
      | { id: number; status: string; role: string }
      | undefined;

    if (!row || row.status === 'suspended') {
      return null;
    }

    user.role = row.role as SessionUser['role'];
    user.status = row.status as SessionUser['status'];
    return user;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Rate Limiting for Security
export function checkRateLimit(
  identifier: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000 // 15 minutes window
): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const db = getDb();
  const now = Date.now();
  const existing = db
    .prepare('SELECT attempts, last_attempt_at FROM login_attempts WHERE identifier = ?')
    .get(identifier) as { attempts: number; last_attempt_at: number } | undefined;

  if (!existing) {
    db.prepare('INSERT INTO login_attempts (identifier, attempts, last_attempt_at) VALUES (?, 1, ?)').run(
      identifier,
      now
    );
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // If window has passed, reset counter
  if (now - existing.last_attempt_at > windowMs) {
    db.prepare('UPDATE login_attempts SET attempts = 1, last_attempt_at = ? WHERE identifier = ?').run(
      now,
      identifier
    );
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // If exceeded limit
  if (existing.attempts >= maxAttempts) {
    const retryAfterSec = Math.ceil((windowMs - (now - existing.last_attempt_at)) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  // Increment attempt
  const nextAttempts = existing.attempts + 1;
  db.prepare('UPDATE login_attempts SET attempts = ?, last_attempt_at = ? WHERE identifier = ?').run(
    nextAttempts,
    now,
    identifier
  );

  return { allowed: true, remainingAttempts: maxAttempts - nextAttempts };
}

export function resetRateLimit(identifier: string) {
  try {
    const db = getDb();
    db.prepare('DELETE FROM login_attempts WHERE identifier = ?').run(identifier);
  } catch {
    // Ignore
  }
}
