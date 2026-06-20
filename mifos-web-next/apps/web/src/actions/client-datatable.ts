'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import { assertCan } from '@mifos/auth';
import {
  clientDatatableValuesSchema,
  toFineractActionError,
  validateClientDatatableValues,
  type DatatableColumnRule
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  buildClientDatatablePayload,
  clientDatatableAppliesToLegalForm,
  clientLegalFormId,
  createClientDatatableEntry,
  datatablePermissionPrefix,
  deleteClientDatatableEntry,
  deleteClientDatatableRow,
  getDatatableDefinition,
  isManyToOneDatatable,
  updateClientDatatableEntry,
  updateClientDatatableRow
} from '@/lib/fineract/client-datatables';
import { filterSystemColumns, getDatatableControlName, toDatatableDisplayLabel } from '@/lib/fineract/datatables';
import { getClient } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export type ClientDatatableActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function datatablePath(clientId: string, registeredTableName: string) {
  return `/clients/${clientId}/datatables/${registeredTableName}`;
}

function revalidateClientDatatableViews(clientId: string, registeredTableName: string) {
  revalidatePath(datatablePath(clientId, registeredTableName));
}

function toColumnRules(columns: FineractDatatableColumnHeader[]): DatatableColumnRule[] {
  return filterSystemColumns(columns).map((column) => ({
    columnName: column.columnName,
    columnDisplayType: column.columnDisplayType,
    controlName: getDatatableControlName(column),
    label: toDatatableDisplayLabel(column.columnName),
    isColumnNullable: column.isColumnNullable
  }));
}

async function requireDatatablePermission(
  registeredTableName: string,
  action: 'READ' | 'CREATE' | 'DELETE'
): Promise<ClientDatatableActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, datatablePermissionPrefix(registeredTableName, action));
  } catch {
    return { ok: false, message: 'You do not have permission to perform this action.' };
  }
  return null;
}

async function requireClientDatatableAccess(
  clientId: string,
  registeredTableName: string,
  action: 'CREATE' | 'DELETE'
): Promise<ClientDatatableActionResult | null> {
  const denied = await requireDatatablePermission(registeredTableName, action);
  if (denied) {
    return denied;
  }

  const client = await getClient(clientId);
  const applies = await clientDatatableAppliesToLegalForm(
    registeredTableName,
    clientLegalFormId(client)
  );
  if (!applies) {
    return { ok: false, message: 'This data table does not apply to this customer.' };
  }

  return null;
}

async function requireDatatableKind(
  registeredTableName: string,
  expected: 'single-row' | 'multi-row'
): Promise<ClientDatatableActionResult | null> {
  const definition = await getDatatableDefinition(registeredTableName);
  if (!definition) {
    return { ok: false, message: 'Datatable not found.' };
  }

  const multiRow = isManyToOneDatatable(definition);
  if (expected === 'multi-row' && !multiRow) {
    return { ok: false, message: 'This action applies to multi-row data tables only.' };
  }
  if (expected === 'single-row' && multiRow) {
    return { ok: false, message: 'This action applies to single-row data tables only.' };
  }

  return null;
}

export async function saveClientDatatableAction(
  clientId: string,
  registeredTableName: string,
  raw: unknown,
  mode: 'create' | 'update'
): Promise<ClientDatatableActionResult> {
  const denied = await requireClientDatatableAccess(clientId, registeredTableName, 'CREATE');
  if (denied) {
    return denied;
  }

  const kindError = await requireDatatableKind(registeredTableName, 'single-row');
  if (kindError) {
    return kindError;
  }

  const parsedValues = clientDatatableValuesSchema.safeParse(raw);
  if (!parsedValues.success) {
    return { ok: false, message: 'Invalid datatable values.' };
  }

  const definition = await getDatatableDefinition(registeredTableName);
  if (!definition) {
    return { ok: false, message: 'Datatable not found.' };
  }

  const columns = definition.columnHeaderData ?? [];
  const validated = validateClientDatatableValues(toColumnRules(columns), parsedValues.data);
  if (!validated.ok) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: validated.fieldErrors
    };
  }

  const payload = buildClientDatatablePayload(columns, validated.data);

  try {
    if (mode === 'create') {
      await createClientDatatableEntry(clientId, registeredTableName, payload);
    } else {
      await updateClientDatatableEntry(clientId, registeredTableName, payload);
    }
    revalidateClientDatatableViews(clientId, registeredTableName);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function addClientDatatableRowAction(
  clientId: string,
  registeredTableName: string,
  raw: unknown
): Promise<ClientDatatableActionResult> {
  const denied = await requireClientDatatableAccess(clientId, registeredTableName, 'CREATE');
  if (denied) {
    return denied;
  }

  const kindError = await requireDatatableKind(registeredTableName, 'multi-row');
  if (kindError) {
    return kindError;
  }

  const parsedValues = clientDatatableValuesSchema.safeParse(raw);
  if (!parsedValues.success) {
    return { ok: false, message: 'Invalid datatable values.' };
  }

  const definition = await getDatatableDefinition(registeredTableName);
  if (!definition) {
    return { ok: false, message: 'Datatable not found.' };
  }

  const columns = definition.columnHeaderData ?? [];
  const validated = validateClientDatatableValues(toColumnRules(columns), parsedValues.data);
  if (!validated.ok) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: validated.fieldErrors
    };
  }

  const payload = buildClientDatatablePayload(columns, validated.data);

  try {
    await createClientDatatableEntry(clientId, registeredTableName, payload);
    revalidateClientDatatableViews(clientId, registeredTableName);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function updateClientDatatableRowAction(
  clientId: string,
  registeredTableName: string,
  rowId: number,
  raw: unknown
): Promise<ClientDatatableActionResult> {
  const denied = await requireClientDatatableAccess(clientId, registeredTableName, 'CREATE');
  if (denied) {
    return denied;
  }

  const kindError = await requireDatatableKind(registeredTableName, 'multi-row');
  if (kindError) {
    return kindError;
  }

  const parsedValues = clientDatatableValuesSchema.safeParse(raw);
  if (!parsedValues.success) {
    return { ok: false, message: 'Invalid datatable values.' };
  }

  const definition = await getDatatableDefinition(registeredTableName);
  if (!definition) {
    return { ok: false, message: 'Datatable not found.' };
  }

  const columns = definition.columnHeaderData ?? [];
  const validated = validateClientDatatableValues(toColumnRules(columns), parsedValues.data);
  if (!validated.ok) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: validated.fieldErrors
    };
  }

  const payload = buildClientDatatablePayload(columns, validated.data);

  try {
    await updateClientDatatableRow(clientId, registeredTableName, rowId, payload);
    revalidateClientDatatableViews(clientId, registeredTableName);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteClientDatatableRowsAction(
  clientId: string,
  registeredTableName: string,
  rowIds: number[]
): Promise<ClientDatatableActionResult> {
  const denied = await requireClientDatatableAccess(clientId, registeredTableName, 'DELETE');
  if (denied) {
    return denied;
  }

  const kindError = await requireDatatableKind(registeredTableName, 'multi-row');
  if (kindError) {
    return kindError;
  }

  if (rowIds.length === 0) {
    return { ok: false, message: 'Select at least one row to delete.' };
  }

  try {
    for (const rowId of rowIds) {
      await deleteClientDatatableRow(clientId, registeredTableName, rowId);
    }
    revalidateClientDatatableViews(clientId, registeredTableName);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteClientDatatableAction(
  clientId: string,
  registeredTableName: string
): Promise<ClientDatatableActionResult> {
  const denied = await requireClientDatatableAccess(clientId, registeredTableName, 'DELETE');
  if (denied) {
    return denied;
  }

  const kindError = await requireDatatableKind(registeredTableName, 'single-row');
  if (kindError) {
    return kindError;
  }

  try {
    await deleteClientDatatableEntry(clientId, registeredTableName);
    revalidateClientDatatableViews(clientId, registeredTableName);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}
