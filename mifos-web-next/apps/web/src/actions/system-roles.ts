'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateCreateRole,
  validateUpdateRole,
  validateUpdateRolePermissions,
  type CreateRoleInput,
  type UpdateRoleInput,
  type UpdateRolePermissionsInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createRole,
  deleteRole,
  disableRole,
  enableRole,
  updateRole,
  updateRolePermissions
} from '@/lib/fineract/system-roles';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/roles-and-permissions';

export type SystemRolesActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function rolePath(roleId: number | string) {
  return `${LIST_PATH}/${roleId}`;
}

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateRoleViews(roleId?: number) {
  revalidatePath(LIST_PATH);
  if (roleId != null) {
    revalidatePath(rolePath(roleId));
    revalidatePath(`${rolePath(roleId)}/edit`);
  }
}

export async function createRoleAction(input: CreateRoleInput): Promise<SystemRolesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_ROLE');
  } catch {
    return { ok: false, message: 'You do not have permission to create roles.' };
  }

  const parsed = validateCreateRole(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createRole(parsed.data);
    revalidateRoleViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create role.');
  }
}

export async function updateRoleAction(
  roleId: number,
  input: UpdateRoleInput
): Promise<SystemRolesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_ROLE');
  } catch {
    return { ok: false, message: 'You do not have permission to update roles.' };
  }

  if (!Number.isFinite(roleId)) {
    return { ok: false, message: 'Invalid role id.' };
  }

  const parsed = validateUpdateRole(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateRole(roleId, parsed.data);
    revalidateRoleViews(roleId);
    return { ok: true, resourceId: roleId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update role.');
  }
}

export async function updateRolePermissionsAction(
  roleId: number,
  input: UpdateRolePermissionsInput
): Promise<SystemRolesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_ROLE');
  } catch {
    return { ok: false, message: 'You do not have permission to update role permissions.' };
  }

  if (!Number.isFinite(roleId)) {
    return { ok: false, message: 'Invalid role id.' };
  }

  const parsed = validateUpdateRolePermissions(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid permissions payload.'
    };
  }

  try {
    await updateRolePermissions(roleId, parsed.data);
    revalidateRoleViews(roleId);
    return { ok: true, resourceId: roleId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update role permissions.');
  }
}

export async function deleteRoleAction(roleId: number): Promise<SystemRolesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_ROLE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete roles.' };
  }

  if (!Number.isFinite(roleId)) {
    return { ok: false, message: 'Invalid role id.' };
  }

  try {
    await deleteRole(roleId);
    revalidateRoleViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete role.');
  }
}

export async function enableRoleAction(roleId: number): Promise<SystemRolesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_ROLE');
  } catch {
    return { ok: false, message: 'You do not have permission to enable roles.' };
  }

  if (!Number.isFinite(roleId)) {
    return { ok: false, message: 'Invalid role id.' };
  }

  try {
    await enableRole(roleId);
    revalidateRoleViews(roleId);
    return { ok: true, resourceId: roleId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to enable role.');
  }
}

export async function disableRoleAction(roleId: number): Promise<SystemRolesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_ROLE');
  } catch {
    return { ok: false, message: 'You do not have permission to disable roles.' };
  }

  if (!Number.isFinite(roleId)) {
    return { ok: false, message: 'Invalid role id.' };
  }

  try {
    await disableRole(roleId);
    revalidateRoleViews(roleId);
    return { ok: true, resourceId: roleId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to disable role.');
  }
}
