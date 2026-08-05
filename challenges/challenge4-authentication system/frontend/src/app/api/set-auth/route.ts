import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/set-auth?accessToken=...&refreshToken=...&redirect=/dashboard
 *
 * This server-side route sets the accessToken cookie via Set-Cookie header
 * BEFORE redirecting. This guarantees the cookie is present in the
 * middleware when the browser hits /dashboard.
 *
 * Used by the Google OAuth callback flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL('/login?error=missing_tokens', request.url));
  }

  // Validate redirect target — only allow relative paths on the same origin
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';

  const response = NextResponse.redirect(new URL(safeRedirect, request.url));

  // Set cookie server-side — this will be included in the redirect response
  // so the browser has it before hitting the middleware on the next request
  response.cookies.set('accessToken', accessToken, {
    httpOnly: false,   // needs to be readable by client JS (for API calls)
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });

  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
