import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { can, getRoutePermission, isPublicPath } from '@mifos/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session/constants';
import { SERVER_CATALOG_COOKIE } from '@/lib/servers/constants';
import { parseServerSessionJson } from '@/lib/session/sanitize';
import type { ServerCatalog } from '@mifos/servers';
import { isDemoSessionEnabled } from '@/lib/session/demo-session';

const CONNECT_PATH = '/connect';
const LOGIN_PATH = '/login';

function readCatalog(request: NextRequest): ServerCatalog | null {
  const raw = request.cookies.get(SERVER_CATALOG_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ServerCatalog;
    if (!Array.isArray(parsed.servers)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function hasActiveServer(request: NextRequest): boolean {
  const catalog = readCatalog(request);
  if (!catalog?.activeServerId) {
    return false;
  }
  return catalog.servers.some((s) => s.id === catalog.activeServerId);
}

function readSession(request: NextRequest) {
  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseServerSessionJson(raw);
  if (session) {
    return session;
  }
  if (process.env.RBAC_DEV_SESSION) {
    if (process.env.NODE_ENV !== 'production' || isDemoSessionEnabled()) {
      return parseServerSessionJson(process.env.RBAC_DEV_SESSION);
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/forbidden')) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname) || pathname === CONNECT_PATH) {
    if (pathname === LOGIN_PATH && !hasActiveServer(request)) {
      return NextResponse.redirect(new URL(CONNECT_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (!hasActiveServer(request)) {
    return NextResponse.redirect(new URL(CONNECT_PATH, request.url));
  }

  const session = readSession(request);
  if (!session) {
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  if (process.env.RBAC_ENABLED === 'false') {
    return NextResponse.next();
  }

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
