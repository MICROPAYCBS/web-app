'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupClientOption, CenterStaffOption } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import {
  toFineractActionError,
  validateCreateGroup,
  validateUpdateGroup,
  type CreateGroupInput,
  type UpdateGroupInput,
  actionSuccessFromFineractCommand,
  type FineractCommandActionMeta
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  groupCreatePath,
  groupDetailPath,
  groupGeneralPath,
  GROUPS_LIST_PATH
} from '@/lib/fineract/group-paths';
import {
  createGroup,
  defaultGroupMutationMeta,
  getGroupCreateTemplate,
  searchClientsForGroup,
  updateGroup
} from '@/lib/fineract/groups';
import { getServerSession } from '@/lib/session/server';

export type GroupActionResult =
  | ({ ok: true; groupId?: number } & FineractCommandActionMeta)
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type GroupDataResult<T> = { ok: true; data: T } | { ok: false; message: string };

function fieldErrorsFromZod(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function assertGroupsListAccess(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('clients.list'));
}

export async function loadGroupStaffAction(
  officeId: string | number
): Promise<GroupDataResult<CenterStaffOption[]>> {
  const session = await getServerSession();
  try {
    assertGroupsListAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to access groups.' };
  }

  try {
    const template = await getGroupCreateTemplate(officeId);
    return { ok: true, data: template.staffOptions };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load staff for the selected branch.');
  }
}

export async function searchGroupClientsAction(
  officeId: string | number,
  displayName: string
): Promise<GroupDataResult<GroupClientOption[]>> {
  const session = await getServerSession();
  try {
    assertGroupsListAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to access groups.' };
  }

  if (displayName.trim().length < 2) {
    return { ok: true, data: [] };
  }

  try {
    const data = await searchClientsForGroup(officeId, displayName);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to search customers for the selected branch.');
  }
}

export async function createGroupAction(
  input: Omit<CreateGroupInput, 'dateFormat' | 'locale'>
): Promise<GroupActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_GROUP');
  } catch {
    return { ok: false, message: 'You do not have permission to create groups.' };
  }

  const parsed = validateCreateGroup({
    ...defaultGroupMutationMeta(),
    ...input
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid group data.',
      fieldErrors: fieldErrorsFromZod(parsed.error)
    };
  }

  try {
    const response = await createGroup(parsed.data);
    const groupId = response.resourceId;
    revalidatePath(GROUPS_LIST_PATH);
    if (groupId != null) {
      revalidatePath(groupDetailPath(groupId));
    }
    return actionSuccessFromFineractCommand(response, { groupId: groupId ?? undefined });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create group.');
  }
}

export async function updateGroupAction(
  groupId: string | number,
  input: Omit<UpdateGroupInput, 'dateFormat' | 'locale'>
): Promise<GroupActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_GROUP');
  } catch {
    return { ok: false, message: 'You do not have permission to update groups.' };
  }

  const parsed = validateUpdateGroup({
    ...defaultGroupMutationMeta(),
    ...input
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid group data.',
      fieldErrors: fieldErrorsFromZod(parsed.error)
    };
  }

  try {
    const response = await updateGroup(groupId, parsed.data);
    revalidatePath(GROUPS_LIST_PATH);
    revalidatePath(groupDetailPath(groupId));
    revalidatePath(groupGeneralPath(groupId));
    return actionSuccessFromFineractCommand(response, { groupId: Number(groupId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update group.');
  }
}
