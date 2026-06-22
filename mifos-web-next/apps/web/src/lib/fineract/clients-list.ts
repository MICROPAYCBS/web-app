/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientSummary, FineractClientsPage, FineractEnumOption } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

/** Fineract `status_enum` values for closed / terminal client states. */
const CLOSED_CLIENT_STATUS_ENUMS = [600, 700, 701] as const;

const CLOSED_CLIENT_STATUS_CODES = new Set([
  'clientStatusType.closed',
  'clientStatusType.rejected',
  'clientStatusType.withdrawn'
]);

function isClosedClient(client: FineractClientSummary): boolean {
  const code = client.status?.code;
  return code != null && CLOSED_CLIENT_STATUS_CODES.has(code);
}

export interface FetchClientsListParams {
  offset: number;
  limit: number;
  query?: string;
  /** When false (default), closed/rejected/withdrawn clients are excluded on list API. */
  includeClosed?: boolean;
  orderBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface FineractV2ClientSearchItem {
  id?: number;
  accountNo?: string;
  accountNumber?: string;
  displayName?: string;
  firstname?: string;
  lastname?: string;
  officeName?: string;
  externalId?: string;
  active?: boolean;
  status?: FineractEnumOption;
}

interface FineractV2ClientSearchPage {
  content?: FineractV2ClientSearchItem[];
  totalElements?: number;
}

function mapV2Client(item: FineractV2ClientSearchItem): FineractClientSummary {
  const status = item.status ?? { id: 0, value: 'Unknown' };
  return {
    id: item.id ?? 0,
    accountNo: (item.accountNumber ?? item.accountNo ?? '').toString(),
    externalId: item.externalId,
    status,
    active: item.active ?? status.code === 'clientStatusType.active',
    displayName: item.displayName,
    firstname: item.firstname,
    lastname: item.lastname,
    officeName: item.officeName
  };
}

function activeClientsSqlSearch(): string {
  return `c.status_enum not in (${CLOSED_CLIENT_STATUS_ENUMS.join(',')})`;
}

function normalizeClientsListResponse(raw: unknown): FineractClientsPage {
  if (Array.isArray(raw)) {
    return {
      pageItems: raw as FineractClientSummary[],
      totalFilteredRecords: raw.length
    };
  }
  if (raw && typeof raw === 'object') {
    const page = raw as FineractClientsPage;
    if (Array.isArray(page.pageItems)) {
      return {
        pageItems: page.pageItems,
        totalFilteredRecords: page.totalFilteredRecords ?? page.pageItems.length
      };
    }
  }
  return { pageItems: [], totalFilteredRecords: 0 };
}

function filterClosedClients(
  pageItems: FineractClientSummary[],
  includeClosed: boolean | undefined
): FineractClientSummary[] {
  if (includeClosed) {
    return pageItems;
  }
  return pageItems.filter((client) => !isClosedClient(client));
}

/** GET /clients?displayName=… — supported on all Fineract deployments (legacy autocomplete). */
export async function searchClientsByDisplayName(
  params: FetchClientsListParams
): Promise<FineractClientsPage> {
  const query = params.query?.trim() ?? '';
  if (!query) {
    return listClientsPaged(params);
  }

  const fineract = await createFineractClient();
  const searchParams: Record<string, string> = {
    displayName: query,
    orderBy: params.orderBy ?? 'displayName',
    sortOrder: params.sortOrder ?? 'ASC',
    offset: String(params.offset),
    limit: String(params.limit),
    orphansOnly: 'false'
  };

  if (!params.includeClosed) {
    searchParams.sqlSearch = activeClientsSqlSearch();
  }

  const raw = await fineract.get<unknown>('/clients', searchParams);
  const page = normalizeClientsListResponse(raw);
  const pageItems = filterClosedClients(page.pageItems, params.includeClosed);

  return {
    pageItems,
    totalFilteredRecords: page.totalFilteredRecords ?? pageItems.length
  };
}

async function searchClientsV2(params: FetchClientsListParams): Promise<FineractClientsPage> {
  const fineract = await createFineractClient();
  const page = Math.floor(params.offset / params.limit);
  const body: Record<string, unknown> = {
    request: { text: params.query?.trim() ?? '' },
    page,
    size: params.limit
  };

  if (params.orderBy && params.sortOrder) {
    body.sorts = [{ property: params.orderBy, direction: params.sortOrder }];
  }

  const raw = await fineract.post<FineractV2ClientSearchPage>('/v2/clients/search', body);
  let pageItems = (raw.content ?? []).map(mapV2Client);
  pageItems = filterClosedClients(pageItems, params.includeClosed);

  return {
    totalFilteredRecords: raw.totalElements ?? pageItems.length,
    pageItems
  };
}

async function listClientsPaged(params: FetchClientsListParams): Promise<FineractClientsPage> {
  const fineract = await createFineractClient();
  const searchParams: Record<string, string> = {
    offset: String(params.offset),
    limit: String(params.limit)
  };

  if (params.orderBy) {
    searchParams.orderBy = params.orderBy;
    searchParams.sortOrder = params.sortOrder ?? 'ASC';
  }

  if (!params.includeClosed) {
    searchParams.sqlSearch = activeClientsSqlSearch();
  }

  const raw = await fineract.get<FineractClientsPage>('/clients', searchParams);
  return raw;
}

/** List or search clients with server pagination (GET /clients or POST /v2/clients/search). */
export async function fetchClientsList(params: FetchClientsListParams): Promise<FineractClientsPage> {
  const query = params.query?.trim();
  if (query) {
    try {
      return await searchClientsV2(params);
    } catch {
      return searchClientsByDisplayName(params);
    }
  }
  return listClientsPaged(params);
}
