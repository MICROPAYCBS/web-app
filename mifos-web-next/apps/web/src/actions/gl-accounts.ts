'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FineractHttpError } from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import {
  applyGlAccountFineractFieldErrors,
  buildUpsertGlAccountValidationContext,
  toFineractActionError,
  validateToggleGlAccountDisabled,
  validateUpsertGlAccountForm,
  type ToggleGlAccountDisabledInput,
  type UpsertGlAccountFormInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createGlAccount,
  deleteGlAccount,
  getGlAccount,
  toggleGlAccountDisabled,
  updateGlAccount
} from '@/lib/fineract/gl-accounts';
import { getStructuredGlCodePolicy } from '@/lib/fineract/gl-account-code-policy';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/chart-of-accounts';

export type GlAccountsActionResult =
  | { ok: true; resourceId?: number; disabled?: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function glAccountPath(glAccountId: number | string) {
  return `${LIST_PATH}/${glAccountId}`;
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

function revalidateGlAccountViews(glAccountId?: number) {
  revalidatePath(LIST_PATH);
  if (glAccountId != null) {
    revalidatePath(glAccountPath(glAccountId));
    revalidatePath(`${glAccountPath(glAccountId)}/edit`);
  }
}

async function buildGlAccountValidationContext(
  input: UpsertGlAccountFormInput,
  glAccountId?: number
) {
  const structuredGlCodePolicy = await getStructuredGlCodePolicy();
  let parentGlCode: string | undefined;
  let parentTypeId: number | undefined;
  if (input.parentId) {
    const parent = await getGlAccount(input.parentId);
    parentGlCode = parent?.glCode;
    parentTypeId = parent?.type?.id;
  }

  let originalSnapshot;
  if (glAccountId != null) {
    const existing = await getGlAccount(glAccountId);
    if (existing) {
      originalSnapshot = {
        glCode: existing.glCode,
        type: existing.type.id,
        parentId: existing.parentId
      };
    }
  }

  return buildUpsertGlAccountValidationContext(structuredGlCodePolicy, {
    parentGlCode,
    parentTypeId,
    original: originalSnapshot
  });
}

function mapGlAccountActionError(err: unknown, fallback: string) {
  const result = toFineractActionError(err, fallback);
  if (err instanceof FineractHttpError) {
    return applyGlAccountFineractFieldErrors(result, err.body, err.status);
  }
  return result;
}

export async function createGlAccountAction(
  input: UpsertGlAccountFormInput
): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to create GL accounts.' };
  }

  const parsed = validateUpsertGlAccountForm(input, await buildGlAccountValidationContext(input));
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createGlAccount(parsed.data);
    revalidateGlAccountViews(response.resourceId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return mapGlAccountActionError(error, 'Failed to create GL account.');
  }
}

export async function updateGlAccountAction(
  glAccountId: number,
  input: UpsertGlAccountFormInput
): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to update GL accounts.' };
  }

  if (!Number.isFinite(glAccountId)) {
    return { ok: false, message: 'Invalid GL account id.' };
  }

  const parsed = validateUpsertGlAccountForm(
    input,
    await buildGlAccountValidationContext(input, glAccountId)
  );
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateGlAccount(glAccountId, parsed.data);
    revalidateGlAccountViews(glAccountId);
    return actionSuccessFromFineractCommand(response, { resourceId: response.resourceId });
  } catch (error) {
    return mapGlAccountActionError(error, 'Failed to update GL account.');
  }
}

export async function toggleGlAccountDisabledAction(
  glAccountId: number,
  input: ToggleGlAccountDisabledInput
): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to update GL accounts.' };
  }

  if (!Number.isFinite(glAccountId)) {
    return { ok: false, message: 'Invalid GL account id.' };
  }

  const parsed = validateToggleGlAccountDisabled(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid request.' };
  }

  try {
    const response = await toggleGlAccountDisabled(glAccountId, parsed.data);
    revalidateGlAccountViews(glAccountId);
    return actionSuccessFromFineractCommand(response, { resourceId: glAccountId, disabled: response.changes.disabled });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update GL account status.');
  }
}

export async function deleteGlAccountAction(glAccountId: number): Promise<GlAccountsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_GLACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete GL accounts.' };
  }

  if (!Number.isFinite(glAccountId)) {
    return { ok: false, message: 'Invalid GL account id.' };
  }

  try {
    const response = await deleteGlAccount(glAccountId);
    revalidateGlAccountViews();
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete GL account.');
  }
}
