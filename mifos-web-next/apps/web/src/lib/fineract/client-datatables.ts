/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { cache } from 'react';

import type {
  FineractDatatableDefinition,
  FineractDatatableRegistration,
  FineractCommandProcessingResult
} from '@mifos/api-client';
import { FineractHttpError } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  type ClientDatatableRowData,
  asManyToOneRows,
  asSingleRowRecord,
  buildClientDatatablePayload,
  clientLegalFormId,
  datatablePermissionPrefix,
  datatableRowToFormValues,
  filterDatatablesByLegalForm,
  formatDatatableCellValue,
  formatDatatableCellValueForColumn,
  formatDatatableColumnLabel,
  formatDatatableTableTitle,
  getManyToOneRowId,
  isManyToOneClientDatatableTemplate,
  isManyToOneDatatable,
  isManyToOneDatatableColumns,
  manyToOneDisplayColumns,
  normalizeSingleRowDatatableRecord,
  shouldUseSingleRowClientDatatableView,
  singleRowDatatableRowExists
} from '@/lib/fineract/client-datatable-utils';
import { datatableMatchesLegalForm } from '@/lib/fineract/entity-datatable-matching';

export type { ClientDatatableRowData };
export {
  asManyToOneRows,
  asSingleRowRecord,
  buildClientDatatablePayload,
  clientLegalFormId,
  datatablePermissionPrefix,
  datatableRowToFormValues,
  filterDatatablesByLegalForm,
  formatDatatableCellValue,
  formatDatatableCellValueForColumn,
  formatDatatableColumnLabel,
  formatDatatableTableTitle,
  getManyToOneRowId,
  isManyToOneClientDatatableTemplate,
  isManyToOneDatatable,
  isManyToOneDatatableColumns,
  manyToOneDisplayColumns,
  normalizeSingleRowDatatableRecord,
  shouldUseSingleRowClientDatatableView,
  singleRowDatatableRowExists
};

const GENERIC_RESULT_SET = { genericResultSet: 'true' };

export async function listClientDatatables(): Promise<FineractDatatableRegistration[]> {
  const fineract = await createFineractClient();
  return fineract.get<FineractDatatableRegistration[]>('/datatables', { apptable: 'm_client' });
}

export const getDatatableDefinition = cache(
  async (registeredTableName: string): Promise<FineractDatatableDefinition | null> => {
    const fineract = await createFineractClient();
    try {
      return await fineract.get<FineractDatatableDefinition>(`/datatables/${registeredTableName}`);
    } catch {
      return null;
    }
  }
);

export async function getClientDatatableRows(
  clientId: string | number,
  registeredTableName: string
): Promise<ClientDatatableRowData> {
  const fineract = await createFineractClient();
  try {
    const data = await fineract.get<ClientDatatableRowData>(
      `/datatables/${registeredTableName}/${clientId}`
    );
    return data ?? null;
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function clientSingleRowDatatableExists(
  clientId: string | number,
  registeredTableName: string
): Promise<boolean> {
  const data = await getClientDatatableRows(clientId, registeredTableName);
  return singleRowDatatableRowExists(data);
}

export async function createClientDatatableEntry(
  clientId: string | number,
  registeredTableName: string,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`/datatables/${registeredTableName}/${clientId}`, body, GENERIC_RESULT_SET);
}

export async function updateClientDatatableEntry(
  clientId: string | number,
  registeredTableName: string,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(`/datatables/${registeredTableName}/${clientId}`, body, GENERIC_RESULT_SET);
}

export async function updateClientDatatableRow(
  clientId: string | number,
  registeredTableName: string,
  rowId: string | number,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(
    `/datatables/${registeredTableName}/${clientId}/${rowId}`,
    body,
    GENERIC_RESULT_SET
  );
}

export async function deleteClientDatatableEntry(
  clientId: string | number,
  registeredTableName: string
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/datatables/${registeredTableName}/${clientId}`, GENERIC_RESULT_SET);
}

export async function deleteClientDatatableRow(
  clientId: string | number,
  registeredTableName: string,
  rowId: string | number
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(
    `/datatables/${registeredTableName}/${clientId}/${rowId}`,
    GENERIC_RESULT_SET
  );
}

export async function clientDatatableAppliesToLegalForm(
  registeredTableName: string,
  legalFormId: number
): Promise<boolean> {
  const registrations = await listClientDatatables().catch(() => []);
  const registration = registrations.find(
    (entry) => entry.registeredTableName === registeredTableName
  );
  if (!registration) {
    return false;
  }
  return datatableMatchesLegalForm(registration, legalFormId, { allowUniversal: true });
}

export async function listClientSingleRowDatatables(
  legalFormId: number
): Promise<{ registration: FineractDatatableRegistration; definition: FineractDatatableDefinition }[]> {
  const registrations = await listClientDatatables().catch(() => []);
  const filtered = filterDatatablesByLegalForm(registrations, legalFormId);
  const results: {
    registration: FineractDatatableRegistration;
    definition: FineractDatatableDefinition;
  }[] = [];

  for (const registration of filtered) {
    const definition = await getDatatableDefinition(registration.registeredTableName);
    if (!definition || isManyToOneDatatable(definition)) {
      continue;
    }
    results.push({ registration, definition });
  }

  return results.sort((a, b) =>
    a.registration.registeredTableName.localeCompare(b.registration.registeredTableName)
  );
}

export async function listClientManyToOneDatatables(
  legalFormId: number
): Promise<{ registration: FineractDatatableRegistration; definition: FineractDatatableDefinition }[]> {
  const registrations = await listClientDatatables().catch(() => []);
  const filtered = filterDatatablesByLegalForm(registrations, legalFormId);
  const results: {
    registration: FineractDatatableRegistration;
    definition: FineractDatatableDefinition;
  }[] = [];

  for (const registration of filtered) {
    const definition = await getDatatableDefinition(registration.registeredTableName);
    if (!definition || !isManyToOneDatatable(definition)) {
      continue;
    }
    results.push({ registration, definition });
  }

  return results.sort((a, b) =>
    a.registration.registeredTableName.localeCompare(b.registration.registeredTableName)
  );
}

/** All client datatables (single-row and many-to-one) for nav and detail routes. */
export async function listClientNavDatatables(
  legalFormId: number
): Promise<{ registration: FineractDatatableRegistration; definition: FineractDatatableDefinition }[]> {
  const registrations = await listClientDatatables().catch(() => []);
  const filtered = filterDatatablesByLegalForm(registrations, legalFormId);
  const results: {
    registration: FineractDatatableRegistration;
    definition: FineractDatatableDefinition;
  }[] = [];

  for (const registration of filtered) {
    const definition = await getDatatableDefinition(registration.registeredTableName);
    if (!definition) {
      continue;
    }
    results.push({ registration, definition });
  }

  return results.sort((a, b) =>
    a.registration.registeredTableName.localeCompare(b.registration.registeredTableName)
  );
}
