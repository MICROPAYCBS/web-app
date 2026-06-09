/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractSearchResult } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { getClient } from '@/lib/fineract/clients';

export interface SearchEntitiesParams {
  query: string;
  resource?: string;
  exactMatch?: boolean;
}

const CLIENT_CONTACT_BATCH_SIZE = 10;

async function fetchClientContactMap(
  clientIds: number[]
): Promise<Map<number, { mobileNo?: string; emailAddress?: string }>> {
  const unique = [...new Set(clientIds)];
  const map = new Map<number, { mobileNo?: string; emailAddress?: string }>();

  for (let index = 0; index < unique.length; index += CLIENT_CONTACT_BATCH_SIZE) {
    const batch = unique.slice(index, index + CLIENT_CONTACT_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (clientId) => {
        try {
          const client = await getClient(clientId);
          return {
            clientId,
            mobileNo: client.mobileNo?.trim() || undefined,
            emailAddress: client.emailAddress?.trim() || undefined
          };
        } catch {
          return { clientId, mobileNo: undefined, emailAddress: undefined };
        }
      })
    );

    for (const entry of batchResults) {
      map.set(entry.clientId, {
        mobileNo: entry.mobileNo,
        emailAddress: entry.emailAddress
      });
    }
  }

  return map;
}

async function enrichClientContacts(results: FineractSearchResult[]): Promise<FineractSearchResult[]> {
  const clientIds = results.filter((row) => row.entityType === 'CLIENT').map((row) => row.entityId);
  if (clientIds.length === 0) {
    return results;
  }

  const contactMap = await fetchClientContactMap(clientIds);
  return results.map((result) => {
    if (result.entityType !== 'CLIENT') {
      return result;
    }
    const contact = contactMap.get(result.entityId);
    if (!contact) {
      return result;
    }
    return {
      ...result,
      entityMobileNo: contact.mobileNo,
      entityEmail: contact.emailAddress
    };
  });
}

export async function searchEntities({
  query,
  resource = 'clients,clientIdentifiers,groups,savings,shares,loans',
  exactMatch = false
}: SearchEntitiesParams): Promise<FineractSearchResult[]> {
  const fineract = await createFineractClient();
  const results = await fineract.get<FineractSearchResult[]>('/search', {
    query,
    resource,
    exactMatch: exactMatch ? 'true' : 'false'
  });
  return enrichClientContacts(results ?? []);
}
