/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientSummary } from '@mifos/api-client';
import { clientDisplayName } from '@/lib/fineract/clients-display';

/** Max customers loaded for client-side filter, search, and sort on the list page. */
export const CLIENTS_TABLE_FETCH_LIMIT = 2000;

/** Category filters applied from the floating sidebar (excludes inline search). */
export type ClientListFilters = {
  officeId?: string;
  statusCode?: string;
};

export function countActiveClientListFilters(filters: ClientListFilters): number {
  let count = 0;
  if (filters.officeId) {
    count += 1;
  }
  if (filters.statusCode) {
    count += 1;
  }
  return count;
}

export function clientListFiltersSignature(filters: ClientListFilters): string {
  return `${filters.officeId ?? ''}|${filters.statusCode ?? ''}`;
}

export function clientSearchHaystack(client: FineractClientSummary): string {
  return [
    client.accountNo,
    client.externalId,
    clientDisplayName(client),
    client.firstname,
    client.lastname,
    client.fullname,
    client.mobileNo,
    client.emailAddress,
    client.alternativeMobileNo,
    client.alternativeEmailAddress,
    client.officeName,
    client.status?.value,
    String(client.id)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function clientMatchesSearch(client: FineractClientSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return clientSearchHaystack(client).includes(needle);
}

export function uniqueClientStatusOptions(
  clients: FineractClientSummary[]
): Array<{ value: string; label: string }> {
  const byCode = new Map<string, string>();
  for (const client of clients) {
    const code = client.status?.code;
    const label = client.status?.value?.trim();
    if (code && label && !byCode.has(code)) {
      byCode.set(code, label);
    }
  }
  return [...byCode.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function filterClientsForTable(
  clients: FineractClientSummary[],
  search: string,
  filters: ClientListFilters
): FineractClientSummary[] {
  const officeIdNum = filters.officeId ? Number(filters.officeId) : undefined;

  return clients.filter((client) => {
    if (officeIdNum != null && Number.isFinite(officeIdNum) && client.officeId !== officeIdNum) {
      return false;
    }
    if (filters.statusCode && client.status?.code !== filters.statusCode) {
      return false;
    }
    if (!clientMatchesSearch(client, search)) {
      return false;
    }
    return true;
  });
}
