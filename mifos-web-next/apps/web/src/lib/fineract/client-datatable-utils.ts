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

/** Multi-row datatables expose an auto-generated `id` column first. */
export function isManyToOneDatatableColumns(
  columns: FineractDatatableColumnHeader[] | undefined
): boolean {
  return columns?.[0]?.columnName === 'id';
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

export function asSingleRowRecord(data: ClientDatatableRowData): Record<string, unknown> | null {
  if (!data || Array.isArray(data)) {
    return null;
  }
  return data;
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

export function formatDatatableCellValue(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (typeof value === 'object') {
    const obj = value as { value?: string; name?: string };
    return obj.value ?? obj.name ?? '—';
  }
  return String(value);
}

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

export function formatDatatableCellValueForColumn(
  column: FineractDatatableColumnHeader,
  value: unknown
): string {
  if (value == null || value === '') {
    return '—';
  }
  if (column.columnDisplayType === 'CODELOOKUP' && column.columnValues?.length) {
    const lookupId =
      typeof value === 'object' && value != null && 'id' in value
        ? Number((value as { id?: number }).id)
        : Number(value);
    if (Number.isFinite(lookupId)) {
      const match = column.columnValues.find((option) => option.id === lookupId);
      if (match) {
        return match.value;
      }
    }
  }
  return formatDatatableCellValue(value);
}
