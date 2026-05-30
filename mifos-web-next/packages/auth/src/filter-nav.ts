import type { NavLinkItem, NavStructure } from '@mifos/routes/server';
import type { SessionUser } from './types';
import { can } from './can';
import type { PermissionKey } from './permissions-map';
import { resolvePermission } from './permissions-map';

function canAccessNavItem(user: SessionUser | null | undefined, item: NavLinkItem): boolean {
  if (!item.permissionKey) {
    return true;
  }
  return can(user, resolvePermission(item.permissionKey as PermissionKey));
}

function filterItems(user: SessionUser | null | undefined, items: NavLinkItem[]): NavLinkItem[] {
  return items.filter((item) => canAccessNavItem(user, item));
}

/** RBAC-filtered navigation tree for sidebar and Quick Find. */
export function filterNavStructure(
  user: SessionUser | null | undefined,
  structure: NavStructure
): NavStructure {
  const featured = filterItems(user, structure.featured);
  const groups = structure.groups
    .map((group) => ({
      ...group,
      items: filterItems(user, group.items)
    }))
    .filter((group) => group.items.length > 0);
  const quickFind = filterItems(user, structure.quickFind);
  return { featured, groups, quickFind };
}
