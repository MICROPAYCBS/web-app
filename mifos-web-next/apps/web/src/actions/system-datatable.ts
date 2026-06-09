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
  validateCreateSystemDatatable,
  validateUpdateSystemDatatable,
  type CreateSystemDatatableInput,
  type UpdateSystemDatatableInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createSystemDatatable,
  deleteSystemDatatable,
  updateSystemDatatable
} from '@/lib/fineract/system-datatables';
import { isSystemColumn } from '@/lib/fineract/datatables';
import { sanitizeUpdatePayload } from '@/lib/fineract/system-datatable-form';
import { getServerSession } from '@/lib/session/server';

export type SystemDatatableActionResult =
  | { ok: true; registeredTableName?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function listPath() {
  return '/system/data-tables';
}

function detailPath(registeredTableName: string) {
  return `/system/data-tables/${encodeURIComponent(registeredTableName)}`;
}

function editPath(registeredTableName: string) {
  return `/system/data-tables/${encodeURIComponent(registeredTableName)}/edit`;
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

export async function createSystemDatatableAction(
  input: CreateSystemDatatableInput
): Promise<SystemDatatableActionResult> {
  const session = await getServerSession();
  assertCan(session, 'CREATE_DATATABLE');

  const parsed = validateCreateSystemDatatable(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const payload = {
      ...parsed.data,
      columns: parsed.data.columns.filter((column) => !isSystemColumn(column.name))
    };
    const response = await createSystemDatatable(payload);
    const registeredTableName =
      response.resourceIdentifier ?? parsed.data.datatableName;
    revalidatePath(listPath());
    revalidatePath(detailPath(registeredTableName));
    return { ok: true, registeredTableName };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create data table.');
  }
}

export async function updateSystemDatatableAction(
  registeredTableName: string,
  input: UpdateSystemDatatableInput
): Promise<SystemDatatableActionResult> {
  const session = await getServerSession();
  assertCan(session, 'UPDATE_DATATABLE');

  const parsed = validateUpdateSystemDatatable(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateSystemDatatable(registeredTableName, sanitizeUpdatePayload(parsed.data));
    revalidatePath(listPath());
    revalidatePath(detailPath(registeredTableName));
    revalidatePath(editPath(registeredTableName));
    return { ok: true, registeredTableName };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update data table.');
  }
}

export async function deleteSystemDatatableAction(
  registeredTableName: string
): Promise<SystemDatatableActionResult> {
  const session = await getServerSession();
  assertCan(session, 'DELETE_DATATABLE');

  try {
    await deleteSystemDatatable(registeredTableName);
    revalidatePath(listPath());
    revalidatePath(detailPath(registeredTableName));
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete data table.');
  }
}
