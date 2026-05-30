import type { PermissionInput, PermissionRule, SessionUser } from './types';
import { can } from './can';
import type { PermissionKey } from './permissions-map';
import { resolvePermission } from './permissions-map';

export interface NavItem {
  id: string;
  href: string;
  label: string;
  /** Semantic key into permissions.manifest.json */
  permissionKey?: PermissionKey;
  /** Raw Fineract permission(s) — used when no semantic key */
  permission?: PermissionInput;
}

/** Primary sidebar entries — extend as domains are built. */
export const NAV_MANIFEST: NavItem[] = [
  { id: 'dashboard', href: '/', label: 'Dashboard' },
  { id: 'clients', href: '/clients', label: 'Clients', permissionKey: 'clients.list' },
  {
    id: 'checker',
    href: '/checker-inbox-and-tasks',
    label: 'Checker inbox',
    permissionKey: 'checkerInbox'
  }
];

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
