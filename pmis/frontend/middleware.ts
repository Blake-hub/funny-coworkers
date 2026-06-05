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
  const token = request.cookies.get('pmis-token')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login?reason=not-logged-in', request.url));
  }

  if (token && !isValidToken(token) && !isLoginPage) {
    const response = NextResponse.redirect(new URL('/login?reason=session-expired', request.url));
    response.cookies.delete('pmis-token');
    return response;
  }

  if (token && isLoginPage && isValidToken(token)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
