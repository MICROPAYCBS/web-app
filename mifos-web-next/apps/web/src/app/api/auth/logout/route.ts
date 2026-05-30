import { NextResponse } from 'next/server';
import { sessionCookieAttributes } from '@/lib/session/cookie-options';

export const dynamic = 'force-dynamic';

/**
 * Sign out via full navigation — clears `mifos-session` on the redirect response.
 * Prefer this over server-action logout; Set-Cookie is reliable on Route Handlers.
 */
function logoutRedirect(request: Request) {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  const attrs = sessionCookieAttributes(0);
  response.cookies.set(attrs.name, '', {
    ...attrs,
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}

export function GET(request: Request) {
  return logoutRedirect(request);
}

export function POST(request: Request) {
  return logoutRedirect(request);
}
