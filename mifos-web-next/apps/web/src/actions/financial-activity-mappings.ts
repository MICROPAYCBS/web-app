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
  validateUpsertFinancialActivityMappingForm,
  type UpsertFinancialActivityMappingFormInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createFinancialActivityMapping,
  deleteFinancialActivityMapping,
  updateFinancialActivityMapping
} from '@/lib/fineract/financial-activity-mappings';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/financial-activity-mappings';

export type FinancialActivityMappingsActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function mappingPath(mappingId: number | string) {
  return `${LIST_PATH}/${mappingId}`;
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

function revalidateFinancialActivityMappingViews(mappingId?: number) {
  revalidatePath(LIST_PATH);
  if (mappingId != null) {
    revalidatePath(mappingPath(mappingId));
    revalidatePath(`${mappingPath(mappingId)}/edit`);
  }
}

export async function createFinancialActivityMappingAction(
  input: UpsertFinancialActivityMappingFormInput
): Promise<FinancialActivityMappingsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_FINANCIALACTIVITYACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to create financial activity mappings.' };
  }

  const parsed = validateUpsertFinancialActivityMappingForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createFinancialActivityMapping(parsed.data);
    revalidateFinancialActivityMappingViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create financial activity mapping.');
  }
}

export async function updateFinancialActivityMappingAction(
  mappingId: number,
  input: UpsertFinancialActivityMappingFormInput
): Promise<FinancialActivityMappingsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_FINANCIALACTIVITYACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to update financial activity mappings.' };
  }

  const parsed = validateUpsertFinancialActivityMappingForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateFinancialActivityMapping(mappingId, parsed.data);
    revalidateFinancialActivityMappingViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update financial activity mapping.');
  }
}

export async function deleteFinancialActivityMappingAction(
  mappingId: number
): Promise<FinancialActivityMappingsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_FINANCIALACTIVITYACCOUNT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete financial activity mappings.' };
  }

  try {
    await deleteFinancialActivityMapping(mappingId);
    revalidateFinancialActivityMappingViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete financial activity mapping.');
  }
}
