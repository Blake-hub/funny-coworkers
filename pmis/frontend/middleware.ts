import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pmis-token')?.value;
  
  const isLoginPage = request.nextUrl.pathname === '/login';
  
  if (!token) {
    if (!isLoginPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    if (isLoginPage) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/issues/:path*',
    '/projects/:path*',
    '/teams/:path*',
    '/wiki/:path*',
    '/reports/:path*',
    '/search/:path*',
    '/login',
  ],
};