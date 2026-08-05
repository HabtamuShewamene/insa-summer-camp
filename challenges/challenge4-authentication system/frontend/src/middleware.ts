import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for token in cookie (set by setTokens) OR in a special header
  const accessToken = request.cookies.get('accessToken')?.value;

  // Routes that require authentication
  const protectedPrefixes = [
    '/dashboard',
    '/documents',
    '/settings',
    '/security',
    '/sessions',
    '/profile',
  ];

  // Routes only for guests (redirect logged-in users away)
  const authOnlyPaths = ['/login', '/register'];

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthOnly = authOnlyPaths.includes(pathname);

  // No cookie? If accessing a protected route, send to login
  if (isProtected && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Has cookie? If on login/register, redirect to dashboard
  if (isAuthOnly && accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
