import { buildNavManifest } from '@mifos/routes/server';
import type { PermissionInput, PermissionRule, SessionUser } from './types';
import { can } from './can';
import type { PermissionKey } from './permissions-map';
import { resolvePermission } from './permissions-map';

export interface NavItem {
  id: string;
  href: string;
  label: string;
  permissionKey?: PermissionKey;
  permission?: PermissionInput;
}

/** Derived from @mifos/routes APP_ROUTES — do not edit manually. */
export const NAV_MANIFEST: NavItem[] = buildNavManifest().map((item) => ({
  ...item,
  permissionKey: item.permissionKey as PermissionKey | undefined
}));

export function getNavPermission(item: NavItem): PermissionInput | PermissionRule | undefined {
  if (item.permissionKey) {
    return resolvePermission(item.permissionKey);
  }
  return item.permission;
}

export function filterNavForUser(user: SessionUser | null | undefined): NavItem[] {
  return NAV_MANIFEST.filter((item) => {
    const required = getNavPermission(item);
    if (!required) {
      return true;
    }
    return can(user, required);
  });
}
