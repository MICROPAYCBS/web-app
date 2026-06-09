/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientDatatableTemplate,
  FineractClientTemplate
} from '@mifos/api-client';
import {
  formatDatatableTableTitle,
  isManyToOneClientDatatableTemplate
} from '@/lib/fineract/client-datatable-utils';
import {
  buildDatatableDataPayload,
  filterSystemColumns,
  hasDatatablePayloadData
} from '@/lib/fineract/datatables';
import { datatableMatchesLegalForm } from '@/lib/fineract/entity-datatable-matching';
import type { DatatableFormValues, MultiRowDatatableDraft } from './types';

export function datatablesForLegalForm(
  template: FineractClientTemplate,
  legalFormId: number
): FineractClientDatatableTemplate[] {
  return (
    template.datatables?.filter((datatable) =>
      datatableMatchesLegalForm(datatable, legalFormId, { allowUniversal: true })
    ) ?? []
  );
}

export function singleRowDatatablesForLegalForm(
  template: FineractClientTemplate,
  legalFormId: number
): FineractClientDatatableTemplate[] {
  return datatablesForLegalForm(template, legalFormId).filter(
    (datatable) => !isManyToOneClientDatatableTemplate(datatable)
  );
}

export function multiRowDatatablesForLegalForm(
  template: FineractClientTemplate,
  legalFormId: number
): FineractClientDatatableTemplate[] {
  return datatablesForLegalForm(template, legalFormId).filter((datatable) =>
    isManyToOneClientDatatableTemplate(datatable)
  );
}

export function buildCreateClientDatatablePayloads(
  template: FineractClientTemplate,
  legalFormId: number,
  datatables: DatatableFormValues,
  multiRowDatatables: MultiRowDatatableDraft,
  dateFormat: string,
  locale: string
): { registeredTableName: string; data: Record<string, unknown> }[] {
  const payloads: { registeredTableName: string; data: Record<string, unknown> }[] = [];

  for (const dt of singleRowDatatablesForLegalForm(template, legalFormId)) {
    const columns = filterSystemColumns(dt.columnHeaderData ?? []);
    const values = datatables[dt.registeredTableName] ?? {};
    const data = buildDatatableDataPayload(columns, values, dateFormat, locale);
    if (hasDatatablePayloadData(data)) {
      payloads.push({ registeredTableName: dt.registeredTableName, data });
    }
  }

  for (const dt of multiRowDatatablesForLegalForm(template, legalFormId)) {
    const rows = multiRowDatatables[dt.registeredTableName] ?? [];
    if (rows.length === 0) {
      continue;
    }
    const columns = filterSystemColumns(dt.columnHeaderData ?? []);
    const data = buildDatatableDataPayload(columns, rows[0]!, dateFormat, locale);
    if (hasDatatablePayloadData(data)) {
      payloads.push({ registeredTableName: dt.registeredTableName, data });
    }
  }

  return payloads;
}

export function mandatoryDatatableError(tableName: string): string {
  return `${formatDatatableTableTitle(tableName)} is required before you can create this client. Add at least one complete record on that step.`;
}
