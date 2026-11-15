import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'creatordesk-super-secret-development-fallback-key-32chars'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('creatordesk_token')?.value;

  // Security Headers applied to every request
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // If user is already authenticated and visits /login or /register, redirect cleanly to /dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Stale or invalid token: clear it and proceed to login page
      const cleanRes = NextResponse.next();
      cleanRes.cookies.set('creatordesk_token', '', { path: '/', maxAge: 0 });
      return cleanRes;
    }
  }

  // Protected paths check
  const isProtectedPath = ['/dashboard', '/ideas', '/planner', '/content', '/analytics', '/reports', '/profile'].some(
    (prefix) => pathname.startsWith(prefix)
  );

  const isAdminPath = pathname.startsWith('/admin');

  if (isProtectedPath || isAdminPath) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Verify admin role for /admin
      if (isAdminPath && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Invalid / expired token
      const loginUrl = new URL('/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete('creatordesk_token');
      return res;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
