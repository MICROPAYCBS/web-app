import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractRolePermissionUsage, FineractCommandProcessingResult } from '@mifos/api-client';
import type { UpdateMakerCheckerPermissionsInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const PERMISSIONS_PATH = '/permissions';

function normalizePermissionUsage(raw: unknown): FineractRolePermissionUsage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const grouping = typeof row.grouping === 'string' ? row.grouping : '';
  const code = typeof row.code === 'string' ? row.code : '';
  if (!grouping || !code) {
    return null;
  }

  return {
    grouping,
    code,
    selected: row.selected === true || row.makerChecker === true,
    entityName: typeof row.entityName === 'string' ? row.entityName : undefined,
    actionName: typeof row.actionName === 'string' ? row.actionName : undefined
  };
}

function normalizeMakerCheckerPermissionList(raw: unknown): FineractRolePermissionUsage[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown[] }).pageItems)
      ? (raw as { pageItems: unknown[] }).pageItems
      : raw &&
          typeof raw === 'object' &&
          Array.isArray((raw as { permissionUsageData?: unknown[] }).permissionUsageData)
        ? (raw as { permissionUsageData: unknown[] }).permissionUsageData
        : raw &&
            typeof raw === 'object' &&
            Array.isArray((raw as { permissions?: unknown[] }).permissions)
          ? (raw as { permissions: unknown[] }).permissions
          : [];

  return rows
    .map((item) => normalizePermissionUsage(item))
    .filter((item): item is FineractRolePermissionUsage => item !== null);
}

export async function listMakerCheckerPermissions(): Promise<FineractRolePermissionUsage[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(PERMISSIONS_PATH, {
    makerCheckerable: 'true'
  });
  return normalizeMakerCheckerPermissionList(raw);
}

export async function updateMakerCheckerPermissions(
  input: UpdateMakerCheckerPermissionsInput
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(PERMISSIONS_PATH, input, {
    makerCheckerable: 'true'
  });
}
