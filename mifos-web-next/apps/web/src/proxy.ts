import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { can, getRoutePermission, isPublicPath } from '@mifos/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session/constants';
import { SERVER_CATALOG_COOKIE } from '@/lib/servers/constants';
import { parseServerSessionJson } from '@/lib/session/sanitize';
import type { ServerCatalog } from '@mifos/servers';

const CONNECT_PATH = '/connect';
const LOGIN_PATH = '/login';
const LOGOUT_PATH = '/api/auth/logout';
const LOGIN_API_PATH = '/api/auth/login';
const SERVER_HEALTH_PATH = '/api/servers/health';

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
  return parseServerSessionJson(raw);
}

function loginUrl(request: NextRequest, options?: { from?: string; servers?: boolean }) {
  const login = new URL(LOGIN_PATH, request.url);
  if (options?.from) {
    login.searchParams.set('from', options.from);
  }
  if (options?.servers) {
    login.searchParams.set('servers', '1');
  }
  return login;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/forbidden') ||
    pathname === LOGOUT_PATH ||
    pathname === LOGIN_API_PATH ||
    pathname === SERVER_HEALTH_PATH
  ) {
    return NextResponse.next();
  }

  if (pathname === CONNECT_PATH) {
    return NextResponse.redirect(
      loginUrl(request, { servers: !hasActiveServer(request) })
    );
  }

  if (isPublicPath(pathname) || pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  if (!hasActiveServer(request)) {
    return NextResponse.redirect(
      loginUrl(request, { from: pathname, servers: true })
    );
  }

  const session = readSession(request);
  if (!session) {
    return NextResponse.redirect(loginUrl(request, { from: pathname }));
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
