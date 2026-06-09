/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const clientDatatableValuesSchema = z.record(z.unknown());

export type ClientDatatableValuesInput = z.infer<typeof clientDatatableValuesSchema>;

export interface DatatableColumnRule {
  columnName: string;
  controlName: string;
  label: string;
  isColumnNullable?: boolean;
}

export function validateClientDatatableValues(
  columns: DatatableColumnRule[],
  values: Record<string, unknown>
): { ok: true; data: Record<string, unknown> } | { ok: false; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  for (const column of columns) {
    if (column.isColumnNullable) {
      continue;
    }
    const raw = values[column.controlName];
    if (raw === '' || raw === undefined || raw === null) {
      fieldErrors[column.controlName] = `${column.label} is required`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, data: values };
}
