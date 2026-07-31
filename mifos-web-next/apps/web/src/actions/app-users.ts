'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { EntityMappingOption } from '@mifos/api-client';
import {
  toFineractActionError,
  validateChangeUserPassword,
  validateCreateUser,
  validateUpdateUser,
  type ChangeUserPasswordInput,
  type CreateUserInput,
  type UpdateUserInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  changeUserPassword,
  createUser,
  deleteUser,
  listStaffByOffice,
  resetUserTotp,
  updateUser
} from '@/lib/fineract/app-users';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/appusers';

export type AppUsersActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function userPath(userId: number | string) {
  return `${LIST_PATH}/${userId}`;
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

function revalidateUserViews(userId?: number) {
  revalidatePath(LIST_PATH);
  if (userId != null) {
    revalidatePath(userPath(userId));
    revalidatePath(`${userPath(userId)}/edit`);
  }
}

export async function fetchStaffByOfficeAction(
  officeId: number
): Promise<{ ok: true; data: EntityMappingOption[] } | { ok: false; message: string }> {
  const session = await getServerSession();
  try {
    assertCan(session, 'READ_USER');
  } catch {
    return { ok: false, message: 'You do not have permission to view staff.' };
  }

  if (!Number.isFinite(officeId)) {
    return { ok: false, message: 'Invalid branch id.' };
  }

  try {
    const data = await listStaffByOffice(officeId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load staff for the selected branch.');
  }
}

export async function createUserAction(input: CreateUserInput): Promise<AppUsersActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_USER');
  } catch {
    return { ok: false, message: 'You do not have permission to create users.' };
  }

  const parsed = validateCreateUser(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createUser(parsed.data);
    revalidateUserViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create user.');
  }
}

export async function updateUserAction(
  userId: number,
  input: UpdateUserInput
): Promise<AppUsersActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_USER');
  } catch {
    return { ok: false, message: 'You do not have permission to update users.' };
  }

  if (!Number.isFinite(userId)) {
    return { ok: false, message: 'Invalid user id.' };
  }

  const parsed = validateUpdateUser(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateUser(userId, parsed.data);
    revalidateUserViews(userId);
    return actionSuccessFromFineractCommand(response, { resourceId: userId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update user.');
  }
}

export async function changeUserPasswordAction(
  userId: number,
  input: ChangeUserPasswordInput
): Promise<AppUsersActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_USER');
  } catch {
    return { ok: false, message: 'You do not have permission to change passwords.' };
  }

  if (!Number.isFinite(userId)) {
    return { ok: false, message: 'Invalid user id.' };
  }

  const parsed = validateChangeUserPassword(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await changeUserPassword(userId, parsed.data);
    revalidateUserViews(userId);
    return actionSuccessFromFineractCommand(response, { resourceId: userId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to change password.');
  }
}

export async function deleteUserAction(userId: number): Promise<AppUsersActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_USER');
  } catch {
    return { ok: false, message: 'You do not have permission to delete users.' };
  }

  if (!Number.isFinite(userId)) {
    return { ok: false, message: 'Invalid user id.' };
  }

  try {
    const response = await deleteUser(userId);
    revalidateUserViews();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete user.');
  }
}

export async function resetUserTotpAction(userId: number): Promise<AppUsersActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('administration.users.resetTotp'));
  } catch {
    return { ok: false, message: 'You do not have permission to reset authenticator enrollment.' };
  }

  if (!Number.isFinite(userId)) {
    return { ok: false, message: 'Invalid user id.' };
  }

  try {
    const response = await resetUserTotp(userId);
    revalidateUserViews(userId);
    return actionSuccessFromFineractCommand(response, { resourceId: userId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to reset authenticator.');
  }
}
