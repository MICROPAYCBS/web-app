import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { can, getRoutePermission, isPublicPath } from '@mifos/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session/constants';
import { parseServerSessionJson } from '@/lib/session/sanitize';

function readSession(request: NextRequest) {
  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseServerSessionJson(raw);
  if (session) {
    return session;
  }
  if (process.env.NODE_ENV !== 'production' && process.env.RBAC_DEV_SESSION) {
    return parseServerSessionJson(process.env.RBAC_DEV_SESSION);
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/forbidden')) {
    return NextResponse.next();
  }

  const session = readSession(request);
  if (!session) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  if (process.env.RBAC_ENABLED === 'false') {
    return NextResponse.next();
  }

  // UI routes — API routes enforce permissions in Route Handlers
  if (!pathname.startsWith('/api')) {
    const required = getRoutePermission(pathname);
    if (required && !can(session, required)) {
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
