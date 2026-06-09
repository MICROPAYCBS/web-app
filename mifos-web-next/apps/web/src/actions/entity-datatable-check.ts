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
  validateCreateEntityDatatableCheck,
  type CreateEntityDatatableCheckInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createEntityDatatableCheck,
  deleteEntityDatatableCheck
} from '@/lib/fineract/entity-datatable-checks';
import { getServerSession } from '@/lib/session/server';

export type EntityDatatableCheckActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const LIST_PATH = '/organization/entity-data-table-checks';

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

export async function createEntityDatatableCheckAction(
  input: CreateEntityDatatableCheckInput
): Promise<EntityDatatableCheckActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_ENTITY_DATATABLE_CHECK');
  } catch {
    return { ok: false, message: 'You do not have permission to create entity data table checks.' };
  }

  const parsed = validateCreateEntityDatatableCheck(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createEntityDatatableCheck(parsed.data);
    revalidatePath(LIST_PATH);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create entity data table check.');
  }
}

export async function deleteEntityDatatableCheckAction(
  id: number | string
): Promise<EntityDatatableCheckActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_ENTITY_DATATABLE_CHECK');
  } catch {
    return { ok: false, message: 'You do not have permission to delete entity data table checks.' };
  }

  try {
    await deleteEntityDatatableCheck(id);
    revalidatePath(LIST_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete entity data table check.');
  }
}
