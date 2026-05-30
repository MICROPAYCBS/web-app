import { APP_ROUTES } from './app-routes';
import type { RouteDefinition } from './types';

export interface DerivedNavItem {
  id: string;
  href: string;
  label: string;
  permissionKey?: string;
}

export interface DerivedRouteRule {
  prefix: string;
  permissionKey?: string;
}

type AppRoute = RouteDefinition;

function isNavRoute(route: RouteDefinition): route is RouteDefinition & { nav: true } {
  return 'nav' in route && route.nav === true;
}

function routesByPathLength(): RouteDefinition[] {
  return Object.values(APP_ROUTES) as RouteDefinition[];
}

/** Sidebar nav from registry (sorted by navOrder). */
export function buildNavManifest(): DerivedNavItem[] {
  return (Object.values(APP_ROUTES) as RouteDefinition[])
    .filter(isNavRoute)
    .sort((a, b) => (a.navOrder ?? 0) - (b.navOrder ?? 0))
    .map((r) => ({
      id: r.id,
      href: r.path,
      label: r.label,
      permissionKey: r.permissionKey
    }));
}

/** RBAC route rules — pages and APIs with permissionKey. */
export function buildRouteManifest(): DerivedRouteRule[] {
  return (Object.values(APP_ROUTES) as RouteDefinition[])
    .filter((r) => Boolean(r.permissionKey) && (r.kind === 'page' || r.kind === 'api'))
    .map((r) => ({
      prefix: r.path,
      permissionKey: r.permissionKey
    }));
}

export function buildPublicPathPrefixes(): string[] {
  return (Object.values(APP_ROUTES) as RouteDefinition[])
    .filter((r) => r.public === true)
    .map((r) => r.path);
}

/** Longest-prefix match; returns semantic permission key if any. */
export function resolveRoutePermissionKey(pathname: string): string | undefined {
  const sorted = routesByPathLength();
  const match = sorted.find(
    (r) =>
      r.permissionKey &&
      (pathname === r.path || (r.kind === 'page' && pathname.startsWith(`${r.path}/`)))
  );
  return match?.permissionKey;
}

export function routeRequiresServer(pathname: string): boolean {
  const route = sortedMatch(pathname);
  if (!route) {
    return true;
  }
  return route.requiresServer !== false;
}

export function routeRequiresAuth(pathname: string): boolean {
  const route = sortedMatch(pathname);
  if (!route) {
    return true;
  }
  return route.requiresAuth !== false;
}

function sortedMatch(pathname: string): RouteDefinition | undefined {
  const sorted = routesByPathLength();
  return sorted.find((r) => pathname === r.path || pathname.startsWith(`${r.path}/`));
}
