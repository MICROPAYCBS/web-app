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
const TWOFACTOR_API_PREFIX = '/api/auth/twofactor';
const LOGIN_ERROR_FLASH_PATH = '/api/auth/login-error-flash';
const SERVER_HEALTH_PATH = '/api/servers/health';
const SENTRY_TUNNEL_PATH = process.env.SENTRY_TUNNEL_ROUTE ?? '/monitoring';

/** Query keys that must never appear on /login (e.g. accidental form GET). */
const LOGIN_SENSITIVE_QUERY_KEYS = [
  'username',
  'password',
  'user',
  'pass',
  'pwd',
  'passwd',
  'secret'
] as const;

function stripSensitiveLoginQuery(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== LOGIN_PATH) {
    return null;
  }
  const url = request.nextUrl.clone();
  let changed = false;
  for (const key of LOGIN_SENSITIVE_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) {
    return null;
  }
  // Replace so credentials never linger in browser history from this hop.
  return NextResponse.redirect(url, 303);
}

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

  const sanitizedLogin = stripSensitiveLoginQuery(request);
  if (sanitizedLogin) {
    return sanitizedLogin;
  }

  if (
    pathname.startsWith('/forbidden') ||
    pathname === SENTRY_TUNNEL_PATH ||
    pathname === LOGOUT_PATH ||
    pathname === LOGIN_API_PATH ||
    pathname.startsWith(TWOFACTOR_API_PREFIX) ||
    pathname === LOGIN_ERROR_FLASH_PATH ||
    pathname === SERVER_HEALTH_PATH
  ) {
    return NextResponse.next();
  }

  if (pathname === CONNECT_PATH) {
    return NextResponse.redirect(loginUrl(request, { servers: !hasActiveServer(request) }));
  }

  if (isPublicPath(pathname) || pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  if (!hasActiveServer(request)) {
    return NextResponse.redirect(loginUrl(request, { from: pathname, servers: true }));
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\..*).*)']
};
