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
  validateCreateCode,
  validateUpdateCode,
  validateUpsertCodeValue,
  type CreateCodeInput,
  type UpdateCodeInput,
  type UpsertCodeValueInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createCode,
  createCodeValue,
  deleteCode,
  deleteCodeValue,
  updateCode,
  updateCodeValue
} from '@/lib/fineract/system-codes';
import { getServerSession } from '@/lib/session/server';

export type SystemCodeActionResult =
  | { ok: true; resourceId?: number; subResourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const LIST_PATH = '/system/codes';

function codePath(codeId: string | number) {
  return `${LIST_PATH}/${codeId}`;
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

function revalidateCodeViews(codeId: string | number) {
  revalidatePath(LIST_PATH);
  revalidatePath(codePath(codeId));
  revalidatePath(`${codePath(codeId)}/edit`);
}

export async function createCodeAction(input: CreateCodeInput): Promise<SystemCodeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_CODE');
  } catch {
    return { ok: false, message: 'You do not have permission to create codes.' };
  }

  const parsed = validateCreateCode(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createCode(parsed.data);
    const resourceId = response.resourceId;
    revalidatePath(LIST_PATH);
    return actionSuccessFromFineractCommand(response, { resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create code.');
  }
}

export async function updateCodeAction(
  codeId: string | number,
  input: UpdateCodeInput
): Promise<SystemCodeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CODE');
  } catch {
    return { ok: false, message: 'You do not have permission to update codes.' };
  }

  const parsed = validateUpdateCode(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateCode(codeId, parsed.data);
    revalidateCodeViews(codeId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId ?? Number(codeId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update code.');
  }
}

export async function deleteCodeAction(codeId: string | number): Promise<SystemCodeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_CODEVALUE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete codes.' };
  }

  try {
    const response = await deleteCode(codeId);
    revalidatePath(LIST_PATH);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete code.');
  }
}

export async function createCodeValueAction(
  codeId: string | number,
  input: UpsertCodeValueInput
): Promise<SystemCodeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_CODEVALUE');
  } catch {
    return { ok: false, message: 'You do not have permission to add code values.' };
  }

  const parsed = validateUpsertCodeValue(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createCodeValue(codeId, parsed.data);
    revalidateCodeViews(codeId);
    return {
      ok: true,
      subResourceId: response.subResourceId ?? response.resourceId
    };
  } catch (error) {
    return toFineractActionError(error, 'Failed to add code value.');
  }
}

export async function updateCodeValueAction(
  codeId: string | number,
  codeValueId: string | number,
  input: UpsertCodeValueInput
): Promise<SystemCodeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CODEVALUE');
  } catch {
    return { ok: false, message: 'You do not have permission to update code values.' };
  }

  const parsed = validateUpsertCodeValue(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateCodeValue(codeId, codeValueId, parsed.data);
    revalidateCodeViews(codeId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to update code value.');
  }
}

export async function deleteCodeValueAction(
  codeId: string | number,
  codeValueId: string | number
): Promise<SystemCodeActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_CODEVALUE');
  } catch {
    return { ok: false, message: 'You do not have permission to delete code values.' };
  }

  try {
    const response = await deleteCodeValue(codeId, codeValueId);
    revalidateCodeViews(codeId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete code value.');
  }
}
