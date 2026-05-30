import type { PermissionInput, PermissionRule } from './types';
import type { PermissionKey } from './permissions-map';
import { resolvePermission } from './permissions-map';

export interface RouteRule {
  /** Path prefix match (e.g. /clients) */
  prefix: string;
  permissionKey?: PermissionKey;
  permission?: PermissionInput;
}

/**
 * Route-level RBAC — longest prefix wins (sorted descending by length).
 */
export const ROUTE_MANIFEST: RouteRule[] = [
  { prefix: '/clients', permissionKey: 'clients.list' },
  { prefix: '/checker-inbox-and-tasks', permissionKey: 'checkerInbox' }
];

const SORTED_ROUTES = [...ROUTE_MANIFEST].sort((a, b) => b.prefix.length - a.prefix.length);

export function getRoutePermission(pathname: string): PermissionInput | PermissionRule | undefined {
  const rule = SORTED_ROUTES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  if (!rule) {
    return undefined;
  }
  if (rule.permissionKey) {
    return resolvePermission(rule.permissionKey);
  }
  return rule.permission;
}

/** Paths that never require authentication. */
export const PUBLIC_PATH_PREFIXES = ['/login', '/callback'];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
