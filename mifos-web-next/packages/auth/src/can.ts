/**
 * Fineract permission checks — mirrors openMF/web-app HasPermissionDirective rules.
 */

import type { PermissionInput, PermissionRule, SessionUser } from './types';

function normalizePermissions(user: SessionUser | null | undefined): string[] {
  return user?.permissions ?? [];
}

function checkSinglePermission(permission: string, userPermissions: string[]): boolean {
  const code = permission.trim();
  if (!code) {
    return false;
  }
  if (code.startsWith('READ_') && userPermissions.includes('ALL_FUNCTIONS_READ')) {
    return true;
  }
  return userPermissions.includes(code);
}

/**
 * Returns true if the user is granted the permission(s).
 * - `ALL_FUNCTIONS` grants everything.
 * - `string[]` is OR (any match), same as web-app directive.
 * - `PermissionRule` supports explicit any/all.
 */
export function can(
  user: SessionUser | null | undefined,
  permission: PermissionInput | PermissionRule
): boolean {
  const userPermissions = normalizePermissions(user);

  if (userPermissions.includes('ALL_FUNCTIONS')) {
    return true;
  }

  if (typeof permission === 'object' && !Array.isArray(permission)) {
    if (permission.all?.length) {
      if (!permission.all.every((p) => checkSinglePermission(p, userPermissions))) {
        return false;
      }
    }
    if (permission.any?.length) {
      return permission.any.some((p) => checkSinglePermission(p, userPermissions));
    }
    return true;
  }

  if (typeof permission === 'string') {
    return checkSinglePermission(permission, userPermissions);
  }

  if (Array.isArray(permission)) {
    return permission.some((p) => checkSinglePermission(p, userPermissions));
  }

  return false;
}

/** All listed permissions required. */
export function canAll(user: SessionUser | null | undefined, permissions: string[]): boolean {
  return can(user, { all: permissions });
}

/** True when RBAC should deny (inverse helper for guards). */
export function cannot(
  user: SessionUser | null | undefined,
  permission: PermissionInput | PermissionRule
): boolean {
  return !can(user, permission);
}
