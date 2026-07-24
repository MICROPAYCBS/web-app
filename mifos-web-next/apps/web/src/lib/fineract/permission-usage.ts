/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage } from '@mifos/api-client';

/**
 * Normalize a Fineract permission usage row.
 * Trims code/entity/action — seed data historically stored trailing spaces on some codes
 * (e.g. CREATE_STANDINGINSTRUCTION ).
 */
export function normalizePermissionUsage(raw: unknown): FineractRolePermissionUsage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const grouping = typeof row.grouping === 'string' ? row.grouping.trim() : '';
  const code = typeof row.code === 'string' ? row.code.trim() : '';
  if (!grouping || !code) {
    return null;
  }

  const entityName =
    typeof row.entityName === 'string' ? row.entityName.trim() || undefined : undefined;
  const actionName =
    typeof row.actionName === 'string' ? row.actionName.trim() || undefined : undefined;

  return {
    grouping,
    code,
    selected: row.selected === true || row.makerChecker === true,
    entityName,
    actionName
  };
}

/**
 * Collapse rows that only differed by leading/trailing whitespace on `code`.
 * If either side had maker-checker enabled, the kept row stays enabled.
 */
export function dedupePermissionUsageByCode(
  permissions: FineractRolePermissionUsage[]
): FineractRolePermissionUsage[] {
  const byCode = new Map<string, FineractRolePermissionUsage>();

  for (const permission of permissions) {
    const existing = byCode.get(permission.code);
    if (!existing) {
      byCode.set(permission.code, permission);
      continue;
    }
    byCode.set(permission.code, {
      ...existing,
      selected: existing.selected || permission.selected,
      entityName: existing.entityName || permission.entityName,
      actionName: existing.actionName || permission.actionName
    });
  }

  return [...byCode.values()];
}
