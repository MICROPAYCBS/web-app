import {
  buildPublicPathPrefixes,
  buildRouteManifest,
  resolveRoutePermissionKey
} from '@mifos/routes/server';
import type { PermissionInput, PermissionRule } from './types';
import type { PermissionKey } from './permissions-map';
import { resolvePermission } from './permissions-map';

export interface RouteRule {
  prefix: string;
  permissionKey?: PermissionKey;
  permission?: PermissionInput;
}

/** Derived from @mifos/routes — do not edit manually. */
export const ROUTE_MANIFEST: RouteRule[] = buildRouteManifest().map((r) => ({
  ...r,
  permissionKey: r.permissionKey as PermissionKey | undefined
}));

export function getRoutePermission(pathname: string): PermissionInput | PermissionRule | undefined {
  const key = resolveRoutePermissionKey(pathname);
  if (!key) {
    return undefined;
  }
  return resolvePermission(key as PermissionKey);
}

/** Paths that never require authentication. */
export const PUBLIC_PATH_PREFIXES = buildPublicPathPrefixes();

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
