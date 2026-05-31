/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractDatatableRegistration } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

export async function listClientDatatables(): Promise<FineractDatatableRegistration[]> {
  const fineract = await createFineractClient();
  return fineract.get<FineractDatatableRegistration[]>('/datatables', { apptable: 'm_client' });
}

export async function getClientDatatableRows(
  clientId: string | number,
  registeredTableName: string
): Promise<Record<string, unknown>[] | Record<string, unknown> | null> {
  const fineract = await createFineractClient();
  try {
    const data = await fineract.get<Record<string, unknown>[] | Record<string, unknown>>(
      `/datatables/${registeredTableName}/${clientId}`
    );
    return data ?? null;
  } catch {
    return null;
  }
}

/** Fineract returns an array for multi-row (many-to-one) client datatables. */
export function asManyToOneRows(
  data: Record<string, unknown>[] | Record<string, unknown> | null
): Record<string, unknown>[] {
  if (!data) {
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export function formatDatatableColumnLabel(columnName: string): string {
  return columnName
    .replace(/_/g, ' ')
    .replace(/cd/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
