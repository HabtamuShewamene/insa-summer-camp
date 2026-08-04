import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/auth/callback'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/api/auth/google'));

  // Auth paths that authenticated users shouldn't access
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.includes(pathname);

  // Strictly protect dashboard and any sub-routes
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/documents') || pathname.startsWith('/settings') || pathname.startsWith('/security') || pathname.startsWith('/sessions');

  // If trying to access protected route without token, redirect to login
  if (!isPublicPath && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Double check dashboard routes explicitly
  if (isDashboardRoute && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (isAuthPath && accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
