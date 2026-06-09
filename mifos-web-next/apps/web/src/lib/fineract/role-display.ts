/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';

export const SUPER_USER_ROLE_NAME = 'Super user';

export function isSuperUserRole(name: string): boolean {
  return name.trim() === SUPER_USER_ROLE_NAME;
}

export function formatRoleGroupingName(grouping: string): string {
  if (!grouping) {
    return grouping;
  }

  let value = grouping;
  if (value.startsWith('portfolio_')) {
    value = value.slice('portfolio_'.length);
  }
  if (value.startsWith('transaction_')) {
    const parts = value.split('_');
    if (parts.length >= 2) {
      value = `${parts[1]} ${parts[0]}s`;
    }
  }

  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatPermissionCode(code: string, grouping?: string): string {
  const normalized = code.trim();
  if (!normalized) {
    return normalized;
  }

  let working = normalized;
  if (grouping === 'report' && working.startsWith('READ_')) {
    working = `VIEW_${working.slice('READ_'.length)}`;
  }

  const underscoreIndex = working.indexOf('_');
  if (underscoreIndex === -1) {
    return titleCase(working);
  }

  const action = working.slice(0, underscoreIndex);
  const entity = working.slice(underscoreIndex + 1);
  return `${titleCase(action)} ${titleCase(entity.replaceAll('_', ' '))}`;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function groupRolePermissions(
  permissions: FineractRolePermissionUsage[]
): Record<string, FineractRolePermissionUsage[]> {
  const grouped: Record<string, FineractRolePermissionUsage[]> = {};
  for (const permission of permissions) {
    if (!grouped[permission.grouping]) {
      grouped[permission.grouping] = [];
    }
    grouped[permission.grouping].push(permission);
  }
  return grouped;
}

export function permissionsToPayload(
  permissions: FineractRolePermissionUsage[]
): Record<string, boolean> {
  return Object.fromEntries(permissions.map((permission) => [permission.code, permission.selected]));
}

export function filterPermissionsByQuery(
  permissions: FineractRolePermissionUsage[],
  query: string,
  grouping?: string
): FineractRolePermissionUsage[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return permissions;
  }

  return permissions.filter((permission) => permissionMatchesQuery(permission, trimmed, grouping));
}

function permissionMatchesQuery(
  permission: FineractRolePermissionUsage,
  trimmed: string,
  grouping?: string
): boolean {
  const readable = formatPermissionCode(permission.code, grouping ?? permission.grouping).toLowerCase();
  const groupingLabel = formatRoleGroupingName(permission.grouping).toLowerCase();

  return (
    permission.code.toLowerCase().includes(trimmed) ||
    readable.includes(trimmed) ||
    permission.grouping.toLowerCase().includes(trimmed) ||
    groupingLabel.includes(trimmed) ||
    (permission.entityName?.toLowerCase().includes(trimmed) ?? false) ||
    (permission.actionName?.toLowerCase().includes(trimmed) ?? false)
  );
}

export function filterAndGroupRolePermissions(
  permissions: FineractRolePermissionUsage[],
  query: string
): Array<{ grouping: string; permissions: FineractRolePermissionUsage[] }> {
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? permissions.filter((permission) => permissionMatchesQuery(permission, trimmed))
    : permissions;

  const grouped = groupRolePermissions(filtered);

  return sortRoleGroupings(Object.keys(grouped)).map((grouping) => ({
    grouping,
    permissions: grouped[grouping] ?? []
  }));
}

export function sortRoleGroupings(groupings: string[]): string[] {
  return [...groupings].sort((left, right) =>
    formatRoleGroupingName(left).localeCompare(formatRoleGroupingName(right))
  );
}

export function countSelectedPermissions(permissions: FineractRolePermissionUsage[]): number {
  return permissions.filter((permission) => permission.selected).length;
}

export function countPermissionsByGrouping(
  permissions: FineractRolePermissionUsage[],
  query: string
): Record<string, number> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return {};
  }

  const counts: Record<string, number> = {};
  for (const permission of permissions) {
    if (permissionMatchesQuery(permission, trimmed)) {
      counts[permission.grouping] = (counts[permission.grouping] ?? 0) + 1;
    }
  }
  return counts;
}
