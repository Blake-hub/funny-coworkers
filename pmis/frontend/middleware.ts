import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isValidToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    let payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) payloadStr += '=';

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf-8'));
    if (!payload || !payload.sub || typeof payload.exp !== 'number') return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp >= currentTime;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get('pmis-token');
  const token = tokenCookie?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!token && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('reason', 'not-logged-in');
    return NextResponse.redirect(loginUrl);
  }

  if (token && !isValidToken(token) && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('reason', 'session-expired');
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('pmis-token');
    return response;
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/issues/:path*', '/projects/:path*', '/teams/:path*', '/wiki/:path*', '/reports/:path*', '/search/:path*', '/settings/:path*', '/login'],
};
