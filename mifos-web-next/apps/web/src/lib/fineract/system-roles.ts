import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractRoleListItem,
  FineractRoleMutationResponse,
  FineractRolePermissionsDetail,
  FineractRolePermissionUsage
} from '@mifos/api-client';
import type { CreateRoleInput, UpdateRoleInput, UpdateRolePermissionsInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const ROLES_PATH = '/roles';

function normalizeRoleListItem(raw: unknown): FineractRoleListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  const description = typeof row.description === 'string' ? row.description.trim() : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    name,
    description,
    disabled: row.disabled === true
  };
}

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
    selected: row.selected === true,
    entityName: typeof row.entityName === 'string' ? row.entityName : undefined,
    actionName: typeof row.actionName === 'string' ? row.actionName : undefined
  };
}

function normalizeRolePermissionsDetail(raw: unknown): FineractRolePermissionsDetail | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  const description = typeof row.description === 'string' ? row.description.trim() : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }

  const permissionUsageData = Array.isArray(row.permissionUsageData)
    ? row.permissionUsageData
        .map((item) => normalizePermissionUsage(item))
        .filter((item): item is FineractRolePermissionUsage => item !== null)
    : [];

  return {
    id,
    name,
    description,
    disabled: row.disabled === true,
    permissionUsageData
  };
}

function normalizeRoleList(raw: unknown): FineractRoleListItem[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown[] }).pageItems)
      ? (raw as { pageItems: unknown[] }).pageItems
      : [];

  return rows
    .map((item) => normalizeRoleListItem(item))
    .filter((item): item is FineractRoleListItem => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listRoles(): Promise<FineractRoleListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(ROLES_PATH);
  return normalizeRoleList(raw);
}

export async function getRolePermissions(roleId: number): Promise<FineractRolePermissionsDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${ROLES_PATH}/${roleId}/permissions`);
  return normalizeRolePermissionsDetail(raw);
}

export async function createRole(input: CreateRoleInput): Promise<FineractRoleMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractRoleMutationResponse>(ROLES_PATH, input);
}

export async function updateRole(
  roleId: number,
  input: UpdateRoleInput
): Promise<FineractRoleMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractRoleMutationResponse>(`${ROLES_PATH}/${roleId}`, input);
}

export async function updateRolePermissions(
  roleId: number,
  input: UpdateRolePermissionsInput
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(`${ROLES_PATH}/${roleId}/permissions`, input);
}

export async function deleteRole(roleId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${ROLES_PATH}/${roleId}`);
}

export async function enableRole(roleId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${ROLES_PATH}/${roleId}?command=enable`, {});
}

export async function disableRole(roleId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.post(`${ROLES_PATH}/${roleId}?command=disable`, {});
}
