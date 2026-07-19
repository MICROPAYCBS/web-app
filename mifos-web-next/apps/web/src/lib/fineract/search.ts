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

/** Fineract GET /v1/search — partial match (LIKE %query%) when exactMatch is false. */
const SEARCH_EXACT_MATCH = 'false';

export interface ClientEntitySearchHit {
  id: number;
  displayName: string;
  accountNo?: string;
  officeName?: string;
  officeId?: number;
}

function mapClientSearchHit(result: FineractSearchResult): ClientEntitySearchHit | null {
  if (result.entityType !== 'CLIENT') {
    return null;
  }
  const displayName =
    result.entityName?.trim() ||
    result.entityAccountNo?.trim() ||
    result.entityExternalId?.trim();
  if (!displayName) {
    return null;
  }
  return {
    id: result.entityId,
    displayName,
    accountNo: result.entityAccountNo,
    officeName: result.parentName,
    officeId: result.parentId
  };
}

/** Customer lookup via GET /v1/search (name, account no, external id, mobile). */
export async function searchClientEntities(
  query: string,
  options?: { officeId?: number; limit?: number }
): Promise<ClientEntitySearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const results = await searchEntities({ query: trimmed, resource: 'clients' });
  let hits = results
    .map(mapClientSearchHit)
    .filter((hit): hit is ClientEntitySearchHit => hit !== null);

  if (options?.officeId != null) {
    hits = hits.filter((hit) => hit.officeId === options.officeId);
  }

  if (options?.limit != null && options.limit > 0) {
    hits = hits.slice(0, options.limit);
  }

  return hits;
}

export async function searchEntities({
  query,
  resource = 'clients,clientIdentifiers,groups,savings,shares,loans'
}: SearchEntitiesParams): Promise<FineractSearchResult[]> {
  const fineract = await createFineractClient();
  const results = await fineract.get<FineractSearchResult[]>('/search', {
    query,
    resource,
    exactMatch: SEARCH_EXACT_MATCH
  });
  return enrichClientContacts(results ?? []);
}
