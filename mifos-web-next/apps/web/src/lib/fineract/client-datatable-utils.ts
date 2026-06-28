/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientDatatableTemplate,
  FineractDatatableColumnHeader,
  FineractDatatableDefinition,
  FineractDatatableRegistration
} from '@mifos/api-client';
import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import {
  buildDatatableDataPayload,
  filterSystemColumns,
  formatDatatableCellValue,
  formatDatatableCellValueForColumn,
  getDatatableCellRawValue,
  getDatatableControlName
} from '@/lib/fineract/datatables';
import { datatableMatchesLegalForm } from '@/lib/fineract/entity-datatable-matching';

export type ClientDatatableRowData =
  | Record<string, unknown>[]
  | Record<string, unknown>
  | null;

export function clientLegalFormId(client: {
  legalForm?: { id?: number };
  fullname?: string;
  firstname?: string;
}): number {
  if (client.legalForm?.id != null) {
    return client.legalForm.id;
  }
  if (client.fullname?.trim() && !client.firstname?.trim()) {
    return LEGAL_FORM_ENTITY;
  }
  return LEGAL_FORM_PERSON;
}

export function filterDatatablesByLegalForm(
  registrations: FineractDatatableRegistration[],
  legalFormId: number
): FineractDatatableRegistration[] {
  return registrations.filter((registration) =>
    datatableMatchesLegalForm(registration, legalFormId, { allowUniversal: true })
  );
}

/** Multi-row datatables expose an auto-generated numeric `id` column first. */
export function isManyToOneDatatableColumns(
  columns: FineractDatatableColumnHeader[] | undefined
): boolean {
  const first = columns?.[0];
  return first?.columnName === 'id' && first.columnDisplayType === 'INTEGER';
}

export function isManyToOneDatatable(definition: FineractDatatableDefinition): boolean {
  return isManyToOneDatatableColumns(definition.columnHeaderData);
}

export function isManyToOneClientDatatableTemplate(
  datatable: FineractClientDatatableTemplate
): boolean {
  return isManyToOneDatatableColumns(datatable.columnHeaderData);
}

export function datatableRowKindLabel(multiRow: boolean): string {
  return multiRow ? 'Multi-row' : 'Single row';
}

/** Fineract returns an array for multi-row client datatables. */
export function asManyToOneRows(data: ClientDatatableRowData): Record<string, unknown>[] {
  if (!data) {
    return [];
  }
  return Array.isArray(data) ? data : [data];
}

const CLIENT_ENTITY_ID_KEYS = ['client_id'] as const;

function isClientEntityLinkKey(key: string): boolean {
  return CLIENT_ENTITY_ID_KEYS.includes(key as (typeof CLIENT_ENTITY_ID_KEYS)[number]);
}

/** Normalize Fineract GET responses for one-to-one (single-row) client datatables. */
export function normalizeSingleRowDatatableRecord(
  data: ClientDatatableRowData
): Record<string, unknown> | null {
  if (data == null) {
    return null;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return null;
    }
    return data[0] ?? null;
  }

  if (typeof data === 'object' && Object.keys(data).length === 0) {
    return null;
  }

  return data;
}

/** @deprecated Prefer {@link normalizeSingleRowDatatableRecord}. */
export function asSingleRowRecord(data: ClientDatatableRowData): Record<string, unknown> | null {
  return normalizeSingleRowDatatableRecord(data);
}

/**
 * True when Fineract already has a row for this customer (PK is typically `client_id`).
 * Do not infer from custom field values — an empty row still blocks POST.
 */
export function singleRowDatatableRowExists(data: ClientDatatableRowData): boolean {
  const row = normalizeSingleRowDatatableRecord(data);
  if (!row) {
    return false;
  }

  if (CLIENT_ENTITY_ID_KEYS.some((key) => row[key] != null && row[key] !== '')) {
    return true;
  }

  return Object.entries(row).some(
    ([key, value]) => !isClientEntityLinkKey(key) && value != null && value !== ''
  );
}

/** Prefer single-row UI when fetched data is keyed by client_id without a multi-row id. */
export function shouldUseSingleRowClientDatatableView(
  definition: FineractDatatableDefinition,
  data: ClientDatatableRowData
): boolean {
  if (!isManyToOneDatatable(definition)) {
    return true;
  }

  const row = normalizeSingleRowDatatableRecord(data);
  return row != null && row.client_id != null && getManyToOneRowId(row) == null;
}

export function datatablePermissionPrefix(
  registeredTableName: string,
  action: 'READ' | 'CREATE' | 'DELETE'
) {
  return `${action}_${registeredTableName}`;
}

export function datatableRowToFormValues(
  columns: FineractDatatableColumnHeader[],
  row: Record<string, unknown>
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const column of filterSystemColumns(columns)) {
    const controlName = getDatatableControlName(column);
    const raw = row[column.columnName] ?? row[controlName];
    if (column.columnDisplayType === 'CODELOOKUP' && raw != null && typeof raw === 'object') {
      const lookup = raw as { id?: number; value?: string };
      values[controlName] = lookup.id ?? lookup.value;
    } else {
      values[controlName] = raw;
    }
  }
  return values;
}

export function buildClientDatatablePayload(
  columns: FineractDatatableColumnHeader[],
  values: Record<string, unknown>
): Record<string, unknown> {
  return buildDatatableDataPayload(columns, values, FINERACT_DATE_FORMAT, FINERACT_LOCALE);
}

export function formatDatatableColumnLabel(columnName: string): string {
  return columnName
    .replace(/_/g, ' ')
    .replace(/cd/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export { formatDatatableCellValue, formatDatatableCellValueForColumn, getDatatableCellRawValue };

export function formatDatatableTableTitle(registeredTableName: string): string {
  return formatDatatableColumnLabel(registeredTableName.replace(/_/g, ' '));
}

export function getManyToOneRowId(row: Record<string, unknown>): number | null {
  const id = row.id;
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id;
  }
  if (typeof id === 'string' && id.trim()) {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function manyToOneDisplayColumns(
  columns: FineractDatatableColumnHeader[]
): FineractDatatableColumnHeader[] {
  return filterSystemColumns(columns);
}
